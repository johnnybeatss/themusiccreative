import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getCurrentWeekRange } from "@/lib/weekReports";
import { getMiamiMusicEvents } from "@/lib/miamiMusicEvents";
import {
  buildWeeklyEmailHtml,
  buildWeeklyEmailSubject,
  type MemberSpotlight,
  type PrimaryCta,
  type SpotlightTrack,
  type WeeklyEmailEvent,
  type WeeklyRecap,
} from "@/lib/weeklyEmailTemplate";

const TRACK_BUCKET = "weekly-track";
const MIAMI_EVENTS_LIMIT = 3;
const EXTRAS_ROW_ID = "00000000-0000-0000-0000-000000000001";

// Triggered by Vercel Cron (see vercel.json) every Monday morning. Builds a
// DRAFT Resend Broadcast of this week's upcoming events — never sends it.
// An owner/admin reviews and sends it manually from
// /eboard/weekly-email (see that page's actions.ts for the actual send
// call). This split exists because Johnny's own standing rule is "review
// anything member-/public-facing before it goes out, no autopilot
// sending" (CLAUDE.md) — a fully automatic send would violate that.
//
// Runs with no logged-in user/session (Vercel's scheduler calls it
// directly), so it uses the service-role Supabase client to read events
// and write the draft row, bypassing RLS entirely. The route itself is
// locked down with CRON_SECRET so it can't be triggered by anyone else.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const missing = [
    !resendApiKey && "RESEND_API_KEY",
    !audienceId && "RESEND_AUDIENCE_ID",
    !fromEmail && "RESEND_FROM_EMAIL",
    !siteUrl && "NEXT_PUBLIC_SITE_URL",
  ].filter(Boolean);
  if (missing.length > 0) {
    console.error(`weekly-email-draft: missing env vars: ${missing.join(", ")}`);
    return NextResponse.json(
      { error: `Server misconfigured — missing: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  const { weekStart, weekEnd } = getCurrentWeekRange();
  const supabase = createServiceClient();

  // Idempotent: Vercel cron delivery can occasionally invoke the same
  // scheduled run more than once (their own docs call this out). If a
  // draft for this week already exists, don't create a second Resend
  // broadcast, a duplicate row, or consume weekly_email_extras twice.
  const { data: existing, error: existingError } = await supabase
    .from("weekly_email_drafts")
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existingError) {
    console.error("weekly-email-draft: existing-check failed:", existingError.message);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ skipped: "already drafted this week" });
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, name, date, location, description")
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true });
  if (eventsError) {
    console.error("weekly-email-draft: events query failed:", eventsError.message);
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ skipped: "no upcoming events" });
  }

  const weeklyEvents: WeeklyEmailEvent[] = events;
  const nearestEvent = weeklyEvents[0];

  // --- Optional extras, all opt-in (see 0023_weekly_email_extras.sql) ---
  const { data: extras, error: extrasError } = await supabase
    .from("weekly_email_extras")
    .select("*")
    .eq("id", EXTRAS_ROW_ID)
    .maybeSingle();
  if (extrasError) {
    console.error("weekly-email-draft: extras query failed:", extrasError.message);
    // Not fatal — proceed with defaults rather than blocking the whole
    // week's email over an optional-content read failure.
  }

  const primaryCta: PrimaryCta =
    extras?.primary_cta_label && extras?.primary_cta_url
      ? { label: extras.primary_cta_label, url: extras.primary_cta_url }
      : {
          label: `RSVP for ${nearestEvent.name}`,
          url: `${siteUrl}/events/${nearestEvent.id}`,
        };

  const memberSpotlight: MemberSpotlight | null =
    extras?.member_spotlight_name?.trim() && extras?.member_spotlight_text?.trim()
      ? {
          name: extras.member_spotlight_name.trim(),
          text: extras.member_spotlight_text.trim(),
          link: extras.member_spotlight_link?.trim() || null,
        }
      : null;

  const recap: WeeklyRecap | null = extras?.recap_photo_url
    ? { photoUrl: extras.recap_photo_url, caption: extras.recap_caption || null }
    : null;

  // Weekly Spotlight track — mirrors src/app/layout.tsx's getFeaturedTrack,
  // just via the service client instead of the cookie-based one.
  const { data: trackRow } = await supabase
    .from("weekly_track")
    .select("track_title, artist_name, artist_instagram_url")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const spotlightTrack: SpotlightTrack | null = trackRow
    ? {
        trackTitle: trackRow.track_title,
        artistName: trackRow.artist_name,
        artistInstagramUrl: trackRow.artist_instagram_url ?? null,
      }
    : null;

  // Miami Music teaser — same Ticketmaster source as /opportunities, just
  // a 7-day window instead of the full month, and capped smaller for an
  // email. Quietly empty if TICKETMASTER_API_KEY isn't set.
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const miamiEvents = await getMiamiMusicEvents({
    startDate: now,
    endDate: sevenDaysOut,
    limit: MIAMI_EVENTS_LIMIT,
  });

  const subject =
    extras?.subject_override?.trim() ||
    buildWeeklyEmailSubject(weekStart, weekEnd, nearestEvent.name);
  const html = buildWeeklyEmailHtml({
    weekStart,
    weekEnd,
    events: weeklyEvents,
    siteUrl: siteUrl!,
    primaryCta,
    spotlightTrack,
    memberSpotlight,
    recap,
    miamiEvents,
  });

  const resend = new Resend(resendApiKey!);
  const { data: broadcast, error: broadcastError } = await resend.broadcasts.create({
    audienceId: audienceId!,
    from: fromEmail!,
    subject,
    html,
    name: `Weekly events — ${weekStart}`,
    send: false,
  });
  if (broadcastError || !broadcast) {
    console.error("weekly-email-draft: Resend broadcast create failed:", broadcastError?.message);
    return NextResponse.json(
      { error: broadcastError?.message ?? "Resend broadcast create failed" },
      { status: 500 }
    );
  }

  const { error: insertError } = await supabase.from("weekly_email_drafts").insert({
    week_start: weekStart,
    week_end: weekEnd,
    resend_broadcast_id: broadcast.id,
    subject,
    html,
    event_count: weeklyEvents.length,
  });
  if (insertError) {
    console.error("weekly-email-draft: row insert failed:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Consumed — clear the extras row so next week starts blank instead of
  // silently reusing this week's photo/spotlight/CTA override.
  const { error: resetError } = await supabase
    .from("weekly_email_extras")
    .update({
      primary_cta_label: null,
      primary_cta_url: null,
      subject_override: null,
      member_spotlight_name: null,
      member_spotlight_text: null,
      member_spotlight_link: null,
      recap_photo_url: null,
      recap_caption: null,
    })
    .eq("id", EXTRAS_ROW_ID);
  if (resetError) {
    console.error("weekly-email-draft: extras reset failed:", resetError.message);
    // Not fatal — the draft was already created successfully; worst case
    // is next week's extras form shows stale values to overwrite.
  }

  return NextResponse.json({
    ok: true,
    weekStart,
    eventCount: weeklyEvents.length,
    broadcastId: broadcast.id,
  });
}

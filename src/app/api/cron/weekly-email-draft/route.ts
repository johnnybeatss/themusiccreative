import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getCurrentWeekRange } from "@/lib/weekReports";
import {
  buildWeeklyEmailHtml,
  buildWeeklyEmailSubject,
  type WeeklyEmailEvent,
} from "@/lib/weeklyEmailTemplate";

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
  // broadcast or a duplicate row.
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
  const subject = buildWeeklyEmailSubject(weekStart, weekEnd);
  const html = buildWeeklyEmailHtml({
    weekStart,
    weekEnd,
    events: weeklyEvents,
    siteUrl: siteUrl!,
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

  return NextResponse.json({
    ok: true,
    weekStart,
    eventCount: weeklyEvents.length,
    broadcastId: broadcast.id,
  });
}

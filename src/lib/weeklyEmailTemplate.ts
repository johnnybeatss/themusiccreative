// Builds the subject + HTML for the weekly "upcoming events" email. Pure
// string building, no I/O — called from the cron route
// (src/app/api/cron/weekly-email-draft/route.ts) after it has already
// fetched everything (events, weekly_email_extras, the featured track, and
// Miami Music teaser events).
//
// Table-based layout with fully inline styles throughout: this is an HTML
// email, not a web page, and most email clients (Outlook especially)
// ignore <style> blocks and modern CSS. Matches the site's navy/gold dark
// theme (see src/app/globals.css for the source palette) — Johnny's call
// to keep it consistent with the site over the earlier light-card design,
// despite some email clients (Outlook desktop in particular) handling
// dark backgrounds less predictably than light ones.
//
// Every optional section (spotlight track, member spotlight, recap,
// Miami teaser) is opt-in: pass null/[] and it's simply omitted, not
// rendered empty. See src/app/api/cron/weekly-email-draft/route.ts for how
// weekly_email_extras controls which of these show up in a given week.

import { formatWeekRange } from "./weekReports";
import { formatEventDateTime } from "./eventTimezone";
import type { MiamiMusicEvent } from "./miamiMusicEvents";

// Mirrors src/app/globals.css's --color-* custom properties — email
// clients don't support CSS variables, so these are duplicated as plain
// hex values for the inline styles below.
const COLOR = {
  pageBg: "#10141f", // navy-950
  cardBg: "#1c2136", // navy-900
  cardBorder: "#262d47", // navy-800
  highlightBg: "#262d47", // navy-800, used for the Apply-to-E-Board block
  heading: "#eef0f5", // ivory
  body: "#eef0f5", // ivory
  meta: "#8a97b3", // steel-light
  gold: "#f2b134",
} as const;

export type WeeklyEmailEvent = {
  id: string;
  name: string;
  date: string; // ISO timestamp
  location: string | null;
  description: string | null;
};

export type PrimaryCta = { label: string; url: string };

export type SpotlightTrack = {
  trackTitle: string;
  artistName: string;
  artistInstagramUrl: string | null;
};

export type MemberSpotlight = {
  name: string;
  text: string;
  link: string | null;
};

export type WeeklyRecap = {
  photoUrl: string;
  caption: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escapes first, then turns newlines into <br> — order matters, otherwise
// the <br> tags themselves would get escaped.
function escapeHtmlMultiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

// True click-to-expand (<details>/<summary>, JS toggles) isn't reliable in
// email — Outlook desktop doesn't support <details> at all, so it'd render
// broken or permanently-expanded for a chunk of recipients. This is the
// standard, universally-supported pattern instead: a short preview plus a
// link to the full event page. Cuts at a word boundary so it never chops
// mid-word.
function truncateDescription(
  text: string,
  maxLength = 220
): { preview: string; truncated: boolean } {
  if (text.length <= maxLength) return { preview: text, truncated: false };
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const preview = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
  return { preview: `${preview}…`, truncated: true };
}

// Auto subject when there's no admin override: names the nearest upcoming
// event instead of the generic "This week at..." line — specific subject
// lines read less like a mass blast. Falls back to the generic form if for
// some reason there's no featured event (shouldn't happen in practice: the
// cron route never builds a draft with zero upcoming events).
export function buildWeeklyEmailSubject(
  weekStart: string,
  weekEnd: string,
  featuredEventName?: string | null
): string {
  if (featuredEventName) {
    return `${featuredEventName} — this week at The Music Creative`;
  }
  return `This week at The Music Creative — ${formatWeekRange(weekStart, weekEnd)}`;
}

function buildEventCard(event: WeeklyEmailEvent, siteUrl: string): string {
  const name = escapeHtml(event.name);
  const when = escapeHtml(formatEventDateTime(event.date));
  const location = event.location ? escapeHtml(event.location) : null;
  const rawDescription = event.description?.trim() || null;
  const { preview, truncated } = rawDescription
    ? truncateDescription(rawDescription)
    : { preview: null, truncated: false };
  const description = preview ? escapeHtmlMultiline(preview) : null;
  const linkLabel = truncated ? "Read full details" : "View details";

  return `
    <tr>
      <td style="padding:8px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:10px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0;font-size:15px;font-weight:bold;color:${COLOR.heading};font-family:Arial,Helvetica,sans-serif;">${name}</p>
              <p style="margin:4px 0 0;font-size:12px;color:${COLOR.meta};font-family:Arial,Helvetica,sans-serif;">${when}${location ? ` &middot; ${location}` : ""}</p>
              ${description ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:${COLOR.body};font-family:Arial,Helvetica,sans-serif;">${description}</p>` : ""}
              <p style="margin:12px 0 0;"><a href="${siteUrl}/events/${event.id}" style="font-size:12px;font-weight:bold;color:${COLOR.gold};text-decoration:none;font-family:Arial,Helvetica,sans-serif;">${linkLabel} &rarr;</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildPrimaryCta(cta: PrimaryCta): string {
  const label = escapeHtml(cta.label);
  return `
    <tr>
      <td style="padding:20px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2b134;border-radius:10px;">
          <tr>
            <td style="padding:16px 20px;">
              <a href="${cta.url}" style="display:block;font-size:14px;font-weight:bold;color:#10141f;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">${label} &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildSpotlightSection(track: SpotlightTrack, siteUrl: string): string {
  const trackTitle = escapeHtml(track.trackTitle);
  const artistName = escapeHtml(track.artistName);
  return `
    <tr>
      <td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:10px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLOR.gold};font-family:Arial,Helvetica,sans-serif;">This Week's Spotlight</p>
              <p style="margin:6px 0 0;font-size:15px;font-weight:bold;color:${COLOR.heading};font-family:Arial,Helvetica,sans-serif;">${trackTitle} <span style="font-weight:normal;color:${COLOR.meta};">&mdash; ${artistName}</span></p>
              <p style="margin:10px 0 0;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
                <a href="${siteUrl}/" style="font-weight:bold;color:${COLOR.gold};text-decoration:none;">Listen on the site &rarr;</a>${
                  track.artistInstagramUrl
                    ? ` &nbsp;&middot;&nbsp; <a href="${track.artistInstagramUrl}" style="color:${COLOR.gold};text-decoration:none;">Follow ${artistName} &rarr;</a>`
                    : ""
                }
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildMemberSpotlightSection(spotlight: MemberSpotlight): string {
  const name = escapeHtml(spotlight.name);
  const text = escapeHtmlMultiline(spotlight.text);
  return `
    <tr>
      <td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:10px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLOR.gold};font-family:Arial,Helvetica,sans-serif;">Member Spotlight</p>
              <p style="margin:6px 0 0;font-size:15px;font-weight:bold;color:${COLOR.heading};font-family:Arial,Helvetica,sans-serif;">${name}</p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:${COLOR.body};font-family:Arial,Helvetica,sans-serif;">${text}</p>
              ${spotlight.link ? `<p style="margin:10px 0 0;"><a href="${spotlight.link}" style="font-size:12px;font-weight:bold;color:${COLOR.gold};text-decoration:none;font-family:Arial,Helvetica,sans-serif;">Check it out &rarr;</a></p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildRecapSection(recap: WeeklyRecap): string {
  const caption = recap.caption?.trim()
    ? escapeHtmlMultiline(recap.caption.trim())
    : null;
  return `
    <tr>
      <td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:10px;overflow:hidden;">
          <tr>
            <td>
              <img src="${recap.photoUrl}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;">
              <p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLOR.gold};font-family:Arial,Helvetica,sans-serif;">Last Week at TMC</p>
              ${caption ? `<p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:${COLOR.body};font-family:Arial,Helvetica,sans-serif;">${caption}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildMiamiMusicSection(events: MiamiMusicEvent[]): string {
  const rows = events
    .map((e) => {
      const name = escapeHtml(e.name);
      const dateLabel = new Date(e.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const venue = e.venue ? escapeHtml(e.venue) : null;
      return `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;"><a href="${e.url}" style="color:${COLOR.heading};font-weight:bold;text-decoration:none;">${name}</a><span style="color:${COLOR.meta};"> &mdash; ${dateLabel}${venue ? ` &middot; ${venue}` : ""}</span></p>`;
    })
    .join("");

  return `
    <tr>
      <td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:10px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLOR.gold};font-family:Arial,Helvetica,sans-serif;">Around Miami This Week</p>
              ${rows}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildWeeklyEmailHtml({
  weekStart,
  weekEnd,
  events,
  siteUrl,
  primaryCta,
  spotlightTrack,
  memberSpotlight,
  recap,
  miamiEvents,
}: {
  weekStart: string;
  weekEnd: string;
  events: WeeklyEmailEvent[];
  siteUrl: string;
  primaryCta: PrimaryCta;
  spotlightTrack?: SpotlightTrack | null;
  memberSpotlight?: MemberSpotlight | null;
  recap?: WeeklyRecap | null;
  miamiEvents?: MiamiMusicEvent[];
}): string {
  const weekLabel = formatWeekRange(weekStart, weekEnd);
  const eventsHtml = events.map((e) => buildEventCard(e, siteUrl)).join("");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:${COLOR.pageBg};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.pageBg};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLOR.cardBg};border:1px solid ${COLOR.cardBorder};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${COLOR.pageBg};padding:32px 32px 24px;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLOR.gold};font-weight:bold;font-family:Arial,Helvetica,sans-serif;">The Music Creative @ FIU</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:${COLOR.heading};font-family:Arial,Helvetica,sans-serif;">This Week's Events</h1>
                <p style="margin:6px 0 0;font-size:13px;color:${COLOR.meta};font-family:Arial,Helvetica,sans-serif;">${weekLabel}</p>
              </td>
            </tr>
            ${buildPrimaryCta(primaryCta)}
            <tr>
              <td style="padding:20px 32px 8px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:${COLOR.body};font-family:Arial,Helvetica,sans-serif;">Here's what's coming up this week. Tap an event for the full details.</p>
              </td>
            </tr>
            ${eventsHtml}
            ${spotlightTrack ? buildSpotlightSection(spotlightTrack, siteUrl) : ""}
            ${memberSpotlight ? buildMemberSpotlightSection(memberSpotlight) : ""}
            ${recap ? buildRecapSection(recap) : ""}
            ${miamiEvents && miamiEvents.length > 0 ? buildMiamiMusicSection(miamiEvents) : ""}
            <tr>
              <td style="padding:16px 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.highlightBg};border-radius:10px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:${COLOR.heading};font-family:Arial,Helvetica,sans-serif;">Want to help run the club?</p>
                      <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:${COLOR.meta};font-family:Arial,Helvetica,sans-serif;">We're looking for people to join E-Board. Apply below — resume required.</p>
                      <a href="${siteUrl}/join-team" style="display:inline-block;background-color:${COLOR.gold};color:${COLOR.pageBg};font-size:13px;font-weight:bold;text-decoration:none;padding:10px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">Apply to E-Board</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${COLOR.cardBorder};">
                <p style="margin:0;font-size:11px;line-height:1.6;color:${COLOR.meta};font-family:Arial,Helvetica,sans-serif;">
                  The Music Creative @ FIU &middot; themusiccreative.org<br />
                  <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${COLOR.meta};text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

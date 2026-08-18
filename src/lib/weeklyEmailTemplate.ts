// Builds the subject + HTML for the weekly "upcoming events" email. Pure
// string building, no I/O — called from the cron route
// (src/app/api/cron/weekly-email-draft/route.ts) after it has already
// fetched the events for the week.
//
// Table-based layout with fully inline styles throughout: this is an HTML
// email, not a web page, and most email clients (Outlook especially)
// ignore <style> blocks and modern CSS. Light background on purpose —
// dark-navy emails are more prone to dark-mode-client contrast bugs and
// spam-filter friction than a white card with navy/gold as accents.

import { formatWeekRange } from "./weekReports";
import { formatEventDateTime } from "./eventTimezone";

export type WeeklyEmailEvent = {
  id: string;
  name: string;
  date: string; // ISO timestamp
  location: string | null;
  description: string | null;
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

export function buildWeeklyEmailSubject(
  weekStart: string,
  weekEnd: string
): string {
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
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0;font-size:15px;font-weight:bold;color:#10141f;font-family:Arial,Helvetica,sans-serif;">${name}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#7a828f;font-family:Arial,Helvetica,sans-serif;">${when}${location ? ` &middot; ${location}` : ""}</p>
              ${description ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#444444;font-family:Arial,Helvetica,sans-serif;">${description}</p>` : ""}
              <p style="margin:12px 0 0;"><a href="${siteUrl}/events/${event.id}" style="font-size:12px;font-weight:bold;color:#b5860a;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">${linkLabel} &rarr;</a></p>
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
}: {
  weekStart: string;
  weekEnd: string;
  events: WeeklyEmailEvent[];
  siteUrl: string;
}): string {
  const weekLabel = formatWeekRange(weekStart, weekEnd);
  const eventsHtml = events.map((e) => buildEventCard(e, siteUrl)).join("");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f5f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#10141f;padding:32px 32px 24px;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f2b134;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">The Music Creative @ FIU</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:#eef0f5;font-family:Arial,Helvetica,sans-serif;">This Week's Events</h1>
                <p style="margin:6px 0 0;font-size:13px;color:#8a97b3;font-family:Arial,Helvetica,sans-serif;">${weekLabel}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#333333;font-family:Arial,Helvetica,sans-serif;">Here's what's coming up this week. Tap an event for the full details.</p>
              </td>
            </tr>
            ${eventsHtml}
            <tr>
              <td style="padding:16px 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;border-radius:10px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#10141f;font-family:Arial,Helvetica,sans-serif;">Want to help run the club?</p>
                      <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#555555;font-family:Arial,Helvetica,sans-serif;">We're looking for people to join E-Board. Apply below — resume required.</p>
                      <a href="${siteUrl}/join-team" style="display:inline-block;background-color:#f2b134;color:#10141f;font-size:13px;font-weight:bold;text-decoration:none;padding:10px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">Apply to E-Board</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:#9aa1ae;font-family:Arial,Helvetica,sans-serif;">
                  The Music Creative @ FIU &middot; themusiccreative.org<br />
                  <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#9aa1ae;text-decoration:underline;">Unsubscribe</a>
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

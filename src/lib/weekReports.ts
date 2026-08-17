// Weekly reports run Monday–Sunday, computed in EVENT_TIMEZONE so "this
// week" means the same calendar week for everyone regardless of the
// runtime's own timezone — same class of bug eventTimezone.ts exists to
// avoid (see that file for the full story).

import { EVENT_TIMEZONE } from "./eventTimezone";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Returns the Monday/Sunday (as "YYYY-MM-DD") of the week containing
// `referenceDate`, as read in EVENT_TIMEZONE.
export function getCurrentWeekRange(referenceDate: Date = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = formatter.formatToParts(referenceDate);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const weekdayIndex = WEEKDAYS.indexOf(get("weekday"));

  // Pure calendar arithmetic from here on — anchor at UTC noon (nowhere
  // near a DST boundary) so day-offset math can't accidentally skip or
  // repeat a day.
  const anchor = Date.UTC(year, month - 1, day, 12);
  const monday = new Date(anchor - weekdayIndex * 86_400_000);
  const sunday = new Date(monday.getTime() + 6 * 86_400_000);

  const toDateString = (d: Date) => d.toISOString().slice(0, 10);
  return { weekStart: toDateString(monday), weekEnd: toDateString(sunday) };
}

// "Aug 17–23, 2026" (or "Aug 31 – Sep 6, 2026" across a month boundary).
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(`${weekStart}T12:00:00Z`);
  const end = new Date(`${weekEnd}T12:00:00Z`);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();

  const startFmt = start.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
  const endFmt = end.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });

  return sameMonth ? `${startFmt}–${endFmt}` : `${startFmt} – ${endFmt}`;
}

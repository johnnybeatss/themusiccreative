// All club events happen at FIU (Miami). Event start times must always be
// interpreted and displayed in this timezone — never left to whatever
// timezone the current runtime happens to be in.
//
// This is what the earlier "time keeps changing" bug actually was, in two
// parts:
//  1. Writing: <input type="datetime-local"> has no timezone info at all.
//     Left unconverted, Postgres treats it as UTC (its session timezone),
//     silently shifting every saved time by 4-5 hours.
//  2. Reading: even after (1) was fixed, `new Date(iso).toLocaleString()`
//     formats using whatever timezone the CODE IS RUNNING IN — the
//     visitor's browser for client components, but Vercel's server
//     runtime (UTC) for server components. The Events admin edit form
//     (a client component) happened to show the right time because
//     Johnny's own browser is set to Eastern; the public Events page (a
//     server component) rendered the same stored instant in UTC instead,
//     so the same event showed two different times depending on which
//     page you looked at.
//
// Fix: every read and write of an event's `date` column goes through one
// of the three functions below, all pinned to EVENT_TIMEZONE, so the
// result is identical regardless of where the code executes or what
// timezone the viewer's device is set to.

export const EVENT_TIMEZONE = "America/New_York";

// Converts a "YYYY-MM-DDTHH:mm" datetime-local value — read as wall-clock
// time in `timeZone` — into a correct UTC ISO timestamp for storage.
// DST-aware: derives the real offset for that specific date from the IANA
// tz database via Intl, rather than hardcoding UTC-4/UTC-5.
export function zonedDateTimeToUtcIso(
  dateTimeLocal: string,
  timeZone: string = EVENT_TIMEZONE
): string {
  const [datePart, timePart] = dateTimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);

  // First guess: treat the wall-clock value as if it were already UTC.
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Read that instant back in the target timezone, and correct by however
  // far off the guess was — this is what makes it DST-correct automatically.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(guessUtc));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const tzReading = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24, // some ICU builds format midnight as "24"
    get("minute")
  );

  const offsetMs = tzReading - guessUtc;
  return new Date(guessUtc - offsetMs).toISOString();
}

// Inverse of the above — converts a stored UTC ISO timestamp into a
// "YYYY-MM-DDTHH:mm" datetime-local value showing the wall-clock time in
// `timeZone`, for pre-filling the Events admin edit form. Deliberately
// does NOT use `new Date(iso).getHours()` etc., since those read the
// runtime's local timezone rather than a fixed one.
export function isoToZonedDateTimeLocal(
  iso: string,
  timeZone: string = EVENT_TIMEZONE
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(iso));
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

// For display anywhere an event's date/time is shown — public pages,
// E-board hub, exports. Always renders in `timeZone`, and includes the
// zone abbreviation (EDT/EST) so it's unambiguous to anyone viewing from
// outside Eastern time.
export function formatEventDateTime(
  iso: string,
  timeZone: string = EVENT_TIMEZONE
): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// An event counts as upcoming until this long after its start time, so a
// show that's happening right now doesn't flip to "past" the moment it
// begins. Shared by /events, the event page, and the homepage countdown.
export const EVENT_IN_PROGRESS_MS = 6 * 60 * 60 * 1000;

export function isEventPast(iso: string, now: number = Date.now()): boolean {
  return new Date(iso).getTime() + EVENT_IN_PROGRESS_MS < now;
}

// Events on or after this instant are still "upcoming" (see above).
export function upcomingCutoffIso(now: number = Date.now()): string {
  return new Date(now - EVENT_IN_PROGRESS_MS).toISOString();
}

// Today's date (YYYY-MM-DD) in Eastern, not UTC — UTC rolls over at
// 7/8 PM Eastern, which made "due today" listings vanish in the evening.
export function easternToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: EVENT_TIMEZONE });
}

// "Oct 28" for a Ticketmaster show. Their `dateTime` is a UTC instant, so it
// has to be read in Eastern — formatted in UTC (what the server runs in), an
// 8 PM show landed on the next day. Date-only values ("2026-10-28", no time
// announced) parse as UTC midnight, so those stay in UTC.
export function formatMiamiEventDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(date) ? "UTC" : EVENT_TIMEZONE,
  });
}

"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";

const SITE_URL = "https://themusiccreative.org";

// Events only store a single start `date` — no end time in the schema —
// so every calendar link below assumes a 2-hour block from start, same as
// most "add to calendar" widgets default to when a duration isn't given.
// Good enough for a workshop/mixer; if an event ever needs a real end
// time, this is the one spot that would need an events.end_date column.
const DEFAULT_DURATION_HOURS = 2;

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// RFC 5545 §3.3.11 TEXT escaping — backslash, semicolon, and comma are
// escaped, and real newlines become the literal two-character sequence
// "\n" (not folded per §3.1, which is a minor spec simplification that
// every calendar app tested against — Apple/Google/Outlook — tolerates
// fine for descriptions this short).
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function buildIcs({
  eventId,
  eventName,
  description,
  location,
  start,
  end,
}: {
  eventId: string;
  eventName: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Music Creative @ FIU//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${eventId}@themusiccreative.org`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(eventName)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  lines.push(`URL:${SITE_URL}/events/${eventId}`, "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export default function AddToCalendarButton({
  eventId,
  eventName,
  description,
  location,
  startIso,
  durationHours = DEFAULT_DURATION_HOURS,
}: {
  eventId: string;
  eventName: string;
  description: string | null;
  location: string | null;
  startIso: string;
  durationHours?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  function handleGoogle() {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: eventName,
      dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
      details: description ?? "",
      location: location ?? "",
    });
    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noreferrer"
    );
    setOpen(false);
  }

  function handleOutlook() {
    const params = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      subject: eventName,
      location: location ?? "",
      body: description ?? "",
    });
    window.open(
      `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`,
      "_blank",
      "noreferrer"
    );
    setOpen(false);
  }

  // Apple Calendar has no web "add event" URL scheme — a downloaded .ics
  // file is the standard way in (double-click on Mac, tap-to-open on iOS,
  // and it also works as a generic fallback for any other calendar app).
  function handleIcsDownload() {
    const ics = buildIcs({ eventId, eventName, description, location, start, end });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-navy-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-steel-light transition-colors hover:border-gold hover:text-gold"
      >
        <CalendarPlus size={14} />
        Add to Calendar
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-44 overflow-hidden rounded-lg border border-navy-800 bg-navy-900 shadow-lg">
          <button
            type="button"
            onClick={handleGoogle}
            className="block w-full px-4 py-2 text-left text-sm text-steel-light transition-colors hover:bg-navy-800 hover:text-ivory"
          >
            Google Calendar
          </button>
          <button
            type="button"
            onClick={handleIcsDownload}
            className="block w-full px-4 py-2 text-left text-sm text-steel-light transition-colors hover:bg-navy-800 hover:text-ivory"
          >
            Apple Calendar
          </button>
          <button
            type="button"
            onClick={handleOutlook}
            className="block w-full px-4 py-2 text-left text-sm text-steel-light transition-colors hover:bg-navy-800 hover:text-ivory"
          >
            Outlook
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEventDateTime } from "@/lib/eventTimezone";

export type NextEvent = {
  id: string;
  name: string;
  date: string;
  location: string | null;
};

function getCountdownParts(target: number, now: number) {
  const diffMs = target - now;
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

// Homepage urgency banner for the soonest upcoming event. The countdown
// itself only ever renders client-side (see the `now === null` guard) —
// Date.now() during server rendering would nearly always disagree with the
// visitor's own clock by the time hydration runs, causing a hydration
// mismatch. Ticks once a minute, which is plenty for a days/hours/minutes
// display.
export default function NextEventCountdown({ event }: { event: NextEvent }) {
  const target = new Date(event.date).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const parts = now !== null ? getCountdownParts(target, now) : null;

  return (
    <Link
      href={`/events/${event.id}`}
      className="relative mt-10 block overflow-hidden rounded-2xl border border-gold/40 bg-navy-900 p-6 transition-colors hover:border-gold sm:mt-12 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl"
      />
      <p className="relative text-xs font-semibold uppercase tracking-wide text-gold">
        Next Up
      </p>
      <h2 className="relative mt-2 font-display text-2xl tracking-wide text-ivory sm:text-3xl">
        {event.name}
      </h2>
      <p className="relative mt-2 text-sm text-steel-light">
        {formatEventDateTime(event.date)}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      {parts && (
        <div className="relative mt-5 flex gap-5">
          {[
            { value: parts.days, label: "Days" },
            { value: parts.hours, label: "Hrs" },
            { value: parts.minutes, label: "Min" },
          ].map((p) => (
            <div key={p.label} className="text-center">
              <p className="font-display text-2xl text-gold sm:text-3xl">
                {p.value}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-steel-light">
                {p.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="relative mt-5 inline-block text-sm font-semibold text-gold">
        RSVP &rarr;
      </p>
    </Link>
  );
}

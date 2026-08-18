"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

// Compact "next event" badge pinned to the top-right corner of the
// homepage hero — mirrors the "Est. 2025" badge already in the opposite
// (bottom-right) corner, same treatment. Hidden below sm to match that
// badge's existing responsive behavior (hero is already tight on mobile).
//
// The countdown only ever renders client-side (see the `now === null`
// guard) — Date.now() during server rendering would almost always
// disagree with the visitor's own clock by the time hydration runs,
// causing a hydration mismatch. Ticks once a minute.
export default function NextEventCountdown({ event }: { event: NextEvent }) {
  const target = new Date(event.date).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const parts = now !== null ? getCountdownParts(target, now) : null;
  const shortDate = new Date(event.date).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/events/${event.id}`}
      className="absolute right-6 top-6 hidden w-80 overflow-hidden rounded-xl border-2 border-gold bg-navy-900/95 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform hover:scale-[1.02] sm:block md:w-96 lg:w-[420px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/25 blur-2xl"
      />
      <p className="relative text-[11px] font-semibold uppercase tracking-wider text-gold">
        Next Up
      </p>
      <p className="relative mt-1.5 truncate font-display text-base tracking-wide text-ivory">
        {event.name}
      </p>
      <p className="relative mt-1 text-xs text-steel-light">{shortDate}</p>
      {parts && (
        <p className="relative mt-3 font-display text-2xl tracking-wide text-gold">
          {parts.days}d {parts.hours}h {parts.minutes}m
        </p>
      )}
    </Link>
  );
}

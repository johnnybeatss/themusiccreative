"use client";

import { useState } from "react";
import Link from "next/link";
import SubmitTrackForm from "./SubmitTrackForm";

// The homepage's "Weekly Contest" promo card — the button that used to
// open an Instagram DM now expands this same card into the actual
// submission form in place, instead of sending people off-site. The
// FeaturedTrackBar's "Submit yours" link (site-wide bottom bar) points at
// /#submit-track to land back here from any page.
export default function TrackSubmitSection() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div
      id="submit-track"
      className="relative mt-16 overflow-hidden rounded-2xl border border-gold/40 bg-navy-900 p-8 sm:mt-20 sm:p-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl"
      />
      <p className="relative text-xs font-semibold uppercase tracking-wide text-accent">
        Weekly Contest
      </p>
      <h2 className="relative mt-2 font-display text-3xl leading-snug tracking-wide text-ivory sm:text-4xl">
        GET YOUR TRACK ON THE SITE
      </h2>
      <p className="relative mt-4 max-w-lg text-lg font-semibold text-ivory">
        Every week we feature one member&apos;s track in the player at the
        bottom of the site — everyone who visits hears it. Submit yours for a
        shot at the spotlight.
      </p>

      {done ? (
        <div className="relative mt-6 max-w-lg rounded-xl border border-gold/50 bg-navy-950 p-5">
          <p className="font-display text-lg tracking-wide text-accent">
            TRACK RECEIVED
          </p>
          <p className="mt-2 text-sm text-steel-light">
            Each week E-Board picks submissions for the Spotlight Battle.
            Everyone votes on the site, and the winner takes over the player.{" "}
            <Link href="/battles" className="font-semibold text-accent hover:underline">
              See the battles &rarr;
            </Link>
          </p>
        </div>
      ) : open ? (
        <div className="relative mt-6 max-w-lg">
          <SubmitTrackForm onSubmitted={() => setDone(true)} />
        </div>
      ) : (
        <div className="relative mt-6 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-block w-fit rounded-full bg-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-light"
          >
            Submit Your Track
          </button>
          <Link
            href="/battles"
            className="text-sm font-semibold text-accent transition-colors hover:text-accent"
          >
            Vote in this week&apos;s battle &rarr;
          </Link>
          <Link
            href="/spotlights"
            className="text-sm font-semibold text-accent transition-colors hover:text-accent"
          >
            See past spotlights &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

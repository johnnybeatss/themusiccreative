"use client";

import { useState } from "react";
import Link from "next/link";
import SubmitTrackForm from "./SubmitTrackForm";

// The homepage's "Weekly Contest" promo card — the button that used to
// open an Instagram DM now expands this same card into the actual
// submission form in place, instead of sending people off-site. The
// FeaturedTrackBar's "Submit yours" link (site-wide bottom bar) points at
// /#submit-track to land back here from any page.
export default function TrackSubmitSection({
  openBattleId = null,
}: {
  // Set when a Spotlight Battle is taking submissions — entries go straight in.
  openBattleId?: string | null;
}) {
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
        GET YOUR MUSIC ON THE SITE
      </h2>
      <p className="relative mt-4 max-w-lg text-lg font-semibold text-ivory">
        Beats, songs, mixes — whatever you made. Everything goes head to head
        in the weekly Spotlight Battle, everyone votes, and the winner plays
        at the bottom of the site for the whole week.
      </p>

      {done ? (
        <div className="relative mt-6 max-w-lg rounded-xl border border-gold/50 bg-navy-950 p-5">
          <p className="font-display text-lg tracking-wide text-accent">
            TRACK RECEIVED
          </p>
          <p className="mt-2 text-sm text-steel-light">
            {openBattleId
              ? "You're in this week's Spotlight Battle. Share the link and get your people to vote before Friday 11:59 PM. "
              : "Got it — E-Board will add it to the next Spotlight Battle. "}
            <Link
              href={openBattleId ? `/battles/${openBattleId}` : "/battles"}
              className="font-semibold text-accent hover:underline"
            >
              See the battle &rarr;
            </Link>
          </p>
        </div>
      ) : open ? (
        <div className="relative mt-6 max-w-lg">
          <SubmitTrackForm battleId={openBattleId} onSubmitted={() => setDone(true)} />
        </div>
      ) : (
        <div className="relative mt-6 flex flex-wrap items-center gap-5">
          {openBattleId ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-block w-fit rounded-full bg-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-light"
            >
              Submit Your Music
            </button>
          ) : (
            // Weekend: battles run Mon 12 AM - Fri 11:59 PM, winner Sunday (0042).
            <p className="text-sm font-semibold text-ivory">
              Submissions open Monday at 12 AM.
            </p>
          )}
          <Link
            href="/battles"
            className="text-sm font-semibold text-accent transition-colors hover:text-accent"
          >
            Vote in this week&apos;s battle &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import SubmitTrackForm from "@/components/trackSubmit/SubmitTrackForm";

// Same form as the homepage card — one submission flow for all music.
export default function BattleSubmit({ battleId }: { battleId: string }) {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <div className="max-w-lg rounded-xl border border-gold/50 bg-navy-900 p-5">
        <p className="font-semibold text-ivory">You&apos;re in.</p>
        <p className="mt-1 text-sm text-steel-light">
          Voting opens when submissions close — share this page and get your
          people to vote.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-lg">
      <h2 className="mb-3 font-display text-xl tracking-wide text-ivory">ENTER THIS BATTLE</h2>
      <SubmitTrackForm battleId={battleId} onSubmitted={() => setDone(true)} />
    </div>
  );
}

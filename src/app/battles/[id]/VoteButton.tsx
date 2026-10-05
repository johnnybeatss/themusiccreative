"use client";

import { useState, useTransition } from "react";
import { castVote } from "./actions";

export default function VoteButton({
  battleId,
  entryId,
  disabled,
}: {
  battleId: string;
  entryId: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await castVote(battleId, entryId);
            setError(res.error);
          })
        }
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Voting..." : "Vote"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";
import { markBattleEntryRead, setEntryApproved, deleteEntry, crownWinner } from "./actions";

export type AdminEntry = {
  id: string;
  battle_id: string;
  producer_name: string;
  beat_title: string | null;
  producer_instagram_url: string | null;
  storage_path: string;
  approved_at: string | null;
  read_at: string | null;
  created_at: string;
  audio_url: string | null;
  votes: number;
};

const pill = "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide";
const smallBtn =
  "rounded-full border border-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-gold hover:text-white";

// Marks itself read when scrolled into view — same IntersectionObserver
// pattern as TrackSubmissionItem.
export default function BattleEntryItem({
  entry: e,
  isWinner,
  ownerView,
}: {
  entry: AdminEntry;
  isWinner: boolean;
  ownerView: boolean;
}) {
  const [read, setRead] = useState(!!e.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([hit]) => {
        if (hit.isIntersecting) {
          setRead(true);
          markBattleEntryRead(e.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, e.id]);

  const label = e.beat_title || "Untitled";

  return (
    <li
      ref={ref}
      className={`rounded-lg border p-3 ${read ? "border-navy-800" : "border-gold/50"} bg-navy-950`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ivory">
            {label} <span className="font-normal text-steel-light">— {e.producer_name}</span>
          </p>
          {!read && <span className={`${pill} bg-gold text-white`}>New</span>}
          {e.approved_at ? (
            <span className={`${pill} border border-gold text-accent`}>Approved</span>
          ) : (
            <span className={`${pill} border border-navy-800 text-steel-light`}>Pending</span>
          )}
          {isWinner && <span className={`${pill} bg-gold text-white`}>Winner</span>}
        </div>
        <p className="text-xs text-steel-light">
          {e.votes} vote{e.votes === 1 ? "" : "s"}
        </p>
      </div>
      {e.producer_instagram_url && (
        <a
          href={e.producer_instagram_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-steel-light hover:text-accent"
        >
          <Instagram size={12} /> {e.producer_instagram_url}
        </a>
      )}
      {e.audio_url && <audio controls src={e.audio_url} preload="none" className="mt-2 w-full" />}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <form action={setEntryApproved}>
          <input type="hidden" name="id" value={e.id} />
          <input type="hidden" name="battle_id" value={e.battle_id} />
          <input type="hidden" name="approve" value={e.approved_at ? "0" : "1"} />
          <button type="submit" className={smallBtn}>
            {e.approved_at ? "Unapprove" : "Approve"}
          </button>
        </form>
        {ownerView && e.approved_at && !isWinner && (
          <form
            action={crownWinner}
            onSubmit={(ev) => {
              if (
                !confirm(
                  `Crown "${label}" by ${e.producer_name}? This closes the battle and replaces what's live in the site-wide player.`
                )
              )
                ev.preventDefault();
            }}
          >
            <input type="hidden" name="entry_id" value={e.id} />
            <input type="hidden" name="battle_id" value={e.battle_id} />
            <button type="submit" className={smallBtn}>
              Crown winner
            </button>
          </form>
        )}
        <form
          action={deleteEntry}
          onSubmit={(ev) => {
            if (!confirm(`Delete "${label}"? This can't be undone.`)) ev.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={e.id} />
          <input type="hidden" name="battle_id" value={e.battle_id} />
          <input type="hidden" name="storage_path" value={e.storage_path} />
          <button type="submit" className="text-xs text-steel-light hover:text-red-400">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}

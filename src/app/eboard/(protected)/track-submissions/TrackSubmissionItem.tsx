"use client";

import { useEffect, useRef, useState } from "react";
import { markTrackSubmissionRead, addSubmissionToBattle } from "./actions";
import DeleteSubmissionButton from "./DeleteSubmissionButton";
import FeatureButton from "./FeatureButton";
import StreamingEmbedButtons from "@/components/StreamingEmbedButtons";
import { Instagram } from "lucide-react";

export type TrackSubmission = {
  id: string;
  track_title: string;
  artist_name: string;
  artist_instagram_url: string;
  spotify_url: string | null;
  apple_music_url: string | null;
  storage_path: string;
  audio_url: string | null;
  read_at: string | null;
  featured_at: string | null;
  created_at: string;
};

export type OpenBattle = { id: string; title: string; status: string };

// Marks itself read the moment it scrolls into view — same
// IntersectionObserver pattern as TeamApplicationItem/JoinSubmissionItem/
// DjInquiryItem. Shared team-inbox model: once anyone's seen it, it's read
// for every owner/admin.
export default function TrackSubmissionItem({
  submission: s,
  isOwnerView,
  openBattles,
  inBattleIds,
}: {
  submission: TrackSubmission;
  isOwnerView: boolean;
  openBattles: OpenBattle[];
  inBattleIds: string[];
}) {
  const addable = openBattles.filter((b) => !inBattleIds.includes(b.id));
  const inTitles = openBattles.filter((b) => inBattleIds.includes(b.id)).map((b) => b.title);
  const [read, setRead] = useState(!!s.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRead(true);
          markTrackSubmissionRead(s.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, s.id]);

  return (
    <li
      ref={ref}
      className={`rounded-xl border p-4 transition-colors hover:border-gold ${
        read ? "border-navy-800 bg-navy-900" : "border-gold/50 bg-navy-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ivory">
            {s.track_title}{" "}
            <span className="font-normal text-steel-light">
              — {s.artist_name}
            </span>
          </p>
          {!read && (
            <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
          {s.featured_at && (
            <span className="inline-block rounded-full border border-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs text-steel-light">
          {new Date(s.created_at).toLocaleString()}
        </p>
      </div>

      <a
        href={s.artist_instagram_url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs text-steel-light transition-colors hover:text-accent"
      >
        <Instagram size={12} />
        {s.artist_instagram_url}
      </a>

      <StreamingEmbedButtons
        appleMusicUrl={s.apple_music_url}
        spotifyUrl={s.spotify_url}
        className="mt-2"
      />

      {s.audio_url ? (
        <audio controls src={s.audio_url} className="mt-3 w-full" preload="none" />
      ) : (
        <p className="mt-2 text-xs text-steel-light">
          Couldn&apos;t generate a preview link for the uploaded file — try
          refreshing the page.
        </p>
      )}

      {inTitles.length > 0 && (
        <p className="mt-2 text-xs text-accent">In battle: {inTitles.join(", ")}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {addable.length > 0 && s.storage_path && (
          <form action={addSubmissionToBattle} className="flex items-center gap-2">
            <input type="hidden" name="id" value={s.id} />
            <select
              name="battle_id"
              defaultValue={addable[0].id}
              aria-label="Battle"
              className="rounded-lg border border-navy-800 bg-navy-950 px-2 py-1.5 text-xs text-ivory focus:border-gold focus:outline-none"
            >
              {addable.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-light"
            >
              Add to battle
            </button>
          </form>
        )}
        {isOwnerView && (
          <FeatureButton
            id={s.id}
            trackTitle={s.track_title}
            artistName={s.artist_name}
            artistInstagramUrl={s.artist_instagram_url}
            appleMusicUrl={s.apple_music_url}
            spotifyUrl={s.spotify_url}
            storagePath={s.storage_path}
          />
        )}
        <DeleteSubmissionButton
          id={s.id}
          trackTitle={s.track_title}
          storagePath={s.storage_path}
        />
      </div>
    </li>
  );
}

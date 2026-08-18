"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { editTrack, refeatureTrack, type TrackFormState } from "./actions";
import TrackDeleteForm from "./TrackDeleteForm";
import StreamingEmbedButtons from "@/components/StreamingEmbedButtons";

export type WeeklyTrack = {
  id: string;
  track_title: string;
  artist_name: string;
  artist_instagram_url: string | null;
  apple_music_url: string | null;
  spotify_url: string | null;
  storage_path: string;
  audio_url: string;
  updated_at: string;
};

const initialState: TrackFormState = { error: null };
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";

// Renders both the "Currently featured" card and every row in the Past
// Spotlights archive — same data shape, same edit/feature/delete
// controls, just with isCurrent toggling a couple of copy/behavior
// differences ("Feature this" makes no sense on the track that's already
// live). `editable` mirrors the page's isOwner() gate — eboard/admin get
// a read-only view, same as before this component existed.
export default function TrackHistoryItem({
  track,
  isCurrent,
  editable,
}: {
  track: WeeklyTrack;
  isCurrent: boolean;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(editTrack, initialState);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <div className="rounded-xl border border-gold/50 bg-navy-900 p-4">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={track.id} />
          <label className={labelClass}>
            <span className="text-steel-light">Track title</span>
            <input
              type="text"
              name="track_title"
              required
              autoFocus
              defaultValue={track.track_title}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className="text-steel-light">Artist name</span>
            <input
              type="text"
              name="artist_name"
              required
              defaultValue={track.artist_name}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className="text-steel-light">Artist Instagram</span>
            <input
              type="text"
              name="artist_instagram"
              defaultValue={track.artist_instagram_url ?? ""}
              placeholder="@handle or full profile link"
              className={inputClass}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className="text-steel-light">Spotify link</span>
              <input
                type="url"
                name="spotify_url"
                defaultValue={track.spotify_url ?? ""}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className="text-steel-light">Apple Music link</span>
              <input
                type="url"
                name="apple_music_url"
                defaultValue={track.apple_music_url ?? ""}
                className={inputClass}
              />
            </label>
          </div>
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-steel-light hover:text-ivory"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-4">
      {isCurrent && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gold">
          Currently featured
        </p>
      )}
      <p className={`font-semibold text-ivory ${isCurrent ? "mt-1" : ""}`}>
        {track.track_title} — {track.artist_name}
      </p>
      {track.artist_instagram_url && (
        <a
          href={track.artist_instagram_url}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-gold underline"
        >
          {track.artist_instagram_url}
        </a>
      )}
      {!isCurrent && (
        <p className="mt-1 text-xs text-steel-light">
          Featured {new Date(track.updated_at).toLocaleDateString()}
        </p>
      )}
      <StreamingEmbedButtons
        appleMusicUrl={track.apple_music_url}
        spotifyUrl={track.spotify_url}
        className="mt-2"
      />
      <audio
        controls
        src={track.audio_url}
        className="mt-3 w-full"
        preload="none"
      />
      {editable && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-steel-light transition-colors hover:text-gold"
          >
            Edit
          </button>
          {!isCurrent && (
            <form
              action={refeatureTrack}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `Feature "${track.track_title}" again? This replaces whatever's currently live in the site-wide player.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="track_title" value={track.track_title} />
              <input type="hidden" name="artist_name" value={track.artist_name} />
              <input type="hidden" name="storage_path" value={track.storage_path} />
              <input
                type="hidden"
                name="artist_instagram_url"
                value={track.artist_instagram_url ?? ""}
              />
              <input
                type="hidden"
                name="apple_music_url"
                value={track.apple_music_url ?? ""}
              />
              <input
                type="hidden"
                name="spotify_url"
                value={track.spotify_url ?? ""}
              />
              <button
                type="submit"
                className="rounded-full border border-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-navy-950"
              >
                Feature this
              </button>
            </form>
          )}
          <TrackDeleteForm
            id={track.id}
            trackTitle={track.track_title}
            storagePath={track.storage_path}
            label={isCurrent ? "Remove featured track" : "Delete"}
            confirmMessage={
              isCurrent
                ? undefined
                : `Delete "${track.track_title}" from history? This can't be undone.`
            }
          />
        </div>
      )}
    </div>
  );
}

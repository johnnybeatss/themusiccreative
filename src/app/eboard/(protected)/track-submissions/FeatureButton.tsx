"use client";

import { featureSubmission } from "./actions";

export default function FeatureButton({
  id,
  trackTitle,
  artistName,
  artistInstagramUrl,
  appleMusicUrl,
  spotifyUrl,
  storagePath,
}: {
  id: string;
  trackTitle: string;
  artistName: string;
  artistInstagramUrl: string;
  appleMusicUrl: string | null;
  spotifyUrl: string | null;
  storagePath: string;
}) {
  return (
    <form
      action={featureSubmission}
      onSubmit={(e) => {
        if (
          !confirm(
            `Feature "${trackTitle}" as this week's spotlight? This replaces whatever's currently live in the site-wide player.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="storage_path" value={storagePath} />
      <input type="hidden" name="track_title" value={trackTitle} />
      <input type="hidden" name="artist_name" value={artistName} />
      <input
        type="hidden"
        name="artist_instagram_url"
        value={artistInstagramUrl}
      />
      <input type="hidden" name="apple_music_url" value={appleMusicUrl ?? ""} />
      <input type="hidden" name="spotify_url" value={spotifyUrl ?? ""} />
      <button
        type="submit"
        className="rounded-full border border-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-navy-950"
      >
        Feature this
      </button>
    </form>
  );
}

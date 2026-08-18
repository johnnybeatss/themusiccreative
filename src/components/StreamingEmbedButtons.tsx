"use client";

import { useState } from "react";
import { toAppleMusicEmbedUrl, toSpotifyEmbedUrl } from "@/lib/streamingEmbeds";

// Replaces plain "open in a new tab" links with toggleable inline players
// — clicking "Spotify"/"Apple Music" expands the platform's own official
// embed widget right on the page instead of navigating away. Used
// anywhere in normal page flow (admin panels, the spotlights archive);
// NOT used in the site-wide FeaturedTrackBar, whose fixed-height bottom
// bar has no room for a ~150px iframe — that one keeps plain link-out
// buttons.
export default function StreamingEmbedButtons({
  appleMusicUrl,
  spotifyUrl,
  className,
}: {
  appleMusicUrl?: string | null;
  spotifyUrl?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState<"apple" | "spotify" | null>(null);

  if (!appleMusicUrl && !spotifyUrl) return null;

  const appleEmbed = appleMusicUrl ? toAppleMusicEmbedUrl(appleMusicUrl) : null;
  const spotifyEmbed = spotifyUrl ? toSpotifyEmbedUrl(spotifyUrl) : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {appleMusicUrl && appleEmbed && (
          <button
            type="button"
            onClick={() => setOpen(open === "apple" ? null : "apple")}
            className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
          >
            {open === "apple" ? "Hide player" : "Apple Music"}
          </button>
        )}
        {spotifyUrl && spotifyEmbed && (
          <button
            type="button"
            onClick={() => setOpen(open === "spotify" ? null : "spotify")}
            className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
          >
            {open === "spotify" ? "Hide player" : "Spotify"}
          </button>
        )}
        {/* Fall back to a plain external link if a URL didn't match the
            expected host (unusual, e.g. a shortened link) and couldn't
            be converted to an embed. */}
        {appleMusicUrl && !appleEmbed && (
          <a
            href={appleMusicUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
          >
            Apple Music
          </a>
        )}
        {spotifyUrl && !spotifyEmbed && (
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
          >
            Spotify
          </a>
        )}
      </div>
      {open === "apple" && appleEmbed && (
        <iframe
          src={appleEmbed}
          allow="autoplay *; encrypted-media *;"
          className="mt-2 w-full rounded-xl"
          style={{ border: 0, height: 150 }}
          loading="lazy"
          title="Apple Music player"
        />
      )}
      {open === "spotify" && spotifyEmbed && (
        <iframe
          src={spotifyEmbed}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="mt-2 w-full rounded-xl"
          style={{ border: 0, height: 152 }}
          loading="lazy"
          title="Spotify player"
        />
      )}
    </div>
  );
}

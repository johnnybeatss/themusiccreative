"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, X } from "lucide-react";

const INSTAGRAM_DM_URL = "https://instagram.com/themusiccreativefiu";

export type FeaturedTrack = {
  track_title: string;
  artist_name: string;
  audio_url: string;
};

// Fixed to the bottom of every page. Deliberately loud/animated — this is
// the weekly contest's whole pitch ("get your track played site-wide"), so
// it needs to actually look like a prize, not a quiet utility bar.
export default function FeaturedTrackBar({
  track,
}: {
  track: FeaturedTrack;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  }

  return (
    <>
      {/* Spacer so the fixed bar never covers page content/footer. */}
      <div className="h-[76px]" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-navy-900/95 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
        <div className="h-[3px] w-full bg-navy-800">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-light transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-navy-950 transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Equalizer — only animates while actually playing. */}
          <div className="flex h-6 shrink-0 items-end gap-[3px]" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-gold"
                style={{
                  animation: playing
                    ? `eq 0.9s ease-in-out ${i * 0.15}s infinite`
                    : "none",
                  height: playing ? undefined : "4px",
                }}
              />
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">
              This Week&apos;s Spotlight
            </p>
            <p className="truncate text-sm font-semibold text-ivory">
              {track.track_title}{" "}
              <span className="font-normal text-steel-light">
                — {track.artist_name}
              </span>
            </p>
          </div>

          <Link
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 rounded-full border border-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-navy-950 sm:block"
          >
            Submit yours →
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 text-steel-light transition-colors hover:text-ivory"
          >
            <X size={18} />
          </button>

          <audio
            ref={audioRef}
            src={track.audio_url}
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={onTimeUpdate}
            className="hidden"
          />
        </div>
      </div>
    </>
  );
}

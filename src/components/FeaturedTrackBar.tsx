"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Instagram, Pause, Play, X } from "lucide-react";

const INSTAGRAM_DM_URL = "https://instagram.com/themusiccreativefiu";

// Module-level, not component state — deliberately survives even if this
// bar remounts during client-side navigation between pages. Autoplay
// should fire at most once per page load, and never again once the
// visitor has paused it themselves, no matter how many more times they
// click around the site afterward.
let hasAutoStarted = false;
let userPaused = false;

export type FeaturedTrack = {
  track_title: string;
  artist_name: string;
  audio_url: string;
  artist_instagram_url?: string | null;
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

  // Browsers block unmuted autoplay until the visitor has interacted with
  // the page (or the site has built up enough "media engagement" from
  // repeat visits) — no website can force sound on load, that's a
  // deliberate platform rule, not something to work around. So: try to
  // play immediately, and if that's blocked, start on the very first
  // click/tap/keypress anywhere on the page instead of waiting for someone
  // to find the play button.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // Only ever auto-start once per page load, and never once the visitor
    // has paused it themselves — otherwise every later click anywhere on
    // the site would re-trigger the fallback below and unpause it.
    if (hasAutoStarted || userPaused) return;

    // Best case: this just works (repeat visitors, or browsers with a high
    // enough media-engagement score for the site).
    el.play()
      .then(() => {
        hasAutoStarted = true;
      })
      .catch(() => {});

    // Fallback: start on the visitor's very first interaction anywhere on
    // the page, rather than waiting for someone to notice the play button.
    // Harmless to also fire this if autoplay above already succeeded —
    // calling play() on already-playing audio is a no-op.
    const startOnInteraction = () => {
      if (hasAutoStarted || userPaused) return;
      el.play()
        .then(() => {
          hasAutoStarted = true;
        })
        .catch(() => {});
    };
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    events.forEach((evt) =>
      window.addEventListener(evt, startOnInteraction, { once: true })
    );
    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, startOnInteraction)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.audio_url]);

  if (dismissed) return null;

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      userPaused = true;
    } else {
      el.play().catch(() => {});
      userPaused = false;
      hasAutoStarted = true;
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
              {track.artist_instagram_url && (
                <a
                  href={track.artist_instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${track.artist_name} on Instagram`}
                  className="ml-1.5 inline-block align-middle text-steel-light transition-colors hover:text-gold"
                >
                  <Instagram size={13} className="inline" />
                </a>
              )}
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
            preload="auto"
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

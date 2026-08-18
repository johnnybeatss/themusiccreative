"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Instagram, Pause, Play, Volume2, VolumeX, X } from "lucide-react";

const VOLUME_STORAGE_KEY = "tmc-track-volume";

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
  apple_music_url?: string | null;
  spotify_url?: string | null;
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
  const [volume, setVolume] = useState(1);
  const prevVolumeRef = useRef(1);

  // Load a saved volume once on mount (client-only — localStorage doesn't
  // exist during server rendering). Defaults to full volume for anyone
  // visiting for the first time.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (saved !== null) setVolume(Number(saved));
    } catch {}
  }, []);

  // Keep the <audio> element's actual volume in sync, and persist changes
  // so the setting sticks across page loads.
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
    if (volume > 0) prevVolumeRef.current = volume;
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
    } catch {}
  }, [volume]);

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

  function toggleMute() {
    setVolume((v) => (v > 0 ? 0 : prevVolumeRef.current || 1));
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

          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              className="text-steel-light transition-colors hover:text-gold"
            >
              {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-20 cursor-pointer accent-gold"
            />
          </div>

          {(track.apple_music_url || track.spotify_url) && (
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {track.apple_music_url && (
                <a
                  href={track.apple_music_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-navy-800 px-2.5 py-1 text-[11px] font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
                >
                  Apple Music
                </a>
              )}
              {track.spotify_url && (
                <a
                  href={track.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-navy-800 px-2.5 py-1 text-[11px] font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
                >
                  Spotify
                </a>
              )}
            </div>
          )}

          <Link
            href="/#submit-track"
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
            // "none" instead of "auto" — this bar is on every page, so
            // "auto" meant every single page load downloaded the full
            // track immediately, even for visitors whose browser blocks
            // autoplay and never end up playing it. That was eating
            // Supabase's Cached Egress quota fast. "none" only fetches
            // once .play() is actually called (autoplay attempt or manual
            // click) — same experience for anyone who does hear it, just
            // no more downloading for nothing.
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

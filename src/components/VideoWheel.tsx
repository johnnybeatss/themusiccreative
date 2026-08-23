"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";

export type FeedVideo = {
  id: string;
  video_url: string;
  caption: string;
  instagram_url: string;
};

const CARD_W = 220;
const CARD_H = 275;
const GAP = 20;
// Auto-drift speed, in px/sec — slow enough to read as ambient motion, not a scroller.
const DRIFT_SPEED = 18;
// Repeat the set enough times that a full drag never runs out of cards to
// show. Below 4 distinct videos the wheel would otherwise feel sparse when
// dragged, since object-cover crops each into a portrait card regardless
// of how many unique clips there are.
const REPEAT = 4;

// Autoplaying video is a lot more expensive than a static thumbnail. With
// CARD_W at 220px, a typical container is wide enough for 3-4 cards to
// clear a 25%-visibility bar at once — this used to mean 3-4 videos
// genuinely streaming and looping simultaneously for as long as the wheel
// was on screen, which is real, ongoing Supabase Cached Egress, not just a
// handful of cheap poster-frame decodes. Now only ever ONE card — the one
// most centered in view, coordinated by the shared observer in VideoWheel —
// is allowed to actually play; every other card sits on its poster frame.
function VideoCard({
  video,
  observer,
}: {
  video: FeedVideo;
  // Null only during SSR (IntersectionObserver doesn't exist server-side —
  // see VideoWheel's lazy init) — always set by the time this effect runs
  // on the client.
  observer: IntersectionObserver | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !observer) return;
    // Belt-and-suspenders: React doesn't always reliably sync the `muted`
    // *property* (vs. attribute) on initial render, and unmuted autoplay is
    // silently blocked by every major browser — setting it imperatively
    // guarantees the property is actually true before play() is attempted.
    el.muted = true;

    // preload="metadata" alone doesn't reliably paint a visible first frame
    // — several browsers just leave the element blank/black until playback
    // actually starts. Nudging currentTime forward a hair once metadata is
    // available forces a decode+paint of that frame as a de facto poster,
    // without downloading the whole file the way preload="auto" would.
    const showFirstFrame = () => {
      if (el.currentTime === 0) el.currentTime = 0.1;
    };
    el.addEventListener("loadedmetadata", showFirstFrame);

    // Play/pause itself is decided by VideoWheel's shared callback, not
    // here — this card just registers so the shared observer can see it.
    observer.observe(el);
    return () => {
      el.removeEventListener("loadedmetadata", showFirstFrame);
      observer.unobserve(el);
      el.pause();
    };
  }, [observer]);

  return (
    <video
      ref={videoRef}
      src={video.video_url}
      muted
      loop
      playsInline
      preload="metadata"
      draggable={false}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

// Only a video whose card clears this much visibility is eligible to be
// "the" playing card — comfortably higher than the old 0.25 threshold so
// it lands on whichever card is actually centered, not just barely peeking
// into view at the container's edge.
const PLAY_THRESHOLD = 0.6;

export default function VideoWheel({ videos }: { videos: FeedVideo[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [containerW, setContainerW] = useState(0);

  // Every card's current intersection ratio, plus the single shared
  // IntersectionObserver every VideoCard registers itself with (see
  // VideoCard's comment for why this replaced one-observer-per-card). Set
  // up lazily during render rather than in an effect, so it's already
  // populated by the time each child's own mount effect runs and tries to
  // observer.observe() itself — child effects fire before the parent's.
  const ratiosRef = useRef<Map<HTMLVideoElement, number>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  if (!observerRef.current && typeof IntersectionObserver !== "undefined") {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            ratiosRef.current.set(el, entry.intersectionRatio);
          } else {
            ratiosRef.current.delete(el);
          }
        }
        let best: HTMLVideoElement | null = null;
        let bestRatio = PLAY_THRESHOLD;
        for (const [el, ratio] of ratiosRef.current) {
          if (ratio >= bestRatio) {
            best = el;
            bestRatio = ratio;
          }
        }
        for (const el of ratiosRef.current.keys()) {
          if (el === best) {
            el.play().catch(() => {
              // Autoplay can still be rejected (e.g. low-power mode) —
              // fine, it just sits on its poster/first frame.
            });
          } else {
            el.pause();
          }
        }
      },
      { threshold: [0, 0.25, 0.5, PLAY_THRESHOLD, 0.75, 1] }
    );
  }
  useEffect(() => () => observerRef.current?.disconnect(), []);

  // Repeating is what makes the drag-to-drift illusion work, but with a
  // single video it just shows the same card sitting next to itself —
  // reads as a bug, not a carousel. Below 2 distinct videos, render once
  // with no repeat, no drift, and no drag.
  const canDrift = videos.length > 1;
  const items = canDrift ? Array.from({ length: REPEAT }, () => videos).flat() : videos;
  const ITEM_W = CARD_W + GAP;
  const SET_W = videos.length * ITEM_W;
  const TRACK_W = items.length * ITEM_W;

  const x = useMotionValue(canDrift ? -SET_W : 0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (!canDrift || paused || draggingRef.current) return;
    let next = x.get() - (delta / 1000) * DRIFT_SPEED;
    // Content repeats every SET_W, so once we've drifted a full set past the
    // start, jump forward by exactly one set — visually seamless since the
    // pattern is periodic.
    if (next <= -(SET_W * (REPEAT - 1))) next += SET_W;
    x.set(next);
  });

  if (videos.length === 0) return null;

  return (
    <div
      className="relative py-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Soft haze behind the wheel so it blends into the page instead of
          sitting on it as a hard-edged block — tinted with the light-blue
          end of the brand board's pale gradient (#FAFFCD -> #94B9FF)
          rather than a plain white glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -inset-y-12 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(148,185,255,0.12),transparent_70%)] blur-3xl"
      />

      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ x, gap: GAP }}
          drag={canDrift ? "x" : false}
          dragConstraints={{ left: -(TRACK_W - containerW), right: 0 }}
          dragElastic={0.08}
          onDragStart={() => {
            draggingRef.current = true;
            setPaused(true);
          }}
          onDragEnd={() => {
            draggingRef.current = false;
            setPaused(false);
          }}
        >
          {items.map((v, i) => (
            <a
              key={`${v.id}-${i}`}
              href={v.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="group relative shrink-0 overflow-hidden rounded-2xl border border-navy-800 bg-navy-900"
              style={{ width: CARD_W, height: CARD_H }}
            >
              <VideoCard video={v} observer={observerRef.current} />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-xs font-semibold tracking-wide text-ivory">
                {v.caption}
              </p>
            </a>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

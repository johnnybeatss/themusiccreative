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

// Autoplaying video is a lot more expensive than a static thumbnail — with
// REPEAT copies in the DOM at once, we don't want all of them decoding and
// fetching simultaneously when only a few are ever actually visible inside
// the overflow-hidden track. Each card only calls .play() while it's
// intersecting the container, and .pause()s the instant it scrolls out.
function VideoCard({ video }: { video: FeedVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Belt-and-suspenders: React doesn't always reliably sync the `muted`
    // *property* (vs. attribute) on initial render, and unmuted autoplay is
    // silently blocked by every major browser — setting it imperatively
    // guarantees the property is actually true before play() is attempted.
    el.muted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {
            // Autoplay can still be rejected (e.g. low-power mode) — fine,
            // it just sits on its poster/first frame.
          });
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

export default function VideoWheel({ videos }: { videos: FeedVideo[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [containerW, setContainerW] = useState(0);

  const items = Array.from({ length: REPEAT }, () => videos).flat();
  const ITEM_W = CARD_W + GAP;
  const SET_W = videos.length * ITEM_W;
  const TRACK_W = items.length * ITEM_W;

  const x = useMotionValue(-SET_W);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (paused || draggingRef.current || videos.length === 0) return;
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
      {/* "White fuzz" — a soft ivory haze behind the wheel so it blends into
          the page instead of sitting on it as a hard-edged block. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -inset-y-12 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(238,240,245,0.09),transparent_70%)] blur-3xl"
      />

      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ x, gap: GAP }}
          drag="x"
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
              <VideoCard video={v} />
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

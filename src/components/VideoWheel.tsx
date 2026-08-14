"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { Play } from "lucide-react";

type Video = {
  src: string;
  alt: string;
  href: string;
  caption: string;
};

const VIDEOS: Video[] = [
  {
    src: "/videos/dj-decks-balcony.jpg",
    alt: "A member DJing on Pioneer decks",
    href: "https://www.instagram.com/reel/DWi_JZlDitJ/",
    caption: "Balcony DJ Set",
  },
  {
    src: "/videos/dj-workshop-pov.jpg",
    alt: "POV from a DJ workshop hosted at FIU",
    href: "https://www.instagram.com/reel/DW89-GvEe20/",
    caption: "DJ Workshop",
  },
  {
    src: "/videos/street-party.jpg",
    alt: "Members at a street party session",
    href: "https://www.instagram.com/reel/DbyxJjAyqMx/",
    caption: "Street Session",
  },
  {
    src: "/videos/thank-you-semester.jpg",
    alt: "Thank you for a great first semester",
    href: "https://www.instagram.com/reel/DSVLN_6jZGo/",
    caption: "1st Semester Recap",
  },
];

const CARD_W = 220;
const CARD_H = 275;
const GAP = 20;
const ITEM_W = CARD_W + GAP;
const SET_W = VIDEOS.length * ITEM_W;
// Repeat the set enough times that a full drag never runs out of cards to show.
const REPEAT = 4;
const items = Array.from({ length: REPEAT }, () => VIDEOS).flat();
const TRACK_W = items.length * ITEM_W;
// Auto-drift speed, in px/sec — slow enough to read as ambient motion, not a scroller.
const DRIFT_SPEED = 18;

export default function VideoWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const x = useMotionValue(-SET_W);
  const [paused, setPaused] = useState(false);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (paused || draggingRef.current) return;
    let next = x.get() - (delta / 1000) * DRIFT_SPEED;
    // Content repeats every SET_W, so once we've drifted a full set past the
    // start, jump forward by exactly one set — visually seamless since the
    // pattern is periodic.
    if (next <= -(SET_W * (REPEAT - 1))) next += SET_W;
    x.set(next);
  });

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
              key={`${v.href}-${i}`}
              href={v.href}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="group relative shrink-0 overflow-hidden rounded-2xl border border-navy-800 bg-navy-900"
              style={{ width: CARD_W, height: CARD_H }}
            >
              <Image
                src={v.src}
                alt={v.alt}
                fill
                draggable={false}
                sizes="220px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ivory/95 text-navy-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} />
                </span>
              </div>
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

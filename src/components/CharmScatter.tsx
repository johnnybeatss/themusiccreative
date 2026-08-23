import type { CharmName } from "./CharmDivider";

// Faint, oversized charm icons used as background texture behind a section
// (very low opacity, rotated, pointer-events-none, gently bobbing). Drop
// this as the FIRST child of a `relative` container -- it fills that
// container and sits behind everything else via -z-10.
//
// Two-layer structure per icon: an OUTER span carries the static
// position/size/rotation (`item.className` -- things like
// `left-[6%] top-0 w-14 rotate-[10deg]`), an INNER img carries the
// `animate-charm-float` bob. Each element's transform is independent, so
// the wrapper's static rotate() and the inner translateY() keyframe never
// fight over the same CSS property.
export default function CharmScatter({
  items,
}: {
  items: Array<{ name: CharmName; className: string }>;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {items.map((item, i) => (
        <span key={`${item.name}-${i}`} className={`absolute ${item.className}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative asset, no need for next/image optimization */}
          <img
            src={`/charms/${item.name}.png`}
            alt=""
            className="w-full animate-charm-float opacity-[0.07]"
            style={{
              // Stagger so icons don't bob in unison -- offset delay per
              // index, and cycle a couple of durations so it reads as
              // organic drift rather than a synced loop.
              animationDelay: `${(i * 1.1).toFixed(1)}s`,
              animationDuration: `${6 + (i % 3)}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

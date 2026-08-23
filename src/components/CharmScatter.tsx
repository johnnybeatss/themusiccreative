import type { CharmName } from "./CharmDivider";

// Faint, oversized charm icons used as background texture behind a section
// (very low opacity, rotated, pointer-events-none). Drop this as the FIRST
// child of a `relative` container -- it fills that container and sits
// behind everything else via -z-10.
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
        // eslint-disable-next-line @next/next/no-img-element -- tiny decorative asset, no need for next/image optimization
        <img
          key={`${item.name}-${i}`}
          src={`/charms/${item.name}.png`}
          alt=""
          className={`absolute opacity-[0.07] ${item.className}`}
        />
      ))}
    </div>
  );
}

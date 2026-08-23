// Small chrome "charm" icons (mic, star, speaker, headphones, guitars, CD)
// -- high-res transparent cutouts supplied directly by Johnny, background
// removed via flood-fill (see public/charms/). Purely decorative section
// break, so it's aria-hidden and never intercepts a click.
export type CharmName =
  | "mic-vintage"
  | "star"
  | "speaker"
  | "headphones"
  | "guitar-flying-v"
  | "guitar-les-paul"
  | "cd"
  | "mic-handheld";

// Natural pixel aspect ratio of each source file (after background removal
// + trim to bounding box), so a fixed target height doesn't stretch/squash
// any icon. Keep in sync with the actual files in public/charms/.
const ASPECT: Record<CharmName, number> = {
  "mic-vintage": 332 / 600,
  star: 600 / 588,
  speaker: 491 / 600,
  headphones: 569 / 600,
  "guitar-flying-v": 600 / 404,
  "guitar-les-paul": 219 / 600,
  cd: 599 / 600,
  "mic-handheld": 120 / 600,
};

export default function CharmDivider({
  charms,
  className = "",
}: {
  charms: CharmName[];
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-6 sm:gap-10 ${className}`}
    >
      <div className="h-px w-full max-w-16 flex-1 bg-navy-800 sm:max-w-24" />
      {charms.map((name, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- tiny decorative asset, no need for next/image optimization
        <img
          key={`${name}-${i}`}
          src={`/charms/${name}.png`}
          alt=""
          style={{ height: 26, width: 26 * ASPECT[name] }}
          className="opacity-60"
        />
      ))}
      <div className="h-px w-full max-w-16 flex-1 bg-navy-800 sm:max-w-24" />
    </div>
  );
}

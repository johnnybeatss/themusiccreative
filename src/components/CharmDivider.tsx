// Small chrome "charm" icons (mic, star, speaker, headphones, guitars, CD)
// lifted straight from the brand board's own "CHROME GRAPHICS" reference
// sheet — see public/charms/. Purely decorative section break, so it's
// aria-hidden and never intercepts a click.
export type CharmName =
  | "mic-vintage"
  | "star"
  | "speaker"
  | "headphones"
  | "guitar-flying-v"
  | "guitar-les-paul"
  | "cd"
  | "mic-handheld";

// Natural pixel aspect ratio of each source crop, so a fixed target height
// doesn't stretch/squash any icon.
const ASPECT: Record<CharmName, number> = {
  "mic-vintage": 48 / 72,
  star: 65 / 61,
  speaker: 72 / 88,
  headphones: 96 / 95,
  "guitar-flying-v": 126 / 95,
  "guitar-les-paul": 56 / 136,
  cd: 112 / 147,
  "mic-handheld": 36 / 120,
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

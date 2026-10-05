import { Crown } from "lucide-react";
import type { LeaderboardRow } from "@/lib/checkins";

// Shared by the homepage section and /leaderboard. Top 3 get a gold /
// silver / bronze crown, a tinted row, and a bigger name; every row gets a
// bar showing attendance relative to #1.
const MEDALS = [
  { label: "1st", color: "#f5c542", glow: "rgba(245,197,66,0.14)" }, // gold
  { label: "2nd", color: "#c9d1dc", glow: "rgba(201,209,220,0.10)" }, // silver
  { label: "3rd", color: "#d08a4f", glow: "rgba(208,138,79,0.12)" }, // bronze
];

function initials(name: string) {
  return name
    .replace(/\./g, "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LeaderboardList({ rows }: { rows: LeaderboardRow[] }) {
  const top = Math.max(1, ...rows.map((r) => r.events_attended));

  return (
    <ol className="space-y-2">
      {rows.map((r, i) => {
        const medal = MEDALS[i];
        const pct = Math.max(6, Math.round((r.events_attended / top) * 100));
        return (
          <li
            key={`${r.display_name}-${i}`}
            className="relative overflow-hidden rounded-xl border bg-navy-900 px-4 py-3 transition-transform hover:-translate-y-0.5"
            style={{
              borderColor: medal ? `${medal.color}55` : "var(--color-navy-800)",
              backgroundImage: medal
                ? `linear-gradient(90deg, ${medal.glow}, transparent 70%)`
                : undefined,
            }}
          >
            <div className="flex items-center gap-4">
              {/* Rank / crown */}
              <div className="flex w-10 shrink-0 flex-col items-center">
                {medal ? (
                  <>
                    <Crown
                      size={i === 0 ? 26 : 22}
                      strokeWidth={2.25}
                      style={{ color: medal.color, fill: `${medal.color}33` }}
                      aria-label={`${medal.label} place`}
                    />
                    <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: medal.color }}>
                      {medal.label}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-xl text-steel-light">{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                style={{
                  borderColor: medal ? medal.color : "var(--color-navy-800)",
                  color: medal ? medal.color : "var(--color-steel-light)",
                  backgroundColor: "var(--color-navy-950)",
                }}
              >
                {initials(r.display_name)}
              </div>

              {/* Name + bar */}
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold text-ivory ${i === 0 ? "text-lg" : ""}`}>
                  {r.display_name}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-950">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: medal ? medal.color : "var(--color-gold)",
                    }}
                  />
                </div>
              </div>

              {/* Count */}
              <div className="shrink-0 text-right">
                <p className="font-display text-2xl leading-none text-ivory">{r.events_attended}</p>
                <p className="text-[10px] uppercase tracking-wide text-steel-light">
                  event{r.events_attended === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

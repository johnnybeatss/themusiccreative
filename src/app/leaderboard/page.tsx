import type { Metadata } from "next";
import { pageOpenGraph } from "@/lib/pageMetadata";
import { getLeaderboard } from "@/lib/checkins";

const TITLE = "Leaderboard";
const DESCRIPTION = "Who's shown up the most this school year at The Music Creative @ FIU.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/leaderboard" },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/leaderboard"),
};

// Refresh at most every 5 minutes — plenty for an attendance board.
export const revalidate = 300;

export default async function LeaderboardPage() {
  const rows = await getLeaderboard(25);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl tracking-wide text-ivory">LEADERBOARD</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Events attended this school year. Scan the QR at any TMC event to check
        in. Resets every August.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-steel-light">No check-ins yet this year — be the first.</p>
      ) : (
        <ol className="mt-6 divide-y divide-navy-800 rounded-xl border border-navy-800 bg-navy-900">
          {rows.map((r, i) => (
            <li key={`${r.display_name}-${i}`} className="flex items-center gap-4 px-4 py-3">
              <span className={`w-8 font-display text-xl ${i < 3 ? "text-accent" : "text-steel-light"}`}>
                {i + 1}
              </span>
              <span className="flex-1 font-semibold text-ivory">{r.display_name}</span>
              <span className="text-sm text-steel-light">
                {r.events_attended} event{r.events_attended === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

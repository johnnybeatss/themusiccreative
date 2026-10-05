import type { Metadata } from "next";
import { pageOpenGraph } from "@/lib/pageMetadata";
import { getLeaderboard } from "@/lib/checkins";
import LeaderboardList from "@/components/LeaderboardList";

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
        <div className="mt-6">
          <LeaderboardList rows={rows} />
        </div>
      )}
    </div>
  );
}

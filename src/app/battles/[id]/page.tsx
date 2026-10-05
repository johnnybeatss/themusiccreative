import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Instagram } from "lucide-react";
import {
  getPublicBattle,
  getApprovedEntriesWithVotes,
  getMyVote,
  STATUS_LABEL,
  VOTER_COOKIE,
  battleDeadlines,
} from "@/lib/battles";
import BattleSubmit from "./BattleSubmit";
import VoteButton from "./VoteButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const battle = await getPublicBattle(id);
  if (!battle) return { title: "Spotlight Battle" };
  return {
    title: battle.title,
    description: battle.description ?? "Vote for the weekly spotlight — The Music Creative @ FIU.",
    alternates: { canonical: `/battles/${id}` },
  };
}

export default async function BattlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const battle = await getPublicBattle(id);
  if (!battle) notFound();

  const showEntries = battle.status === "voting" || battle.status === "closed";
  const voterToken = (await cookies()).get(VOTER_COOKIE)?.value;
  const [entries, myVote] = showEntries
    ? await Promise.all([
        getApprovedEntriesWithVotes(battle.id),
        getMyVote(battle.id, voterToken),
      ])
    : [[], null];

  // Counts stay hidden while voting is open so nobody piles onto whoever's
  // already ahead. Revealed (and sorted) once the battle closes.
  const closed = battle.status === "closed";
  const ordered = closed ? [...entries].sort((a, b) => b.votes - a.votes) : entries;

  return (
    <div>
      <Link href="/battles" className="text-sm text-steel-light hover:text-accent">
        &larr; All battles
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl tracking-wide text-ivory">{battle.title}</h1>
        <span className="rounded-full border border-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          {STATUS_LABEL[battle.status]}
        </span>
      </div>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {battle.week_start && battle.status !== "closed" && (
        <p className="mt-4 text-sm font-semibold text-accent">
          {`Submitting + voting close ${battleDeadlines(battle.week_start).closes} · winner takes over the site player Saturday`}
        </p>
      )}
      {battle.description && (
        <p className="mt-4 max-w-2xl whitespace-pre-line text-sm text-steel-light">
          {battle.description}
        </p>
      )}

      {battle.status === "submissions" && !battle.week_start && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-steel-light">
            Submissions are open. Voting starts once E-Board closes
            submissions — check back here to vote.
          </p>
          <BattleSubmit battleId={battle.id} />
        </div>
      )}

      {showEntries && (
        <>
          {battle.status === "voting" && (
            <p className="mt-6 text-sm text-steel-light">
              {myVote
                ? "Vote locked in. Results drop when voting closes."
                : "Listen to every track, then vote for your favorite. One vote per person. Winner becomes the weekly spotlight."}
            </p>
          )}
          {ordered.length === 0 ? (
            <p className="mt-6 text-steel-light">No tracks in this battle yet.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {ordered.map((e) => {
                const isWinner = closed && battle.winner_entry_id === e.id;
                const isMine = myVote === e.id;
                return (
                  <li
                    key={e.id}
                    className={`rounded-xl border bg-navy-900 p-4 ${
                      isWinner ? "border-gold" : "border-navy-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ivory">
                          {e.beat_title || "Untitled"}{" "}
                          <span className="font-normal text-steel-light">— {e.producer_name}</span>
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {e.kind && (
                            <span className="rounded-full border border-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-steel-light">
                              {e.kind}
                            </span>
                          )}
                          {isWinner && (
                            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Winner
                            </span>
                          )}
                          {isMine && (
                            <span className="rounded-full border border-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                              Your vote
                            </span>
                          )}
                          {e.producer_instagram_url && (
                            <a
                              href={e.producer_instagram_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-steel-light hover:text-accent"
                            >
                              <Instagram size={12} /> Instagram
                            </a>
                          )}
                          {e.spotify_url && (
                            <a href={e.spotify_url} target="_blank" rel="noreferrer" className="text-xs text-steel-light hover:text-accent">
                              Spotify
                            </a>
                          )}
                          {e.apple_music_url && (
                            <a href={e.apple_music_url} target="_blank" rel="noreferrer" className="text-xs text-steel-light hover:text-accent">
                              Apple Music
                            </a>
                          )}
                        </div>
                      </div>
                      {closed ? (
                        <p className="font-display text-2xl text-ivory">
                          {e.votes} <span className="text-sm text-steel-light">vote{e.votes === 1 ? "" : "s"}</span>
                        </p>
                      ) : (
                        <VoteButton battleId={battle.id} entryId={e.id} disabled={!!myVote} />
                      )}
                    </div>
                    {e.audio_url && (
                      <audio controls src={e.audio_url} preload="none" className="mt-3 w-full" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {battle.week_start && battle.status !== "closed" && (
        <div className="mt-10">
          <BattleSubmit battleId={battle.id} />
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage, isOwner } from "@/lib/supabase/role";
import { BATTLE_ENTRIES_BUCKET, STATUS_LABEL, type Battle, type BattleStatus } from "@/lib/battles";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { voteTally, signedUrlMap } from "@/lib/dbAggregates";
import BattleEntryItem, { type AdminEntry } from "./BattleEntryItem";
import { createBattle, setBattleStatus, deleteBattle, voidNetworkVotes } from "./actions";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
// A network with this many votes in one battle gets flagged for review.
// Not auto-removed — a full room on FIU Wi-Fi legitimately looks like this.
const FLAG_NETWORK_VOTES = 5;

// One row per (battle, network, entry) from battle_network_flags() —
// counted in Postgres (0044), so it stays correct past 1,000 votes.
type FlagRow = {
  battle_id: string; ip_hash: string; entry_id: string; votes: number | string;
  network_total: number | string; first_vote: string; last_vote: string;
};
type FlaggedNetwork = { battleId: string; ipHash: string; total: number; byEntry: Map<string, number>; first: string; last: string };

function groupFlags(rows: FlagRow[]): FlaggedNetwork[] {
  const byNet = new Map<string, FlaggedNetwork>();
  for (const r of rows) {
    const key = `${r.battle_id}:${r.ip_hash}`;
    const n = byNet.get(key) ?? {
      battleId: r.battle_id, ipHash: r.ip_hash, total: Number(r.network_total),
      byEntry: new Map<string, number>(), first: r.first_vote, last: r.last_vote,
    };
    n.byEntry.set(r.entry_id, Number(r.votes));
    if (r.first_vote < n.first) n.first = r.first_vote;
    if (r.last_vote > n.last) n.last = r.last_vote;
    byNet.set(key, n);
  }
  return [...byNet.values()].sort((a, b) => b.total - a.total);
}

function minutesBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none";

// Owner/admin read everything here through the normal cookie client —
// RLS grants them full access to battles, entries, votes, and the private
// battle-entries bucket (0033_beat_battles.sql).
async function getData(): Promise<{ battles: Battle[]; entries: AdminEntry[]; flags: FlaggedNetwork[] }> {
  const supabase = await createClient();
  const [{ data: battles }, { data: entries }, tally, { data: flagRows, error: flagError }] = await Promise.all([
    supabase.from("beat_battles").select("*").order("created_at", { ascending: false }),
    supabase.from("battle_entries").select("*").order("created_at", { ascending: true }),
    voteTally(supabase, null),
    supabase.rpc("battle_network_flags", { p_min_votes: FLAG_NETWORK_VOTES }),
  ]);
  if (flagError) console.error("battle_network_flags failed:", flagError.message);

  const urls = await signedUrlMap(
    supabase,
    BATTLE_ENTRIES_BUCKET,
    (entries ?? []).map((e) => e.storage_path),
    SIGNED_URL_TTL_SECONDS
  );
  const withAudio = (entries ?? []).map(
    (e) => ({ ...e, audio_url: urls.get(e.storage_path) ?? null, votes: tally.get(e.id) ?? 0 }) as AdminEntry
  );
  return { battles: battles ?? [], entries: withAudio, flags: groupFlags((flagRows ?? []) as FlagRow[]) };
}

const NEXT_STEP: Partial<Record<BattleStatus, { to: BattleStatus; label: string }>> = {
  draft: { to: "submissions", label: "Open submissions" },
  submissions: { to: "voting", label: "Close submissions & open voting" },
  voting: { to: "closed", label: "Close voting" },
};

export default async function BattlesAdminPage() {
  const role = await getEffectiveRole();
  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">SPOTLIGHT BATTLES</h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">Spotlight battles are managed by owner/admin accounts.</p>
      </div>
    );
  }

  const { battles, entries, flags } = await getData();
  const ownerView = isOwner(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">SPOTLIGHT BATTLES</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Runs itself every week (Eastern time): a new battle opens Monday
        12:00 AM and people can submit and vote until Friday 11:59 PM. Saturday
        nothing happens (results stay hidden), and Sunday around noon the most-voted entry (tie →
        earliest submitted) becomes the site player. New entries show up
        instantly, so your job is to delete junk and void suspicious votes.
        Old items still in{" "}
        <Link href="/eboard/track-submissions" className="text-accent hover:underline">
          Track Submissions
        </Link>{" "}
        can be added with &quot;Add to battle&quot;. The buttons below still work
        as manual overrides.
      </p>

      <form action={createBattle} className="mt-6 max-w-lg space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-5">
        <p className="font-display text-lg tracking-wide text-ivory">NEW BATTLE</p>
        <label className="block text-sm">
          <span className="text-steel-light">Title</span>
          <input name="title" required maxLength={120} placeholder="e.g. Sample Flip — Oct 2026" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Rules / prompt (optional)</span>
          <textarea name="description" rows={3} maxLength={2000} className={inputClass} />
        </label>
        <button type="submit" className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-white hover:bg-gold-light">
          Create (as draft)
        </button>
      </form>

      {battles.length === 0 ? (
        <p className="mt-6 text-steel-light">No battles yet.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {battles.map((b) => {
            const mine = entries.filter((e) => e.battle_id === b.id);
            const next = NEXT_STEP[b.status];
            const flagged = flags.filter((f) => f.battleId === b.id);
            const entryLabel = (id: string) => {
              const e = mine.find((x) => x.id === id);
              return e ? `${e.beat_title || "Untitled"} (${e.producer_name})` : "Removed track";
            };
            return (
              <section key={b.id} className="rounded-xl border border-navy-800 bg-navy-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl tracking-wide text-ivory">{b.title}</p>
                    <p className="mt-1 text-xs text-steel-light">
                      {b.week_start ? "Auto · " : ""}
                      {STATUS_LABEL[b.status]} · {mine.length} entr{mine.length === 1 ? "y" : "ies"}
                      {b.status !== "draft" && (
                        <>
                          {" · "}
                          <Link href={`/battles/${b.id}`} className="text-accent hover:underline">
                            Public page
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {next && (
                      <form action={setBattleStatus}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value={next.to} />
                        <button type="submit" className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white hover:bg-gold-light">
                          {next.label}
                        </button>
                      </form>
                    )}
                    {b.status === "closed" && (
                      <form action={setBattleStatus}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value="voting" />
                        <button type="submit" className="text-xs text-steel-light hover:text-accent">
                          Reopen voting
                        </button>
                      </form>
                    )}
                    <form action={deleteBattle}>
                      <input type="hidden" name="id" value={b.id} />
                      <ConfirmSubmitButton
                        message={`Delete "${b.title}" and all its entries and votes? This can't be undone.`}
                        className="text-xs text-steel-light hover:text-red-400"
                      >
                        Delete battle
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
                {flagged.length > 0 && (
                  <div className="mt-4 rounded-lg border border-red-400/40 bg-navy-950 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                      Check these networks
                    </p>
                    <p className="mt-1 text-xs text-steel-light">
                      {FLAG_NETWORK_VOTES}+ votes from one network. Normal if it&apos;s a room
                      voting at an event; suspicious if it&apos;s all one track outside event time.
                    </p>
                    <ul className="mt-2 space-y-2">
                      {flagged.map((n) => (
                        <li key={n.ipHash} className="flex flex-wrap items-start justify-between gap-2 text-xs">
                          <span className="text-ivory">
                            Network {n.ipHash.slice(0, 8)} · {n.total} votes over {minutesBetween(n.first, n.last)} min
                            <span className="block text-steel-light">
                              {[...n.byEntry.entries()].map(([id, c]) => `${entryLabel(id)}: ${c}`).join(" · ")}
                            </span>
                          </span>
                          <form action={voidNetworkVotes}>
                            <input type="hidden" name="battle_id" value={b.id} />
                            <input type="hidden" name="ip_hash" value={n.ipHash} />
                            <ConfirmSubmitButton
                              message={`Void all ${n.total} votes from this network? Can't be undone.`}
                              className="text-xs font-semibold text-red-300 hover:text-red-200"
                            >
                              Void these votes
                            </ConfirmSubmitButton>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mine.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {mine.map((e) => (
                      <BattleEntryItem
                        key={e.id}
                        entry={e}
                        isWinner={b.winner_entry_id === e.id}
                        ownerView={ownerView}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

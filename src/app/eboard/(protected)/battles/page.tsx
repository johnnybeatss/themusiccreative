import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage, isOwner } from "@/lib/supabase/role";
import { BATTLE_ENTRIES_BUCKET, STATUS_LABEL, type Battle, type BattleStatus } from "@/lib/battles";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import BattleEntryItem, { type AdminEntry } from "./BattleEntryItem";
import { createBattle, setBattleStatus, deleteBattle, voidNetworkVotes } from "./actions";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
// A network with this many votes in one battle gets flagged for review.
// Not auto-removed — a full room on FIU Wi-Fi legitimately looks like this.
const FLAG_NETWORK_VOTES = 5;

type Vote = { battle_id: string; entry_id: string; ip_hash: string; created_at: string };
type FlaggedNetwork = { ipHash: string; total: number; byEntry: Map<string, number>; first: string; last: string };

function flagNetworks(votes: Vote[]): FlaggedNetwork[] {
  const byNet = new Map<string, FlaggedNetwork>();
  for (const v of votes) {
    const n = byNet.get(v.ip_hash) ?? { ipHash: v.ip_hash, total: 0, byEntry: new Map(), first: v.created_at, last: v.created_at };
    n.total += 1;
    n.byEntry.set(v.entry_id, (n.byEntry.get(v.entry_id) ?? 0) + 1);
    if (v.created_at < n.first) n.first = v.created_at;
    if (v.created_at > n.last) n.last = v.created_at;
    byNet.set(v.ip_hash, n);
  }
  return [...byNet.values()].filter((n) => n.total >= FLAG_NETWORK_VOTES).sort((a, b) => b.total - a.total);
}

function minutesBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none";

// Owner/admin read everything here through the normal cookie client —
// RLS grants them full access to battles, entries, votes, and the private
// battle-entries bucket (0033_beat_battles.sql).
async function getData(): Promise<{ battles: Battle[]; entries: AdminEntry[]; votes: Vote[] }> {
  const supabase = await createClient();
  const [{ data: battles }, { data: entries }, { data: votes }] = await Promise.all([
    supabase.from("beat_battles").select("*").order("created_at", { ascending: false }),
    supabase.from("battle_entries").select("*").order("created_at", { ascending: true }),
    supabase.from("battle_votes").select("battle_id, entry_id, ip_hash, created_at"),
  ]);

  const tally = new Map<string, number>();
  for (const v of votes ?? []) tally.set(v.entry_id, (tally.get(v.entry_id) ?? 0) + 1);

  const withAudio = await Promise.all(
    (entries ?? []).map(async (e) => {
      const { data: signed } = await supabase.storage
        .from(BATTLE_ENTRIES_BUCKET)
        .createSignedUrl(e.storage_path, SIGNED_URL_TTL_SECONDS);
      return { ...e, audio_url: signed?.signedUrl ?? null, votes: tally.get(e.id) ?? 0 } as AdminEntry;
    })
  );
  return { battles: battles ?? [], entries: withAudio, votes: (votes ?? []) as Vote[] };
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
        <h1 className="font-display text-3xl tracking-wide text-ivory">BEAT BATTLES</h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">Beat battles are managed by owner/admin accounts.</p>
      </div>
    );
  }

  const { battles, entries, votes } = await getData();
  const ownerView = isOwner(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">BEAT BATTLES</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Flow: Draft → Submissions → Voting → Closed. Only approved beats show
        publicly. Vote counts stay hidden on the public page until voting
        closes. Crowning a winner (owner) closes the battle and drops the beat
        into the site-wide player.
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
            const flagged = flagNetworks(votes.filter((v) => v.battle_id === b.id));
            const entryLabel = (id: string) => {
              const e = mine.find((x) => x.id === id);
              return e ? `${e.beat_title || "Untitled"} (${e.producer_name})` : "Removed beat";
            };
            return (
              <section key={b.id} className="rounded-xl border border-navy-800 bg-navy-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl tracking-wide text-ivory">{b.title}</p>
                    <p className="mt-1 text-xs text-steel-light">
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
                      voting at an event; suspicious if it&apos;s all one beat outside event time.
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage, isOwner } from "@/lib/supabase/role";
import { BATTLE_ENTRIES_BUCKET, STATUS_LABEL, type Battle, type BattleStatus } from "@/lib/battles";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import BattleEntryItem, { type AdminEntry } from "./BattleEntryItem";
import { createBattle, setBattleStatus, deleteBattle } from "./actions";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none";

// Owner/admin read everything here through the normal cookie client —
// RLS grants them full access to battles, entries, votes, and the private
// battle-entries bucket (0033_beat_battles.sql).
async function getData(): Promise<{ battles: Battle[]; entries: AdminEntry[] }> {
  const supabase = await createClient();
  const [{ data: battles }, { data: entries }, { data: votes }] = await Promise.all([
    supabase.from("beat_battles").select("*").order("created_at", { ascending: false }),
    supabase.from("battle_entries").select("*").order("created_at", { ascending: true }),
    supabase.from("battle_votes").select("entry_id"),
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
  return { battles: battles ?? [], entries: withAudio };
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

  const { battles, entries } = await getData();
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

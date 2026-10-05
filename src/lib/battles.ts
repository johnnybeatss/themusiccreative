import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Shared data layer for Beat Battles (supabase/migrations/0033_beat_battles.sql).

export const BATTLE_ENTRIES_BUCKET = "battle-entries";
export const VOTER_COOKIE = "tmc_voter";
// One shared IP can be a whole dorm or the FIU campus Wi-Fi (NAT), so this
// is deliberately generous — it stops one person scripting hundreds of
// votes, not a room full of real students on the same network.
export const MAX_VOTES_PER_NETWORK = 25;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2;

export type BattleStatus = "draft" | "submissions" | "voting" | "closed";

export type Battle = {
  id: string;
  title: string;
  description: string | null;
  status: BattleStatus;
  winner_entry_id: string | null;
  created_at: string;
};

export type PublicEntry = {
  id: string;
  producer_name: string;
  beat_title: string | null;
  producer_instagram_url: string | null;
  audio_url: string | null;
  votes: number;
};

export const STATUS_LABEL: Record<BattleStatus, string> = {
  draft: "Draft",
  submissions: "Taking submissions",
  voting: "Voting open",
  closed: "Closed",
};

// Public listing — RLS already hides drafts.
export async function getPublicBattles(): Promise<Battle[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beat_battles")
    .select("*")
    .neq("status", "draft")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load battles:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPublicBattle(id: string): Promise<Battle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beat_battles")
    .select("*")
    .eq("id", id)
    .neq("status", "draft")
    .maybeSingle();
  if (error) return null;
  return data;
}

// Approved entries + playable audio + vote counts. Goes through the
// service client because (a) the bucket is private, so signed URLs need
// elevated read, and (b) battle_votes has no public SELECT policy at all.
// Only ever returns approved entries and aggregate counts — never voter
// tokens or network hashes.
export async function getApprovedEntriesWithVotes(
  battleId: string
): Promise<PublicEntry[]> {
  const service = createServiceClient();
  const [{ data: entries, error }, { data: votes }] = await Promise.all([
    service
      .from("battle_entries")
      .select("id, producer_name, beat_title, producer_instagram_url, storage_path")
      .eq("battle_id", battleId)
      .not("approved_at", "is", null)
      .order("created_at", { ascending: true }),
    service.from("battle_votes").select("entry_id").eq("battle_id", battleId),
  ]);
  if (error) {
    console.error("Failed to load battle entries:", error.message);
    return [];
  }

  const tally = new Map<string, number>();
  for (const v of votes ?? []) tally.set(v.entry_id, (tally.get(v.entry_id) ?? 0) + 1);

  return Promise.all(
    (entries ?? []).map(async (e) => {
      const { data: signed } = await service.storage
        .from(BATTLE_ENTRIES_BUCKET)
        .createSignedUrl(e.storage_path, SIGNED_URL_TTL_SECONDS);
      return {
        id: e.id,
        producer_name: e.producer_name,
        beat_title: e.beat_title,
        producer_instagram_url: e.producer_instagram_url,
        audio_url: signed?.signedUrl ?? null,
        votes: tally.get(e.id) ?? 0,
      };
    })
  );
}

// Which entry (if any) this browser already voted for in this battle.
export async function getMyVote(battleId: string, voterToken: string | undefined) {
  if (!voterToken) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("battle_votes")
    .select("entry_id")
    .eq("battle_id", battleId)
    .eq("voter_token", voterToken)
    .maybeSingle();
  return data?.entry_id ?? null;
}

// Salted so the stored hash can't be reversed back to an IP by brute force
// (IPv4 is only ~4B values). Reuses an existing server-only secret rather
// than adding a new env var.
export function hashNetwork(battleId: string, ip: string): string {
  const salt =
    process.env.VOTE_HASH_SALT ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  return createHash("sha256").update(`${salt}:${battleId}:${ip}`).digest("hex");
}

"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { looksLikeSpam, checkLengths } from "@/lib/formGuard";
import { normalizeInstagram } from "@/lib/normalizeInstagram";
import { hashNetwork, MAX_VOTES_PER_NETWORK, VOTER_COOKIE } from "@/lib/battles";

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------
// The audio itself is uploaded browser -> Supabase Storage first (Vercel
// caps request bodies at 4.5MB; beats run bigger) — same flow as track
// submissions. This just records the entry. Uses the normal cookie client,
// so RLS enforces "battle must be taking submissions" at the DB level.
export async function submitBattleEntry(input: {
  battleId: string;
  storagePath: string;
  producerName: string;
  beatTitle: string;
  instagram: string;
  guard?: Record<string, string>;
}): Promise<{ error: string | null }> {
  if (looksLikeSpam(input.guard)) return { error: null };

  const producerName = input.producerName.trim();
  const beatTitle = input.beatTitle.trim() || null;
  const ig = normalizeInstagram(input.instagram || "");
  if (!input.battleId || !input.storagePath || !producerName) {
    return { error: "Producer name and a beat file are required." };
  }
  const tooLong = checkLengths({
    "Producer name": [producerName, 80],
    "Beat title": [beatTitle, 120],
    Instagram: [ig, 300],
  });
  if (tooLong) return { error: tooLong };

  const supabase = await createClient();
  const { error } = await supabase.from("battle_entries").insert({
    battle_id: input.battleId,
    storage_path: input.storagePath,
    producer_name: producerName,
    beat_title: beatTitle,
    producer_instagram_url: ig,
  });
  if (error) {
    // Most likely cause: submissions closed between page load and submit.
    return { error: "Submissions for this battle are closed." };
  }
  return { error: null };
}

// ---------------------------------------------------------------------------
// Votes
// ---------------------------------------------------------------------------
// Open, no-login voting. Uses the SERVICE client on purpose: battle_votes
// has no public RLS policies, so the only way to write a vote is through
// this function, which enforces the rules below. (A public insert policy
// would let anyone write votes straight to the table with the anon key and
// skip every check here.)
//
// Rules: battle must be in "voting", the entry must be approved and belong
// to that battle, one vote per browser (httpOnly cookie + DB unique
// constraint), and at most MAX_VOTES_PER_NETWORK votes per network.
export async function castVote(
  battleId: string,
  entryId: string
): Promise<{ error: string | null }> {
  if (!battleId || !entryId) return { error: "Missing battle or beat." };
  const service = createServiceClient();

  const [{ data: battle }, { data: entry }] = await Promise.all([
    service.from("beat_battles").select("status").eq("id", battleId).maybeSingle(),
    service
      .from("battle_entries")
      .select("id")
      .eq("id", entryId)
      .eq("battle_id", battleId)
      .not("approved_at", "is", null)
      .maybeSingle(),
  ]);
  if (battle?.status !== "voting") return { error: "Voting isn't open for this battle." };
  if (!entry) return { error: "That beat isn't in this battle." };

  const cookieStore = await cookies();
  let token = cookieStore.get(VOTER_COOKIE)?.value;
  if (!token) {
    token = randomUUID();
    cookieStore.set(VOTER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const ipHash = hashNetwork(battleId, ip);

  const { count } = await service
    .from("battle_votes")
    .select("id", { count: "exact", head: true })
    .eq("battle_id", battleId)
    .eq("ip_hash", ipHash);
  if ((count ?? 0) >= MAX_VOTES_PER_NETWORK) {
    return { error: "Too many votes from this network for this battle." };
  }

  const { error } = await service.from("battle_votes").insert({
    battle_id: battleId,
    entry_id: entryId,
    voter_token: token,
    ip_hash: ipHash,
  });
  if (error) {
    if (error.code === "23505") return { error: "You already voted in this battle." };
    console.error("Failed to record vote:", error.message);
    return { error: "Couldn't record your vote — try again." };
  }

  revalidatePath(`/battles/${battleId}`);
  return { error: null };
}

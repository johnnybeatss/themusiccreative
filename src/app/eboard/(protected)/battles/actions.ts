"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage, isOwner } from "@/lib/supabase/role";
import { BATTLE_ENTRIES_BUCKET, type BattleStatus } from "@/lib/battles";
import { crownEntry } from "@/lib/crownBattle";

const STATUSES: BattleStatus[] = ["draft", "submissions", "voting", "closed"];

// RLS (0033_beat_battles.sql) restricts every write here to owner/admin
// too — the role checks are defense in depth, same as other inboxes.

function revalidateBattle(battleId?: string) {
  revalidatePath("/eboard/battles");
  revalidatePath("/battles");
  if (battleId) revalidatePath(`/battles/${battleId}`);
}

export async function createBattle(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  if (!title || title.length > 120) return;

  const supabase = await createClient();
  const { error } = await supabase.from("beat_battles").insert({ title, description });
  if (error) console.error("Failed to create battle:", error.message);
  revalidateBattle();
}

export async function setBattleStatus(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  const status = formData.get("status") as BattleStatus;
  if (!id || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  // Opening voting auto-approves every pending entry in the battle, so
  // nobody has to approve beats one by one. Anything you don't want in
  // the battle: delete it before opening voting (or unapprove it after).
  if (status === "voting") {
    const { error: approveError } = await supabase
      .from("battle_entries")
      .update({ approved_at: new Date().toISOString() })
      .eq("battle_id", id)
      .is("approved_at", null);
    if (approveError) {
      console.error("Failed to auto-approve entries:", approveError.message);
      return; // don't open voting with entries stuck in pending
    }
  }

  const { error } = await supabase.from("beat_battles").update({ status }).eq("id", id);
  if (error) console.error("Failed to update battle status:", error.message);
  revalidateBattle(id);
  revalidatePath("/eboard", "layout");
}

// Deletes the battle, its entries/votes (FK cascade), and the audio files.
export async function deleteBattle(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("battle_entries")
    .select("storage_path")
    .eq("battle_id", id);
  const { error } = await supabase.from("beat_battles").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete battle:", error.message);
    return;
  }
  const paths = (entries ?? []).map((e) => e.storage_path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(BATTLE_ENTRIES_BUCKET).remove(paths);
    if (storageError) console.error("Failed to delete battle audio:", storageError.message);
  }
  revalidateBattle(id);
}

export async function setEntryApproved(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  const battleId = formData.get("battle_id") as string;
  const approve = formData.get("approve") === "1";
  if (!id) return;

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("battle_entries")
    .update(approve ? { approved_at: now, read_at: now } : { approved_at: null })
    .eq("id", id);
  if (error) console.error("Failed to update entry approval:", error.message);
  revalidateBattle(battleId);
  revalidatePath("/eboard", "layout");
}

export async function deleteEntry(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  const battleId = formData.get("battle_id") as string;
  const storagePath = formData.get("storage_path") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("battle_entries").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete entry:", error.message);
    return;
  }
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(BATTLE_ENTRIES_BUCKET)
      .remove([storagePath]);
    if (storageError) console.error("Failed to delete entry audio:", storageError.message);
  }
  revalidateBattle(battleId);
  revalidatePath("/eboard", "layout");
}

// Called from BattleEntryItem's IntersectionObserver — same shared-inbox
// read model as the other E-Board inboxes.
export async function markBattleEntryRead(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("battle_entries")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark battle entry read:", error.message);
    return;
  }
  revalidatePath("/eboard", "layout");
}

// Voting is open to anyone (no login), so one person can clear cookies and
// vote again — up to the per-network cap. The admin page flags networks
// with an unusual number of votes; this voids all of one network's votes
// in one battle. Hashes only — E-Board never sees anyone's IP.
export async function voidNetworkVotes(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const battleId = formData.get("battle_id") as string;
  const ipHash = formData.get("ip_hash") as string;
  if (!battleId || !/^[0-9a-f]{64}$/.test(ipHash)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("battle_votes")
    .delete()
    .eq("battle_id", battleId)
    .eq("ip_hash", ipHash);
  if (error) console.error("Failed to void votes:", error.message);
  revalidateBattle(battleId);
}

// Owner-only, like every weekly_track write. Sets the winner, closes the
// battle, and copies the winning beat into the site-wide player — same
// copy-then-insert flow as featureSubmission in track-submissions/actions.ts.
export async function crownWinner(formData: FormData) {
  if (!isOwner(await getMyRole())) return;
  const entryId = formData.get("entry_id") as string;
  const battleId = formData.get("battle_id") as string;
  if (!entryId || !battleId) return;

  const supabase = await createClient();
  const err = await crownEntry(supabase, battleId, entryId);
  if (err) {
    console.error("Failed to crown winner:", err);
    return;
  }

  revalidatePath("/eboard/track-submissions");
  revalidateBattle(battleId);
  revalidatePath("/eboard/track");
  revalidatePath("/", "layout");
}

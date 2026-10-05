import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BATTLE_ENTRIES_BUCKET } from "@/lib/battles";

const WEEKLY_TRACK_BUCKET = "weekly-track";

// Makes a battle entry the site-wide weekly spotlight: copies its audio into
// the public weekly-track bucket, inserts the weekly_track row, marks the
// battle closed with this winner, and marks the source submission featured.
// Shared by the owner's "Crown winner" button (cookie client, RLS applies)
// and the Monday auto-crown cron (service client).
export async function crownEntry(
  supabase: SupabaseClient,
  battleId: string,
  entryId: string
): Promise<string | null> {
  const { data: entry } = await supabase
    .from("battle_entries")
    .select(
      "storage_path, producer_name, beat_title, producer_instagram_url, apple_music_url, spotify_url, source_submission_id, approved_at"
    )
    .eq("id", entryId)
    .eq("battle_id", battleId)
    .maybeSingle();
  if (!entry?.approved_at) return "Entry not found or not approved.";

  const { data: file, error: downloadError } = await supabase.storage
    .from(BATTLE_ENTRIES_BUCKET)
    .download(entry.storage_path);
  if (downloadError || !file) return `Download failed: ${downloadError?.message}`;

  const ext = entry.storage_path.split(".").pop() || "mp3";
  const newPath = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(WEEKLY_TRACK_BUCKET)
    .upload(newPath, file, { contentType: file.type || "audio/mpeg" });
  if (uploadError) return `Copy failed: ${uploadError.message}`;

  const { error: insertError } = await supabase.from("weekly_track").insert({
    storage_path: newPath,
    track_title: entry.beat_title || "Spotlight Battle Winner",
    artist_name: entry.producer_name,
    artist_instagram_url: entry.producer_instagram_url,
    apple_music_url: entry.apple_music_url,
    spotify_url: entry.spotify_url,
  });
  if (insertError) return `weekly_track insert failed: ${insertError.message}`;

  const { error: battleError } = await supabase
    .from("beat_battles")
    .update({ winner_entry_id: entryId, status: "closed" })
    .eq("id", battleId);
  if (battleError) console.error("Failed to set battle winner:", battleError.message);

  if (entry.source_submission_id) {
    const now = new Date().toISOString();
    const { error: subError } = await supabase
      .from("track_submissions")
      .update({ featured_at: now, read_at: now })
      .eq("id", entry.source_submission_id);
    if (subError) console.error("Failed to mark submission featured:", subError.message);
  }
  return null;
}

// Most votes wins. Tie → whoever submitted first. Null when nobody got a
// single vote (the current spotlight just stays up).
export async function pickTopEntry(
  supabase: SupabaseClient,
  battleId: string
): Promise<string | null> {
  const [{ data: entries }, { data: votes }] = await Promise.all([
    supabase
      .from("battle_entries")
      .select("id, created_at")
      .eq("battle_id", battleId)
      .not("approved_at", "is", null),
    supabase.from("battle_votes").select("entry_id").eq("battle_id", battleId),
  ]);
  const tally = new Map<string, number>();
  for (const v of votes ?? []) tally.set(v.entry_id, (tally.get(v.entry_id) ?? 0) + 1);

  const ranked = (entries ?? [])
    .map((e) => ({ id: e.id as string, created: e.created_at as string, votes: tally.get(e.id) ?? 0 }))
    .filter((e) => e.votes > 0)
    .sort((a, b) => b.votes - a.votes || a.created.localeCompare(b.created));
  return ranked[0]?.id ?? null;
}

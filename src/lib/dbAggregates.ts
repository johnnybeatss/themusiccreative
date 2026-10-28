import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Shared helpers for the performance pass (0044_aggregates_and_indexes.sql).
// Counting happens in Postgres, so results stay correct past Supabase's
// 1,000-row response cap and the payload stays tiny.

// entry_id -> vote count. battleId null = every battle (keyed the same way;
// entry ids are globally unique).
export async function voteTally(
  supabase: SupabaseClient,
  battleId: string | null
): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("battle_vote_tally", { p_battle_id: battleId });
  if (error) console.error("battle_vote_tally failed:", error.message);
  const tally = new Map<string, number>();
  for (const r of (data ?? []) as { entry_id: string; votes: number | string }[]) {
    tally.set(r.entry_id, Number(r.votes));
  }
  return tally;
}

// event_id -> { rsvps, checkins }.
export async function attendanceCounts(
  supabase: SupabaseClient
): Promise<Map<string, { rsvps: number; checkins: number }>> {
  const { data, error } = await supabase.rpc("event_attendance_counts");
  if (error) console.error("event_attendance_counts failed:", error.message);
  const out = new Map<string, { rsvps: number; checkins: number }>();
  for (const r of (data ?? []) as { event_id: string; rsvps: number | string; checkins: number | string }[]) {
    out.set(r.event_id, { rsvps: Number(r.rsvps), checkins: Number(r.checkins) });
  }
  return out;
}

// One Storage request for all signed URLs instead of one per file.
// path -> signed URL (missing on error, callers already handle null).
export async function signedUrlMap(
  supabase: SupabaseClient,
  bucket: string,
  paths: (string | null | undefined)[],
  ttlSeconds: number
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, ttlSeconds);
  if (error) {
    console.error(`createSignedUrls(${bucket}) failed:`, error.message);
    return map;
  }
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) map.set(item.path, item.signedUrl);
  }
  return map;
}

// Every row of a query, fetched 1,000 at a time. A single Supabase response
// caps at 1,000 rows, which would silently cut off big Excel exports.
// `build` must return a fresh, ordered query on each call.
type RangeQuery<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
};
export async function fetchAllRows<T>(
  build: () => RangeQuery<T>
): Promise<{ data: T[]; error: { message: string } | null }> {
  const PAGE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) return { data: rows, error: null };
  }
}

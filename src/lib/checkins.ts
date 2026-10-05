import "server-only";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Shared helpers for QR check-in (supabase/migrations/0034_event_checkins.sql).

export const SITE_URL = "https://themusiccreative.org";

// Check-in is only accepted from a bit before the event's start time until
// well after, so a leaked link can't be used to farm leaderboard points
// days later.
export const CHECKIN_OPENS_BEFORE_MS = 3 * 60 * 60 * 1000;
export const CHECKIN_CLOSES_AFTER_MS = 12 * 60 * 60 * 1000;

export type CheckinEvent = { id: string; name: string; date: string };

export function checkinUrl(code: string) {
  return `${SITE_URL}/checkin/${code}`;
}

// 12 chars from an unambiguous alphabet (no 0/O/1/l/I) — ~67 bits, short
// enough to type in by hand if someone's camera won't scan.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function generateCheckinCode(): string {
  const bytes = randomBytes(12);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function checkinWindow(eventDateIso: string) {
  const start = new Date(eventDateIso).getTime();
  return { opens: start - CHECKIN_OPENS_BEFORE_MS, closes: start + CHECKIN_CLOSES_AFTER_MS };
}

// Looks up the event behind a code. Service client because the codes table
// is owner/admin-only by RLS (see migration for why).
export async function getEventByCheckinCode(code: string): Promise<CheckinEvent | null> {
  if (!/^[a-z0-9]{6,32}$/.test(code)) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("event_checkin_codes")
    .select("events(id, name, date)")
    .eq("code", code)
    .maybeSingle();
  const ev = data?.events as unknown as CheckinEvent | CheckinEvent[] | null | undefined;
  if (!ev) return null;
  return Array.isArray(ev) ? ev[0] ?? null : ev;
}

// School year starts Aug 1 — leaderboard resets each fall.
export function schoolYearStart(now = new Date()): Date {
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(Date.UTC(year, 7, 1, 4)); // Aug 1, 00:00 Eastern (EDT)
}

export type LeaderboardRow = { display_name: string; events_attended: number };

export async function getLeaderboard(maxRows = 25): Promise<LeaderboardRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkin_leaderboard", {
    since: schoolYearStart().toISOString(),
    max_rows: maxRows,
  });
  if (error) {
    console.error("Failed to load leaderboard:", error.message);
    return [];
  }
  return ((data ?? []) as { display_name: string; events_attended: number | string }[]).map((r) => ({
    display_name: r.display_name,
    events_attended: Number(r.events_attended),
  }));
}

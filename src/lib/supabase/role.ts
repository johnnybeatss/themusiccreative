import "server-only";
import { cookies } from "next/headers";
import { createClient } from "./server";

export type MemberRole = "owner" | "admin" | "eboard";

// Fails closed: no signed-in user, no profile row (shouldn't happen once
// supabase/migrations/0003_roles.sql has run, but the trigger/backfill
// could theoretically miss someone), or a query error all resolve to
// `null` — treat that as "not privileged" rather than guessing.
export async function getMyRole(): Promise<MemberRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as MemberRole;
}

export function canManage(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin";
}

// Deliberately tighter than canManage() — for the one or two things (like
// the weekly featured track) that stay owner-only on purpose.
export function isOwner(role: MemberRole | null): boolean {
  return role === "owner";
}

export type MyProfile = { role: MemberRole; displayName: string | null };

// Same fail-closed behavior as getMyRole(), but also returns display_name
// for pages that need to show/edit it (e.g. /eboard/profile).
export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { role: data.role as MemberRole, displayName: data.display_name };
}

// --- "View as E-Board" demo mode ---
// Lets the real owner simulate what an eboard-tier member sees, for live
// demos, without touching the real profiles.role value. Owner-only by
// design (see demoViewActions.ts, which is the only place this cookie
// gets set and re-checks isOwner() itself server-side). Server Actions
// everywhere else keep calling getMyRole()/canManage()/isOwner() directly,
// never these "effective" versions — so demo mode can only ever change
// what renders, not what's actually writable.
const DEMO_VIEW_COOKIE = "eboard_demo_view";

export async function isDemoViewActive(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_VIEW_COOKIE)?.value === "1";
}

// Real role, downgraded to "eboard" for UI-rendering decisions only when
// the real role is owner AND demo mode is active. Use this in page-level
// access gates and nav/tile filtering — never in Server Actions.
export async function getEffectiveRole(): Promise<MemberRole | null> {
  const role = await getMyRole();
  if (role === "owner" && (await isDemoViewActive())) return "eboard";
  return role;
}

export async function getEffectiveProfile(): Promise<MyProfile | null> {
  const profile = await getMyProfile();
  if (profile?.role === "owner" && (await isDemoViewActive())) {
    return { ...profile, role: "eboard" };
  }
  return profile;
}

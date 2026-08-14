import "server-only";
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

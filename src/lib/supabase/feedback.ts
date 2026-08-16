import "server-only";
import { createClient } from "./server";
import { getMyRole, canManage } from "./role";

// Counts feedback submitted since this admin/owner last opened
// /eboard/feedback — powers the badge in the E-Board sidebar and
// dashboard tile. Always 0 for eboard-tier members: they can't read
// feedback at all, enforced at the database level by RLS (see
// supabase/migrations/0011_feedback_admin_only.sql), not just this check.
export async function getUnreadFeedbackCount(): Promise<number> {
  const role = await getMyRole();
  if (!canManage(role)) return 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("feedback_last_viewed_at")
    .eq("id", user.id)
    .maybeSingle();

  let query = supabase
    .from("feedback")
    .select("id", { count: "exact", head: true });
  if (profile?.feedback_last_viewed_at) {
    query = query.gt("created_at", profile.feedback_last_viewed_at);
  }

  const { count, error } = await query;
  if (error) {
    console.error("Failed to count unread feedback:", error.message);
    return 0;
  }
  return count ?? 0;
}

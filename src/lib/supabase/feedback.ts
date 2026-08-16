import "server-only";
import { createClient } from "./server";
import { getMyRole, canManage } from "./role";

// Counts feedback with no read_at set yet — powers the badge in the
// E-Board sidebar and dashboard tile. Shared team-inbox model: read state
// lives on the message itself (supabase/migrations/0012), not per-user, so
// once any owner/admin opens a response it's read for everyone. Always 0
// for eboard-tier members: they can't read feedback at all, enforced at
// the database level by RLS (0011_feedback_admin_only.sql), not just here.
export async function getUnreadFeedbackCount(): Promise<number> {
  const role = await getMyRole();
  if (!canManage(role)) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) {
    console.error("Failed to count unread feedback:", error.message);
    return 0;
  }
  return count ?? 0;
}

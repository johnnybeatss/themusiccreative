import "server-only";
import { createClient } from "./server";
import { getMyRole, canManage } from "./role";

// Same shared-team-inbox model as getUnreadFeedbackCount (feedback.ts):
// read state lives on the row itself, not per-user — once any owner/admin
// has opened a submission, it's read for everyone. Always 0 for
// eboard-tier members, who can't read these tables at all (enforced by RLS,
// not just here).
async function getUnreadCount(
  table: "join_submissions" | "dj_inquiries" | "team_applications"
) {
  const role = await getMyRole();
  if (!canManage(role)) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) {
    console.error(`Failed to count unread ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export function getUnreadJoinSubmissionCount(): Promise<number> {
  return getUnreadCount("join_submissions");
}

export function getUnreadDjInquiryCount(): Promise<number> {
  return getUnreadCount("dj_inquiries");
}

export function getUnreadTeamApplicationCount(): Promise<number> {
  return getUnreadCount("team_applications");
}

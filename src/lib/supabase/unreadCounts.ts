import "server-only";
import { createClient } from "./server";
import { getMyRole, canManage } from "./role";
import { getUnreadFeedbackCount } from "./feedback";

// Same shared-team-inbox model as getUnreadFeedbackCount (feedback.ts):
// read state lives on the row itself, not per-user — once any owner/admin
// has opened a submission, it's read for everyone. Always 0 for
// eboard-tier members, who can't read these tables at all (enforced by RLS,
// not just here).
async function getUnreadCount(
  table:
    | "join_submissions"
    | "dj_inquiries"
    | "team_applications"
    | "track_submissions"
    | "battle_entries"
    | "collab_posts"
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

export function getUnreadTrackSubmissionCount(): Promise<number> {
  return getUnreadCount("track_submissions");
}

// weekly_email_drafts uses reviewed_at instead of read_at (see
// 0022_weekly_email_drafts.sql) — "unread" here means "there's a draft
// waiting on someone to review and send it." Only counts still-drafted
// rows, not ones that have already been sent.
export async function getUnreadWeeklyEmailDraftCount(): Promise<number> {
  const role = await getMyRole();
  if (!canManage(role)) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("weekly_email_drafts")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft")
    .is("reviewed_at", null);
  if (error) {
    console.error("Failed to count unread weekly email drafts:", error.message);
    return 0;
  }
  return count ?? 0;
}

// battle_entries / collab_posts use the same read_at inbox model — "unread"
// = submitted but not yet opened in the hub (see 0033/0035 migrations).
export function getUnreadBattleEntryCount(): Promise<number> {
  return getUnreadCount("battle_entries");
}

export function getUnreadCollabPostCount(): Promise<number> {
  return getUnreadCount("collab_posts");
}

// Single source of truth for every unread badge in the hub, keyed by the
// page's href. The sidebar (EboardNav via layout.tsx) and the dashboard
// tiles both read this map, so adding a new inbox is one line here instead
// of threading another prop through three files.
export async function getUnreadCountsByHref(): Promise<Record<string, number>> {
  const [feedback, join, dj, team, email, track, battles, collab] =
    await Promise.all([
      getUnreadFeedbackCount(),
      getUnreadJoinSubmissionCount(),
      getUnreadDjInquiryCount(),
      getUnreadTeamApplicationCount(),
      getUnreadWeeklyEmailDraftCount(),
      getUnreadTrackSubmissionCount(),
      getUnreadBattleEntryCount(),
      getUnreadCollabPostCount(),
    ]);
  return {
    "/eboard/feedback": feedback,
    "/eboard/join-submissions": join,
    "/eboard/dj-inquiries": dj,
    "/eboard/team-applications": team,
    "/eboard/weekly-email": email,
    "/eboard/track-submissions": track,
    "/eboard/battles": battles,
    "/eboard/collab": collab,
  };
}

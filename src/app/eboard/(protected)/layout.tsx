import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEffectiveProfile,
  getMyRole,
  isOwner,
  isDemoViewActive,
} from "@/lib/supabase/role";
import { getUnreadFeedbackCount } from "@/lib/supabase/feedback";
import {
  getUnreadJoinSubmissionCount,
  getUnreadDjInquiryCount,
  getUnreadTeamApplicationCount,
  getUnreadWeeklyEmailDraftCount,
} from "@/lib/supabase/unreadCounts";
import EboardNav from "@/components/EboardNav";
import SessionGuard from "@/components/SessionGuard";

// Wraps every /eboard/* route EXCEPT /eboard/login (which lives outside
// this (protected) route group, so it's never gated). This split fixes an
// infinite-redirect bug: gating /eboard/login too meant an unauthenticated
// visit redirected to /eboard/login, which re-ran this same check, which
// redirected again, forever.
export default async function EboardProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // Always re-verify server-side with getUser() — don't rely on proxy.ts
  // alone, per Supabase's own guidance (it can be misconfigured/bypassed).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/eboard/login");
  }

  const [
    profile,
    realRole,
    demoActive,
    unreadFeedbackCount,
    unreadJoinSubmissionCount,
    unreadDjInquiryCount,
    unreadTeamApplicationCount,
    unreadWeeklyEmailDraftCount,
  ] = await Promise.all([
    getEffectiveProfile(),
    getMyRole(),
    isDemoViewActive(),
    getUnreadFeedbackCount(),
    getUnreadJoinSubmissionCount(),
    getUnreadDjInquiryCount(),
    getUnreadTeamApplicationCount(),
    getUnreadWeeklyEmailDraftCount(),
  ]);
  // "View as E-Board" toggle is owner-only (see demoViewActions.ts, which
  // re-checks this server-side too — this is just what decides whether
  // the button renders at all).
  const canToggleDemo = isOwner(realRole);

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
      <SessionGuard />
      <EboardNav
        profile={profile}
        isDemoActive={demoActive}
        canToggleDemo={canToggleDemo}
        unreadFeedbackCount={unreadFeedbackCount}
        unreadJoinSubmissionCount={unreadJoinSubmissionCount}
        unreadDjInquiryCount={unreadDjInquiryCount}
        unreadTeamApplicationCount={unreadTeamApplicationCount}
        unreadWeeklyEmailDraftCount={unreadWeeklyEmailDraftCount}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/supabase/role";
import { getUnreadFeedbackCount } from "@/lib/supabase/feedback";
import {
  getUnreadJoinSubmissionCount,
  getUnreadDjInquiryCount,
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

  const [profile, unreadFeedbackCount, unreadJoinSubmissionCount, unreadDjInquiryCount] =
    await Promise.all([
      getMyProfile(),
      getUnreadFeedbackCount(),
      getUnreadJoinSubmissionCount(),
      getUnreadDjInquiryCount(),
    ]);

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
      <SessionGuard />
      <EboardNav
        profile={profile}
        unreadFeedbackCount={unreadFeedbackCount}
        unreadJoinSubmissionCount={unreadJoinSubmissionCount}
        unreadDjInquiryCount={unreadDjInquiryCount}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

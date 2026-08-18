import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  FolderOpen,
  StickyNote,
  PartyPopper,
  MessageSquare,
  Video,
  Music,
  Briefcase,
  UserPlus,
  Disc3,
  Users,
  Mail,
  Newspaper,
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { canManage, type MyProfile } from "@/lib/supabase/role";
import { enterDemoView, exitDemoView } from "@/app/eboard/(protected)/demoViewActions";

const links = [
  { href: "/eboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/eboard/events", label: "Events", icon: PartyPopper },
  { href: "/eboard/recaps", label: "Recaps", icon: Newspaper },
  { href: "/eboard/team", label: "Team", icon: Users },
  { href: "/eboard/opportunities", label: "Opportunities", icon: Briefcase },
  {
    href: "/eboard/join-submissions",
    label: "Join Submissions",
    icon: UserPlus,
  },
  { href: "/eboard/dj-inquiries", label: "DJ Inquiries", icon: Disc3 },
  {
    href: "/eboard/team-applications",
    label: "Team Applications",
    icon: UserPlus,
  },
  { href: "/eboard/videos", label: "Feed Videos", icon: Video },
  { href: "/eboard/track", label: "Weekly Spotlight", icon: Music },
  { href: "/eboard/weekly-email", label: "Weekly Email", icon: Mail },
  { href: "/eboard/reports", label: "Weekly Reports", icon: FileText },
  { href: "/eboard/calendar", label: "Meeting Calendar", icon: Calendar },
  { href: "/eboard/resources", label: "Drive Resources", icon: FolderOpen },
  { href: "/eboard/notes", label: "Leadership Notes", icon: StickyNote },
  { href: "/eboard/feedback", label: "Feedback", icon: MessageSquare },
];

const ROLE_LABELS: Record<MyProfile["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  eboard: "E-Board",
};

// Vertical sidebar for the E-Board section — stacked as a left rail on
// sm+ screens, and as a compact vertical list above the content on mobile
// (see layout.tsx for the flex-col/flex-row switch).
export default function EboardNav({
  profile,
  isDemoActive = false,
  canToggleDemo = false,
  unreadFeedbackCount = 0,
  unreadJoinSubmissionCount = 0,
  unreadDjInquiryCount = 0,
  unreadTeamApplicationCount = 0,
  unreadWeeklyEmailDraftCount = 0,
}: {
  profile: MyProfile | null;
  // profile is already role-downgraded when demo mode is active (see
  // getEffectiveProfile() in layout.tsx) — isDemoActive/canToggleDemo are
  // only for rendering the toggle control itself.
  isDemoActive?: boolean;
  canToggleDemo?: boolean;
  unreadFeedbackCount?: number;
  unreadJoinSubmissionCount?: number;
  unreadDjInquiryCount?: number;
  unreadTeamApplicationCount?: number;
  unreadWeeklyEmailDraftCount?: number;
}) {
  // Same shared-team-inbox unread badge as Feedback, now covering all
  // five owner/admin-only inboxes (see supabase/migrations/0017, 0021, 0022).
  const UNREAD_COUNTS: Record<string, number> = {
    "/eboard/feedback": unreadFeedbackCount,
    "/eboard/join-submissions": unreadJoinSubmissionCount,
    "/eboard/dj-inquiries": unreadDjInquiryCount,
    "/eboard/team-applications": unreadTeamApplicationCount,
    "/eboard/weekly-email": unreadWeeklyEmailDraftCount,
  };
  // Feedback, Join Submissions, DJ Inquiries, Team Applications, and
  // Weekly Email are all owner/admin-only (see
  // supabase/migrations/0011_feedback_admin_only.sql,
  // 0014_join_and_dj_inquiries.sql, 0021_team_applications.sql,
  // 0022_weekly_email_drafts.sql) — no point showing eboard-tier members a
  // link that just lands on a read-only page. Feed Videos and Weekly
  // Spotlight are edit-restricted too (owner/admin and owner-only
  // respectively — see their actions.ts), so they're hidden the same way.
  const OWNER_ADMIN_ONLY = [
    "/eboard/feedback",
    "/eboard/join-submissions",
    "/eboard/dj-inquiries",
    "/eboard/team-applications",
    "/eboard/weekly-email",
    "/eboard/videos",
    "/eboard/track",
  ];
  const visibleLinks = links.filter(
    (l) =>
      !OWNER_ADMIN_ONLY.includes(l.href) || canManage(profile?.role ?? null)
  );

  return (
    <nav className="flex flex-col gap-1 border-b border-navy-800 pb-6 sm:w-52 sm:shrink-0 sm:border-b-0 sm:border-r sm:border-navy-800 sm:pb-0 sm:pr-6">
      {canToggleDemo && (
        <div className="mb-3">
          {isDemoActive ? (
            <form action={exitDemoView}>
              <div className="rounded-lg border border-gold bg-gold/10 px-3 py-2">
                <p className="text-xs font-semibold text-gold">
                  Viewing as E-Board (demo)
                </p>
                <button
                  type="submit"
                  className="mt-1 text-xs text-steel-light underline transition-colors hover:text-gold"
                >
                  Exit demo view
                </button>
              </div>
            </form>
          ) : (
            <form action={enterDemoView}>
              <button
                type="submit"
                className="w-full rounded-lg border border-navy-800 px-3 py-2 text-left text-xs font-medium text-steel-light transition-colors hover:border-gold hover:text-gold"
              >
                View as E-Board
              </button>
            </form>
          )}
        </div>
      )}
      {profile && (
        <p className="mb-2 px-3 text-xs uppercase tracking-wide text-steel-light">
          Signed in as{" "}
          <span className="font-semibold text-gold">
            {ROLE_LABELS[profile.role]}
          </span>
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {visibleLinks.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-steel-light transition-colors hover:bg-navy-900 hover:text-gold"
            >
              <l.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1">{l.label}</span>
              {(UNREAD_COUNTS[l.href] ?? 0) > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy-950">
                  {UNREAD_COUNTS[l.href]}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-3 border-t border-navy-800 pt-4">
        <div className="flex items-center justify-between gap-2 px-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ivory">
              {profile?.displayName || "Set your name"}
            </p>
            <Link
              href="/eboard/profile"
              className="text-xs text-steel-light hover:text-gold"
            >
              Edit name
            </Link>
          </div>
        </div>
        <div className="px-3">
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}

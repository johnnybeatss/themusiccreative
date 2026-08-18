import Link from "next/link";
import {
  FileText,
  Calendar,
  FolderOpen,
  StickyNote,
  PartyPopper,
  MessageSquare,
  Briefcase,
  UserPlus,
  Disc3,
  Users,
  Mail,
  BarChart3,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { getEffectiveRole, canManage, isOwner } from "@/lib/supabase/role";
import { getUnreadFeedbackCount } from "@/lib/supabase/feedback";
import {
  getUnreadJoinSubmissionCount,
  getUnreadDjInquiryCount,
  getUnreadTeamApplicationCount,
  getUnreadWeeklyEmailDraftCount,
} from "@/lib/supabase/unreadCounts";

const sections = [
  {
    href: "/eboard/events",
    label: "Events",
    description: "Add, edit, and remove what shows on the public Events page.",
    icon: PartyPopper,
  },
  {
    href: "/eboard/opportunities",
    label: "Opportunities",
    description: "Add, edit, and remove what shows on the public Opportunities page.",
    icon: Briefcase,
  },
  {
    href: "/eboard/team",
    label: "Team",
    description: "Photos, bios, and display order for the public Team page.",
    icon: Users,
  },
  {
    href: "/eboard/join-submissions",
    label: "Join Submissions",
    description: "Responses from the public Join form — export to Excel.",
    icon: UserPlus,
  },
  {
    href: "/eboard/dj-inquiries",
    label: "DJ Inquiries",
    description: "Event DJ booking requests — export to Excel.",
    icon: Disc3,
  },
  {
    href: "/eboard/team-applications",
    label: "Team Applications",
    description: "Applications to join E-Board, with resumes — export to Excel.",
    icon: UserPlus,
  },
  {
    href: "/eboard/feedback",
    label: "Feedback",
    description: "Responses from the public feedback board — private to E-Board.",
    icon: MessageSquare,
  },
  {
    href: "/eboard/weekly-email",
    label: "Weekly Email",
    description: "Review and send the auto-drafted weekly events email.",
    icon: Mail,
  },
  {
    href: "/eboard/reports",
    label: "Weekly Reports",
    description: "This week's events, to-dos, content ideas, and notes.",
    icon: FileText,
  },
  {
    href: "/eboard/calendar",
    label: "Meeting Calendar",
    description: "E-Board meeting schedule and Google Calendar link.",
    icon: Calendar,
  },
  {
    href: "/eboard/resources",
    label: "Drive Resources",
    description: "Team deck and shared files, all in one Drive folder.",
    icon: FolderOpen,
  },
  {
    href: "/eboard/notes",
    label: "Leadership Notes",
    description: "Free-form internal notes for E-Board.",
    icon: StickyNote,
  },
  {
    href: "/eboard/analytics",
    label: "Analytics",
    description: "Website traffic from Vercel Web Analytics — owner only.",
    icon: BarChart3,
  },
];

export default async function EboardHomePage() {
  const [
    role,
    unreadFeedbackCount,
    unreadJoinSubmissionCount,
    unreadDjInquiryCount,
    unreadTeamApplicationCount,
    unreadWeeklyEmailDraftCount,
  ] = await Promise.all([
    getEffectiveRole(),
    getUnreadFeedbackCount(),
    getUnreadJoinSubmissionCount(),
    getUnreadDjInquiryCount(),
    getUnreadTeamApplicationCount(),
    getUnreadWeeklyEmailDraftCount(),
  ]);
  // Feedback, Join Submissions, DJ Inquiries, Team Applications, and
  // Weekly Email are owner/admin-only — see
  // supabase/migrations/0011_feedback_admin_only.sql,
  // 0014_join_and_dj_inquiries.sql, 0021_team_applications.sql, and
  // 0022_weekly_email_drafts.sql.
  const OWNER_ADMIN_ONLY = [
    "/eboard/feedback",
    "/eboard/join-submissions",
    "/eboard/dj-inquiries",
    "/eboard/team-applications",
    "/eboard/weekly-email",
  ];
  // Stricter than OWNER_ADMIN_ONLY — site traffic data, owner account only.
  const OWNER_ONLY = ["/eboard/analytics"];
  const visibleSections = sections.filter((s) => {
    if (OWNER_ONLY.includes(s.href)) return isOwner(role);
    if (OWNER_ADMIN_ONLY.includes(s.href)) return canManage(role);
    return true;
  });
  // Same shared-team-inbox unread badge as the sidebar (0017, 0021, 0022).
  const UNREAD_COUNTS: Record<string, number> = {
    "/eboard/feedback": unreadFeedbackCount,
    "/eboard/join-submissions": unreadJoinSubmissionCount,
    "/eboard/dj-inquiries": unreadDjInquiryCount,
    "/eboard/team-applications": unreadTeamApplicationCount,
    "/eboard/weekly-email": unreadWeeklyEmailDraftCount,
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        E-BOARD
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Internal tools — none of this is visible on the public site.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visibleSections.map((s, i) => (
          <Reveal key={s.href} delay={i * 0.05} className="h-full">
            <Link
              href={s.href}
              className="group relative flex h-full items-start gap-4 rounded-xl border border-navy-800 bg-navy-900 p-5 transition-colors hover:border-gold"
            >
              {(UNREAD_COUNTS[s.href] ?? 0) > 0 && (
                <span className="absolute right-4 top-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy-950">
                  {UNREAD_COUNTS[s.href]}
                </span>
              )}
              <s.icon
                className="mt-0.5 h-6 w-6 shrink-0 text-steel-light transition-colors group-hover:text-gold"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-semibold text-ivory">{s.label}</p>
                <p className="mt-1 text-sm text-steel-light">
                  {s.description}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

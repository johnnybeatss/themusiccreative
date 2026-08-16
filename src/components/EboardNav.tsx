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
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { canManage, type MyProfile } from "@/lib/supabase/role";

const links = [
  { href: "/eboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/eboard/events", label: "Events", icon: PartyPopper },
  { href: "/eboard/opportunities", label: "Opportunities", icon: Briefcase },
  {
    href: "/eboard/join-submissions",
    label: "Join Submissions",
    icon: UserPlus,
  },
  { href: "/eboard/dj-inquiries", label: "DJ Inquiries", icon: Disc3 },
  { href: "/eboard/videos", label: "Feed Videos", icon: Video },
  { href: "/eboard/track", label: "Weekly Spotlight", icon: Music },
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
  unreadFeedbackCount = 0,
}: {
  profile: MyProfile | null;
  unreadFeedbackCount?: number;
}) {
  // Feedback, Join Submissions, and DJ Inquiries are all owner/admin-only
  // (see supabase/migrations/0011_feedback_admin_only.sql and
  // 0014_join_and_dj_inquiries.sql) — no point showing eboard-tier members
  // a link that just RLS-blocks them once clicked.
  const OWNER_ADMIN_ONLY = [
    "/eboard/feedback",
    "/eboard/join-submissions",
    "/eboard/dj-inquiries",
  ];
  const visibleLinks = links.filter(
    (l) =>
      !OWNER_ADMIN_ONLY.includes(l.href) || canManage(profile?.role ?? null)
  );

  return (
    <nav className="flex flex-col gap-1 border-b border-navy-800 pb-6 sm:w-52 sm:shrink-0 sm:border-b-0 sm:border-r sm:border-navy-800 sm:pb-0 sm:pr-6">
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
              {l.href === "/eboard/feedback" && unreadFeedbackCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy-950">
                  {unreadFeedbackCount}
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

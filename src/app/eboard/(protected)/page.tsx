import Link from "next/link";
import {
  FileText,
  Calendar,
  FolderOpen,
  StickyNote,
  PartyPopper,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { getUnreadFeedbackCount } from "@/lib/supabase/feedback";

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
    href: "/eboard/feedback",
    label: "Feedback",
    description: "Responses from the public feedback board — private to E-Board.",
    icon: MessageSquare,
  },
  {
    href: "/eboard/reports",
    label: "Weekly Reports",
    description: "Submit and review weekly E-Board updates.",
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
    description: "Team deck, intake form, and shared files.",
    icon: FolderOpen,
  },
  {
    href: "/eboard/notes",
    label: "Leadership Notes",
    description: "Free-form internal notes for E-Board.",
    icon: StickyNote,
  },
];

export default async function EboardHomePage() {
  const [role, unreadFeedbackCount] = await Promise.all([
    getMyRole(),
    getUnreadFeedbackCount(),
  ]);
  // Feedback responses are owner/admin-only — see
  // supabase/migrations/0011_feedback_admin_only.sql.
  const visibleSections = sections.filter(
    (s) => s.href !== "/eboard/feedback" || canManage(role)
  );

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
              {s.href === "/eboard/feedback" && unreadFeedbackCount > 0 && (
                <span className="absolute right-4 top-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy-950">
                  {unreadFeedbackCount}
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

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
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import type { MyProfile } from "@/lib/supabase/role";

const links = [
  { href: "/eboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/eboard/events", label: "Events", icon: PartyPopper },
  { href: "/eboard/videos", label: "Feed Videos", icon: Video },
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
export default function EboardNav({ profile }: { profile: MyProfile | null }) {
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
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-steel-light transition-colors hover:bg-navy-900 hover:text-gold"
            >
              <l.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {l.label}
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

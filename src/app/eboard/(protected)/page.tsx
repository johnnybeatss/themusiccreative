import Link from "next/link";
import {
  FileText,
  Calendar,
  FolderOpen,
  StickyNote,
  PartyPopper,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const sections = [
  {
    href: "/eboard/events",
    label: "Events",
    description: "Add, edit, and remove what shows on the public Events page.",
    icon: PartyPopper,
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

export default function EboardHomePage() {
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
        {sections.map((s, i) => (
          <Reveal key={s.href} delay={i * 0.05}>
            <Link
              href={s.href}
              className="group flex items-start gap-4 rounded-xl border border-navy-800 bg-navy-900 p-5 transition-colors hover:border-gold"
            >
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

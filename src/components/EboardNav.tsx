import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

const links = [
  { href: "/eboard", label: "Dashboard" },
  { href: "/eboard/reports", label: "Weekly Reports" },
  { href: "/eboard/calendar", label: "Meeting Calendar" },
  { href: "/eboard/resources", label: "Drive Resources" },
  { href: "/eboard/notes", label: "Leadership Notes" },
];

export default function EboardNav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-4">
      <ul className="flex flex-wrap gap-4 text-sm font-medium">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-steel-light transition-colors hover:text-gold"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-steel-light hover:text-gold"
        >
          ← Public site
        </Link>
        <SignOutButton />
      </div>
    </nav>
  );
}

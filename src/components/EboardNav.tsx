import Link from "next/link";

const links = [
  { href: "/eboard", label: "Dashboard" },
  { href: "/eboard/reports", label: "Weekly Reports" },
  { href: "/eboard/calendar", label: "Meeting Calendar" },
  { href: "/eboard/resources", label: "Drive Resources" },
  { href: "/eboard/notes", label: "Leadership Notes" },
];

export default function EboardNav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
      <ul className="flex flex-wrap gap-4 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Public site
      </Link>
    </nav>
  );
}

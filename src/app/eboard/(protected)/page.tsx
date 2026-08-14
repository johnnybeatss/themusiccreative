import Link from "next/link";

const sections = [
  { href: "/eboard/reports", label: "Weekly Reports" },
  { href: "/eboard/calendar", label: "Meeting Calendar" },
  { href: "/eboard/resources", label: "Drive Resources" },
  { href: "/eboard/notes", label: "Leadership Notes" },
];

export default function EboardHomePage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        E-BOARD
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block rounded-lg border border-navy-800 bg-navy-900 p-4 text-ivory transition-colors hover:border-gold"
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

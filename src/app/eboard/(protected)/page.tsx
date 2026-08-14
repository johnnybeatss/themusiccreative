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
      <h1 className="text-2xl font-bold">E-Board</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

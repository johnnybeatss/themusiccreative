import Link from "next/link";

const sections = [
  {
    href: "/eboard/reports",
    label: "Weekly Reports",
    description: "Submit and review weekly E-Board updates.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m-7 5h8a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0013.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
  },
  {
    href: "/eboard/calendar",
    label: "Meeting Calendar",
    description: "E-Board meeting schedule and Google Calendar link.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    href: "/eboard/resources",
    label: "Drive Resources",
    description: "Team deck, intake form, and shared files.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    ),
  },
  {
    href: "/eboard/notes",
    label: "Leadership Notes",
    description: "Free-form internal notes for E-Board.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    ),
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
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex items-start gap-4 rounded-xl border border-navy-800 bg-navy-900 p-5 transition-colors hover:border-gold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="mt-0.5 h-6 w-6 shrink-0 text-steel-light transition-colors group-hover:text-gold"
              >
                {s.icon}
              </svg>
              <div>
                <p className="font-semibold text-ivory">{s.label}</p>
                <p className="mt-1 text-sm text-steel-light">
                  {s.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

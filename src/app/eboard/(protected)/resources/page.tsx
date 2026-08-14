// Link-only, per the club's standing rule: the Member Intake Responses
// spreadsheet contains PII (names, phone numbers, FIU student IDs, emails)
// and must never be fetched or displayed here — link out to it only.
const links = [
  {
    label: "Team Deck",
    href: "https://docs.google.com/presentation/d/1fQpqyzD9fF9EIarbhKgRsNElcLPJ7x1Zi9iX_xqFNEQ/edit",
  },
  {
    label: "Member Intake Form",
    href: "https://docs.google.com/forms/d/1UykWqyXWRb84eL_krCbJlvQpLb3fDOrKj8FrMLvM4G8/edit",
  },
  {
    label: "Member Intake Responses (contains PII — link only)",
    href: "https://docs.google.com/spreadsheets/d/1JZhRDzPwjDsvWDeszr2NpG7vIK-bTPaw8Y8prLQggXg/edit",
  },
];

export default function ResourcesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        DRIVE RESOURCES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <ul className="mt-6 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gold underline"
            >
              {l.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/calendar", label: "Calendar" },
  { href: "/team", label: "Team" },
];

export default function Nav() {
  return (
    <header className="border-b border-navy-800 bg-navy-900">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="The Music Creative @ FIU"
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="hidden font-display text-lg tracking-wide text-ivory sm:inline">
            THE MUSIC CREATIVE
          </span>
        </Link>
        <ul className="flex gap-5 text-sm font-medium">
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
      </nav>
    </header>
  );
}

import Link from "next/link";
import { Instagram } from "lucide-react";
import NewsletterForm from "./NewsletterForm";
import CharmScatter from "./CharmScatter";

const INSTAGRAM_URL = "https://instagram.com/themusiccreativefiu";

export default function Footer() {
  return (
    <footer className="relative border-t border-navy-800">
      <CharmScatter
        items={[
          { name: "star", className: "left-[4%] top-[15%] w-10 rotate-6" },
          {
            name: "cd",
            className: "right-[4%] top-[20%] w-12 -rotate-12",
          },
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-steel-light">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Link href="/" className="font-display tracking-wide text-ivory">
            THE MUSIC CREATIVE
          </Link>
          <NewsletterForm />
        </div>
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
          <Link href="/events" className="transition-colors hover:text-accent">
            Events
          </Link>
          <Link href="/merch" className="transition-colors hover:text-accent">
            Merch
          </Link>
          <Link href="/spotlights" className="transition-colors hover:text-accent">
            Spotlights
          </Link>
          <Link href="/battles" className="transition-colors hover:text-accent">
            Spotlight Battles
          </Link>
          <Link href="/collab" className="transition-colors hover:text-accent">
            Collab Board
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-accent">
            Leaderboard
          </Link>
          <Link href="/dj-booking" className="transition-colors hover:text-accent">
            DJ Booking
          </Link>
          <Link href="/join-team" className="transition-colors hover:text-accent">
            Join the Team
          </Link>
        </nav>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p>&copy; {new Date().getFullYear()} The Music Creative @ FIU.</p>
            <p className="flex gap-4 text-xs">
              <Link href="/privacy" className="transition-colors hover:text-accent">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-accent">
                Terms
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/join"
              className="font-semibold text-accent transition-colors hover:text-accent"
            >
              Join the club →
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex items-center gap-2 text-steel-light transition-colors hover:text-accent"
            >
              <Instagram size={18} />
              <span>@themusiccreativefiu</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

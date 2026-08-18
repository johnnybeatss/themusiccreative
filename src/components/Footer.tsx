import Link from "next/link";
import { Instagram } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const INSTAGRAM_URL = "https://instagram.com/themusiccreativefiu";

export default function Footer() {
  return (
    <footer className="border-t border-navy-800">
      <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-steel-light">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Link href="/" className="font-display tracking-wide text-ivory">
            THE MUSIC CREATIVE
          </Link>
          <NewsletterForm />
        </div>
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
          <Link href="/events" className="transition-colors hover:text-gold">
            Events
          </Link>
          <Link href="/merch" className="transition-colors hover:text-gold">
            Merch
          </Link>
          <Link href="/dj-booking" className="transition-colors hover:text-gold">
            DJ Booking
          </Link>
          <Link href="/join-team" className="transition-colors hover:text-gold">
            Join the Team
          </Link>
        </nav>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} The Music Creative @ FIU.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/join"
              className="font-semibold text-gold transition-colors hover:text-gold-light"
            >
              Join the club →
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex items-center gap-2 text-steel-light transition-colors hover:text-gold"
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

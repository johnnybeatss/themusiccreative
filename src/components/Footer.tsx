import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

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
        <p className="mt-8 text-center sm:text-left">
          &copy; {new Date().getFullYear()} The Music Creative @ FIU.
        </p>
      </div>
    </footer>
  );
}

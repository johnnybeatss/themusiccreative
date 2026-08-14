import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-navy-800">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-steel-light sm:flex-row">
        <Link href="/" className="font-display tracking-wide text-ivory">
          THE MUSIC CREATIVE
        </Link>
        <p>&copy; {new Date().getFullYear()} The Music Creative @ FIU.</p>
      </div>
    </footer>
  );
}

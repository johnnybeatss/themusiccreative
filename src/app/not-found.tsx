import type { Metadata } from "next";
import Link from "next/link";
import CharmScatter from "@/components/CharmScatter";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="relative py-16 text-center">
      <CharmScatter
        items={[
          { name: "cd", className: "left-[8%] top-0 w-16 -rotate-12" },
          { name: "headphones", className: "right-[8%] bottom-0 w-16 rotate-6" },
        ]}
      />
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-3 font-display text-4xl tracking-wide text-ivory">
        THIS TRACK DOESN&apos;T EXIST.
      </h1>
      <div className="mx-auto mt-3 h-1 w-16 bg-gold" />
      <p className="mx-auto mt-5 max-w-md text-sm text-steel-light">
        The page you&apos;re looking for moved or never dropped. Try one of
        these instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-light"
        >
          Back home
        </Link>
        <Link
          href="/events"
          className="rounded-lg border border-gold px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-gold hover:text-white"
        >
          Upcoming events
        </Link>
        <Link
          href="/join"
          className="rounded-lg border border-gold px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-gold hover:text-white"
        >
          Join the club
        </Link>
      </div>
    </div>
  );
}

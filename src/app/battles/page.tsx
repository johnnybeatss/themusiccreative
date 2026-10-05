import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { pageOpenGraph } from "@/lib/pageMetadata";
import { getPublicBattles, STATUS_LABEL } from "@/lib/battles";

const TITLE = "Spotlight Battles";
const DESCRIPTION =
  "Vote on who gets the weekly spotlight at The Music Creative @ FIU. Winner plays site-wide.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/battles" },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/battles"),
};

export default async function BattlesPage() {
  const battles = await getPublicBattles();
  const live = battles.filter((b) => b.status !== "closed");
  const past = battles.filter((b) => b.status === "closed");

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">SPOTLIGHT BATTLES</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-2xl text-sm text-steel-light">
        Beats, songs, mixes — everything submitted goes head to head here.
        Anyone can vote (one vote per person), and the winner takes over the
        player at the bottom of the site for the week.{" "}
        <a href="/#submit-track" className="text-accent hover:underline">
          Submit your music
        </a>
        {" · "}
        <Link href="/spotlights" className="text-accent hover:underline">
          See past spotlights
        </Link>
      </p>

      {battles.length === 0 && (
        <p className="mt-6 text-steel-light">No battles yet — check back soon.</p>
      )}

      {live.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {live.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.05}>
              <Link
                href={`/battles/${b.id}`}
                className="block rounded-xl border border-gold/50 bg-navy-900 p-5 transition-colors hover:border-gold"
              >
                <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {STATUS_LABEL[b.status]}
                </span>
                <p className="mt-2 font-display text-xl tracking-wide text-ivory">{b.title}</p>
                {b.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-steel-light">{b.description}</p>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-ivory">PAST BATTLES</h2>
          <ul className="mt-4 space-y-2">
            {past.map((b) => (
              <li key={b.id}>
                <Link href={`/battles/${b.id}`} className="text-sm text-accent hover:underline">
                  {b.title} &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

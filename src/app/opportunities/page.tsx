import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";
import CharmScatter from "@/components/CharmScatter";
import { getMiamiMusicEvents } from "@/lib/miamiMusicEvents";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Opportunities";
const DESCRIPTION =
  "Gigs, internships, and industry openings shared with members of The Music Creative @ FIU.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/opportunities",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/opportunities"),
};

type Opportunity = {
  id: string;
  title: string;
  type: string;
  contact_link: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
};

const STALE_AFTER_DAYS = 60;

// Postings older than this stop showing on the public page (still visible
// and manageable in the E-Board hub) — keeps internship listings from
// sitting around as dead links for months. See
// src/app/eboard/(protected)/opportunities/actions.ts for how they're added.
async function getOpportunities(): Promise<Opportunity[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  // Pinned listings (e.g. "EVENT DJ INQUIRIES") skip the staleness filter
  // entirely — see supabase/migrations/0014_join_and_dj_inquiries.sql.
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .or(`is_pinned.eq.true,created_at.gte.${cutoff}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load opportunities:", error.message);
    return [];
  }
  return data ?? [];
}

// "What's happening this month" — Miami-area music industry events, pulled
// live via src/lib/miamiMusicEvents.ts (Ticketmaster Discovery API).
// Requires TICKETMASTER_API_KEY to be set in Vercel; until then this
// quietly renders nothing rather than breaking the page. Cached for 6
// hours via Next's fetch revalidation, so it stays current without hitting
// the API on every request. Also reused (with a 7-day window instead of a
// month) by the weekly email cron route.

export default async function OpportunitiesPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const [opportunities, miamiEvents] = await Promise.all([
    getOpportunities(),
    getMiamiMusicEvents({ startDate: startOfMonth, endDate: endOfMonth, limit: 6 }),
  ]);

  return (
    <div className="relative">
      <CharmScatter
        items={[
          {
            name: "mic-vintage",
            className: "right-[3%] top-0 w-12 rotate-6",
          },
          { name: "star", className: "left-[2%] top-[6%] w-14 -rotate-12" },
        ]}
      />
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        OPPORTUNITIES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/50 bg-navy-900 p-5">
        <div>
          <p className="font-display text-lg tracking-wide text-ivory">
            WANT TO DJ FOR US?
          </p>
          <p className="mt-1 text-sm text-steel-light">
            We keep a running list of DJs to pull from when we&apos;re
            booking future events — sign up to get on it.
          </p>
        </div>
        <a
          href="/dj-booking"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light"
        >
          Sign Up &rarr;
        </a>
      </div>

      {opportunities.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No opportunities posted right now — check back soon.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.05} className="h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold">
                {o.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.image_url}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold text-ivory">{o.title}</p>
                  {o.type !== "Other" && (
                    <p className="mt-1 text-sm text-steel-light">{o.type}</p>
                  )}
                  {o.contact_link && (
                    <a
                      href={o.contact_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-gold px-4 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy-950"
                    >
                      Learn More
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {miamiEvents.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-ivory">
            WHAT&apos;S HAPPENING THIS MONTH
          </h2>
          <div className="mt-2 h-1 w-16 bg-gold" />
          <p className="mt-4 text-sm text-steel-light">
            Music industry events around Miami this month — updates
            automatically.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {miamiEvents.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.05}>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold"
                >
                  {e.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.imageUrl}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <p className="font-semibold text-ivory group-hover:text-gold">
                      {e.name}
                    </p>
                    <p className="mt-1 text-sm text-steel-light">
                      {new Date(e.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {e.venue ? ` · ${e.venue}` : ""}
                    </p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

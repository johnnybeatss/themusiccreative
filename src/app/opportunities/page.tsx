import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";
import StatusPill from "@/components/StatusPill";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Gigs, internships, and industry openings shared with members of The Music Creative @ FIU.",
  alternates: {
    canonical: "/opportunities",
  },
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

// --- "What's happening this month" — Miami-area music industry events,
// pulled live from Ticketmaster's Discovery API (a real public API, not a
// scraper). Requires TICKETMASTER_API_KEY to be set in Vercel; until then
// this quietly renders nothing rather than breaking the page. Cached for 6
// hours via Next's fetch revalidation, so it stays current without hitting
// the API on every request.

type TicketmasterEvent = {
  id: string;
  name: string;
  url: string;
  dates: { start: { dateTime?: string; localDate: string } };
  images?: { url: string; width: number }[];
  _embedded?: { venues?: { name: string }[] };
};

type TicketmasterResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
};

type MiamiMusicEvent = {
  id: string;
  name: string;
  date: string;
  url: string;
  imageUrl: string | null;
  venue: string | null;
};

async function getMiamiMusicEvents(): Promise<MiamiMusicEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];

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
  const toTmDateTime = (d: Date) => d.toISOString().split(".")[0] + "Z";

  const params = new URLSearchParams({
    apikey: apiKey,
    city: "Miami",
    stateCode: "FL",
    classificationName: "music",
    startDateTime: toTmDateTime(startOfMonth),
    endDateTime: toTmDateTime(endOfMonth),
    sort: "date,asc",
    size: "6",
  });

  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { next: { revalidate: 21600 } } // 6 hours
    );
    if (!res.ok) {
      console.error("Ticketmaster API error:", res.status, res.statusText);
      return [];
    }
    const data = (await res.json()) as TicketmasterResponse;
    const events = data._embedded?.events ?? [];
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.dates.start.dateTime ?? e.dates.start.localDate,
      url: e.url,
      imageUrl:
        e.images?.find((img) => img.width >= 640)?.url ??
        e.images?.[0]?.url ??
        null,
      venue: e._embedded?.venues?.[0]?.name ?? null,
    }));
  } catch (err) {
    console.error("Failed to fetch Ticketmaster events:", err);
    return [];
  }
}

export default async function OpportunitiesPage() {
  const [opportunities, miamiEvents] = await Promise.all([
    getOpportunities(),
    getMiamiMusicEvents(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        OPPORTUNITIES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {opportunities.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No opportunities posted right now — check back soon.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {opportunities.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.05}>
              <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold">
                {o.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.image_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ivory">{o.title}</p>
                    <StatusPill status={o.status} />
                  </div>
                  <p className="mt-1 text-sm text-steel-light">{o.type}</p>
                  {o.contact_link && (
                    <a
                      href={o.contact_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-gold underline"
                    >
                      {o.contact_link}
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

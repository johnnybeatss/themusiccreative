import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";
import CharmScatter from "@/components/CharmScatter";
import { formatEventDateTime } from "@/lib/eventTimezone";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Events";
const DESCRIPTION =
  "Upcoming workshops, showcases, and meetups from The Music Creative @ FIU — a student-led music production community in Miami.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/events",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/events"),
};

type Event = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string;
  status: string;
  image_url: string | null;
};

// Events stay under "Upcoming" for a few hours after their start time so a
// show that's currently happening doesn't jump to "Past" the moment it begins.
const IN_PROGRESS_GRACE_MS = 6 * 60 * 60 * 1000;

type Tab = "upcoming" | "past";

async function getEvents(tab: Tab): Promise<Event[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - IN_PROGRESS_GRACE_MS).toISOString();
  const query = supabase.from("events").select("*");
  const { data, error } =
    tab === "past"
      ? await query.lt("date", cutoff).order("date", { ascending: false })
      : await query.gte("date", cutoff).order("date", { ascending: true });
  if (error) {
    console.error("Failed to load events:", error.message);
    return [];
  }
  return data ?? [];
}

// Rich results eligibility for real events — Google can show these in
// dedicated event search surfaces, not just a plain blue link. Only the
// fields we actually have reliable data for; no invented addresses.
function buildEventSchema(events: Event[]) {
  if (events.length === 0) return null;
  return events.map((e) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    startDate: new Date(e.date).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `https://themusiccreative.org/events/${e.id}`,
    location: e.location
      ? { "@type": "Place", name: e.location }
      : undefined,
    image: e.image_url ?? undefined,
    organizer: {
      "@type": "Organization",
      name: "The Music Creative @ FIU",
      url: "https://themusiccreative.org",
    },
  }));
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab: Tab = (await searchParams).tab === "past" ? "past" : "upcoming";
  const events = await getEvents(tab);
  // Only advertise upcoming events to search engines.
  const eventSchema = tab === "upcoming" ? buildEventSchema(events) : null;

  return (
    <div className="relative">
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      {/* Top-anchored only -- event cards below are full-width opaque
          bg-navy-900 blocks, so a charm anchored to the bottom of a
          variable-length list would just end up hidden behind one. */}
      <CharmScatter
        items={[
          { name: "cd", className: "right-[2%] top-0 w-16 rotate-12" },
          {
            name: "guitar-flying-v",
            className: "left-[3%] top-[8%] w-20 -rotate-6",
          },
        ]}
      />
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        {tab === "past" ? "PAST EVENTS" : "UPCOMING EVENTS"}
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <nav
        aria-label="Event filter"
        className="mt-6 inline-flex rounded-full border border-navy-800 bg-navy-900 p-1"
      >
        {(["upcoming", "past"] as const).map((t) => (
          <Link
            key={t}
            href={t === "past" ? "/events?tab=past" : "/events"}
            aria-current={tab === t ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-gold text-ivory"
                : "text-steel-light hover:text-ivory"
            }`}
          >
            {t === "past" ? "Past" : "Upcoming"}
          </Link>
        ))}
      </nav>
      {events.length === 0 ? (
        <p className="mt-6 text-steel-light">
          {tab === "past"
            ? "No past events yet."
            : "No upcoming events right now. Check back soon!"}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.05}>
              <Link
                href={`/events/${e.id}`}
                className="block overflow-hidden rounded-xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold"
              >
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
            loading={i < 3 ? "eager" : "lazy"}
            decoding="async"
                    src={e.image_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="font-semibold text-ivory">{e.name}</p>
                  <p className="mt-1 text-sm text-steel-light">
                    {formatEventDateTime(e.date)}
                    {e.location ? ` · ${e.location}` : ""} · {e.type}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

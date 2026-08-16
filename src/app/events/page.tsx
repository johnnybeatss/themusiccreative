import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";
import StatusPill from "@/components/StatusPill";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming workshops, showcases, and meetups from The Music Creative @ FIU — a student-led music production community in Miami.",
  alternates: {
    canonical: "/events",
  },
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

async function getEvents(): Promise<Event[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
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

export default async function EventsPage() {
  const events = await getEvents();
  const eventSchema = buildEventSchema(events);

  return (
    <div>
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        UPCOMING EVENTS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {events.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No events yet — this fills in once the database is connected
          (Phase 2) and events are entered.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.05}>
              <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold">
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.image_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ivory">{e.name}</p>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="mt-1 text-sm text-steel-light">
                    {new Date(e.date).toLocaleString()}
                    {e.location ? ` · ${e.location}` : ""} · {e.type}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

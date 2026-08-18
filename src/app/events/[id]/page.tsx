import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Instagram, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import RsvpForm from "./RsvpForm";
import ShareEventButton from "./ShareEventButton";
import AddToCalendarButton from "./AddToCalendarButton";
import { formatEventDateTime } from "@/lib/eventTimezone";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string;
  status: string;
  description: string | null;
  guest_instagram_url: string | null;
  image_url: string | null;
  photo_urls: string[];
};

async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// event_rsvps has no public SELECT policy (see
// supabase/migrations/0015_event_details_and_rsvps.sql — insert is public,
// read is owner/admin only) so attendee names/emails/notes stay private.
// This goes through the service-role client instead, purely to return a
// COUNT — never selects or exposes individual rows to the browser.
async function getRsvpCount(id: string): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 0;
  }
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);
    if (error) {
      console.error("Failed to load RSVP count:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("Failed to load RSVP count:", err);
    return 0;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return {};

  const description =
    event.description ?? `Join The Music Creative @ FIU for ${event.name}.`;
  const url = `https://themusiccreative.org/events/${event.id}`;

  // Next only inherits the root layout's openGraph/twitter blocks
  // wholesale when a route doesn't define its own — which is exactly why
  // sharing an event link (iMessage, Slack, etc.) was showing the generic
  // site-wide card instead of this event's name/photo. Setting them
  // explicitly here overrides that per event.
  return {
    title: event.name,
    description,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      title: event.name,
      description,
      url,
      siteName: "The Music Creative @ FIU",
      type: "website",
      images: event.image_url ? [event.image_url] : undefined,
    },
    twitter: {
      card: event.image_url ? "summary_large_image" : "summary",
      title: event.name,
      description,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const rsvpCount = await getRsvpCount(id);

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: new Date(event.date).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `https://themusiccreative.org/events/${event.id}`,
    description: event.description ?? undefined,
    location: event.location
      ? { "@type": "Place", name: event.location }
      : undefined,
    image: event.image_url ?? undefined,
    organizer: {
      "@type": "Organization",
      name: "The Music Creative @ FIU",
      url: "https://themusiccreative.org",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />

      {event.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.image_url}
          alt=""
          className="h-56 w-full rounded-xl object-cover sm:h-72"
        />
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          {event.name.toUpperCase()}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <AddToCalendarButton
            eventId={event.id}
            eventName={event.name}
            description={event.description}
            location={event.location}
            startIso={event.date}
          />
          <ShareEventButton eventName={event.name} />
        </div>
      </div>
      <div className="mt-2 h-1 w-16 bg-gold" />

      <p className="mt-4 text-sm text-steel-light">
        {formatEventDateTime(event.date)}
        {event.location ? ` · ${event.location}` : ""} · {event.type}
      </p>

      {rsvpCount > 0 && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
          <Users size={14} />
          {rsvpCount} {rsvpCount === 1 ? "person" : "people"} going
        </p>
      )}

      {event.guest_instagram_url && (
        <a
          href={event.guest_instagram_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
        >
          <Instagram size={14} />
          Guest on Instagram
        </a>
      )}

      {event.photo_urls.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {event.photo_urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="aspect-square w-full rounded-lg object-cover object-top"
            />
          ))}
        </div>
      )}

      {event.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm text-steel-light">
          {event.description}
        </p>
      )}

      <RsvpForm eventId={event.id} />
    </div>
  );
}

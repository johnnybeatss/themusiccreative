import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Instagram } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StatusPill from "@/components/StatusPill";
import RsvpForm from "./RsvpForm";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return {};

  return {
    title: event.name,
    description:
      event.description ??
      `Join The Music Creative @ FIU for ${event.name}.`,
    alternates: { canonical: `/events/${event.id}` },
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

      <div className="mt-6 flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          {event.name.toUpperCase()}
        </h1>
        <StatusPill status={event.status} />
      </div>
      <div className="mt-2 h-1 w-16 bg-gold" />

      <p className="mt-4 text-sm text-steel-light">
        {new Date(event.date).toLocaleString()}
        {event.location ? ` · ${event.location}` : ""} · {event.type}
      </p>

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

      {event.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm text-steel-light">
          {event.description}
        </p>
      )}

      {event.photo_urls.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {event.photo_urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-32 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <RsvpForm eventId={event.id} />
    </div>
  );
}

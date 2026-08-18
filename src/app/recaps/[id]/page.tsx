import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Recap = {
  id: string;
  title: string;
  body: string;
  photo_url: string | null;
  event_id: string | null;
  published_at: string;
};

async function getRecap(id: string): Promise<Recap | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recaps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function getEventName(eventId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .maybeSingle();
  return data?.name ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recap = await getRecap(id);
  if (!recap) return {};

  return {
    title: recap.title,
    description: recap.body.slice(0, 160),
    alternates: { canonical: `/recaps/${recap.id}` },
  };
}

export default async function RecapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recap = await getRecap(id);
  if (!recap) notFound();

  const eventName = recap.event_id ? await getEventName(recap.event_id) : null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: recap.title,
    datePublished: recap.published_at,
    image: recap.photo_url ?? undefined,
    url: `https://themusiccreative.org/recaps/${recap.id}`,
    publisher: {
      "@type": "Organization",
      name: "The Music Creative @ FIU",
      url: "https://themusiccreative.org",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {recap.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recap.photo_url}
          alt=""
          className="h-56 w-full rounded-xl object-cover sm:h-72"
        />
      )}

      <h1 className="mt-6 font-display text-3xl tracking-wide text-ivory">
        {recap.title.toUpperCase()}
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-xs text-steel-light">
        {new Date(recap.published_at).toLocaleDateString()}
      </p>

      {recap.event_id && eventName && (
        <Link
          href={`/events/${recap.event_id}`}
          className="mt-2 inline-block text-sm text-gold hover:underline"
        >
          Recap of: {eventName} &rarr;
        </Link>
      )}

      <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-ivory">
        {recap.body}
      </p>

      <Link
        href="/recaps"
        className="mt-8 inline-block text-xs text-steel-light hover:text-gold"
      >
        &larr; Back to Recaps
      </Link>
    </div>
  );
}

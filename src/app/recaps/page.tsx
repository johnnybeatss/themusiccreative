import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Recaps",
  description:
    "Write-ups from past workshops, showcases, and meetups hosted by The Music Creative @ FIU.",
  alternates: {
    canonical: "/recaps",
  },
};

type Recap = {
  id: string;
  title: string;
  body: string;
  photo_url: string | null;
  published_at: string;
};

async function getRecaps(): Promise<Recap[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recaps")
    .select("id, title, body, photo_url, published_at")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("Failed to load recaps:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function RecapsPage() {
  const recaps = await getRecaps();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        RECAPS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        What&apos;s actually happened at past workshops, showcases, and
        meetups.
      </p>
      {recaps.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No recaps yet — check back after the next event.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {recaps.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.05}>
              <Link
                href={`/recaps/${r.id}`}
                className="block overflow-hidden rounded-xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold"
              >
                {r.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.photo_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="font-semibold text-ivory">{r.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-steel-light">
                    {r.body}
                  </p>
                  <p className="mt-2 text-xs text-steel-light">
                    {new Date(r.published_at).toLocaleDateString()}
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

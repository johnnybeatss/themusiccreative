import type { Metadata } from "next";
import { Instagram } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Spotlight Archive",
  description:
    "Every track featured in the weekly spotlight player — past winners of The Music Creative @ FIU's weekly contest.",
  alternates: {
    canonical: "/spotlights",
  },
};

const TRACK_BUCKET = "weekly-track";

type Track = {
  id: string;
  track_title: string;
  artist_name: string;
  artist_instagram_url: string | null;
  audio_url: string;
};

// weekly_track has a public "select using (true)" RLS policy (see
// supabase/migrations/0009_weekly_track.sql) — it already holds full
// history since the site only ever inserts a new row each week rather than
// overwriting one, so this needs no new migration, just this query.
async function getTracks(): Promise<Track[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_track")
    .select("id, track_title, artist_name, storage_path, artist_instagram_url")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("Failed to load weekly_track archive:", error.message);
    return [];
  }
  return (data ?? []).map((t) => ({
    id: t.id,
    track_title: t.track_title,
    artist_name: t.artist_name,
    artist_instagram_url: t.artist_instagram_url,
    audio_url: supabase.storage.from(TRACK_BUCKET).getPublicUrl(t.storage_path)
      .data.publicUrl,
  }));
}

export default async function SpotlightsPage() {
  const tracks = await getTracks();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        SPOTLIGHT ARCHIVE
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-lg text-sm text-steel-light">
        Every track we&apos;ve featured in the player at the bottom of the
        site — one member spotlighted each week.
      </p>

      {tracks.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No tracks featured yet — check back soon.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {tracks.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.04}>
              <div className="rounded-xl border border-navy-800 bg-navy-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {i === 0 && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">
                        This Week
                      </p>
                    )}
                    <p className="font-semibold text-ivory">
                      {t.track_title}{" "}
                      <span className="font-normal text-steel-light">
                        — {t.artist_name}
                      </span>
                    </p>
                  </div>
                  {t.artist_instagram_url && (
                    <a
                      href={t.artist_instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gold hover:underline"
                    >
                      <Instagram size={14} />
                      Instagram
                    </a>
                  )}
                </div>
                <audio
                  controls
                  preload="none"
                  src={t.audio_url}
                  className="mt-3 w-full"
                />
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

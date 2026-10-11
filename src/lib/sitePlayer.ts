import "server-only";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// The bottom player (current spotlight + "Vote for next week" link) is
// rendered by the root layout, so it used to cost 2 database queries on
// EVERY page view, and it read through the cookie-based client, which made
// every page fully dynamic. This caches both lookups for 60 seconds using a
// cookieless anon client (same public data; RLS applies exactly as before).
//
// Changes made in E-Board show up immediately: every action that changes
// the spotlight or a battle's status calls updateTag(SITE_PLAYER_TAG)
// (crown cron uses revalidateTag with expire: 0). The only thing that can
// lag is the database's own Mon/Fri battle timer — by at most 60 seconds.
export const SITE_PLAYER_TAG = "site-player";
const TRACK_BUCKET = "weekly-track";

function publicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export type SitePlayerTrack = {
  track_title: string;
  artist_name: string;
  artist_instagram_url: string | null;
  apple_music_url: string | null;
  spotify_url: string | null;
  audio_url: string;
};

export const getSitePlayer = unstable_cache(
  async (): Promise<{ track: SitePlayerTrack | null; votingBattleId: string | null }> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { track: null, votingBattleId: null };
    const supabase = publicClient();
    const [{ data: t, error }, { data: battle }] = await Promise.all([
      supabase
        .from("weekly_track")
        .select("track_title, artist_name, storage_path, artist_instagram_url, apple_music_url, spotify_url")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("beat_battles")
        .select("id")
        .eq("status", "voting")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const track =
      !error && t
        ? {
            track_title: t.track_title,
            artist_name: t.artist_name,
            artist_instagram_url: t.artist_instagram_url,
            apple_music_url: t.apple_music_url,
            spotify_url: t.spotify_url,
            audio_url: supabase.storage.from(TRACK_BUCKET).getPublicUrl(t.storage_path).data.publicUrl,
          }
        : null;
    return { track, votingBattleId: battle?.id ?? null };
  },
  ["site-player-v1"],
  { revalidate: 60, tags: [SITE_PLAYER_TAG] }
);

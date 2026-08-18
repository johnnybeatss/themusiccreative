import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, isOwner } from "@/lib/supabase/role";
import TrackUploadForm from "./TrackUploadForm";
import TrackDeleteForm from "./TrackDeleteForm";

const BUCKET = "weekly-track";

async function getCurrentTrack() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_track")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("Failed to load weekly_track:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    ...data,
    audio_url: supabase.storage.from(BUCKET).getPublicUrl(data.storage_path)
      .data.publicUrl,
  };
}

// Owner-only, on purpose — see supabase/migrations/0009_weekly_track.sql.
// Everyone else gets a read-only "here's what's live" view.
export default async function WeeklyTrackAdminPage() {
  const [track, role] = await Promise.all([getCurrentTrack(), getEffectiveRole()]);
  const editable = isOwner(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        WEEKLY SPOTLIGHT
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        {editable
          ? "The track that plays in the bottom bar site-wide. Uploading a new one replaces it everywhere immediately."
          : "What's currently featured in the site-wide player. Only the owner account can change it."}
      </p>

      {track ? (
        <div className="mt-6 rounded-xl border border-navy-800 bg-navy-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
            Currently featured
          </p>
          <p className="mt-1 font-semibold text-ivory">
            {track.track_title} — {track.artist_name}
          </p>
          {track.artist_instagram_url && (
            <a
              href={track.artist_instagram_url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-gold underline"
            >
              {track.artist_instagram_url}
            </a>
          )}
          {(track.apple_music_url || track.spotify_url) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {track.apple_music_url && (
                <a
                  href={track.apple_music_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
                >
                  Apple Music
                </a>
              )}
              {track.spotify_url && (
                <a
                  href={track.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold"
                >
                  Spotify
                </a>
              )}
            </div>
          )}
          <audio
            controls
            src={track.audio_url}
            className="mt-3 w-full"
            preload="none"
          />
          {editable && (
            <TrackDeleteForm
              id={track.id}
              trackTitle={track.track_title}
              storagePath={track.storage_path}
            />
          )}
        </div>
      ) : (
        <p className="mt-6 text-steel-light">
          No track featured right now — the bottom player is hidden
          site-wide until one is set.
        </p>
      )}

      {editable && <TrackUploadForm />}
    </div>
  );
}

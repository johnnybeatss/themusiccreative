import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, isOwner } from "@/lib/supabase/role";
import TrackUploadForm from "./TrackUploadForm";
import TrackHistoryItem, { type WeeklyTrack } from "./TrackHistoryItem";

const BUCKET = "weekly-track";

// Every weekly_track row ever inserted, newest first — whichever one is
// newest IS "currently featured" (see saveWeeklyTrack/refeatureTrack in
// actions.ts, both of which insert rather than update-in-place so this
// history stays intact). Everything after the first row is the archive.
async function getTrackHistory(): Promise<WeeklyTrack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_track")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("Failed to load weekly_track:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...row,
    audio_url: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path)
      .data.publicUrl,
  }));
}

// Owner-only editing, on purpose — see supabase/migrations/0009_weekly_track.sql.
// Everyone else (admin/eboard who can still reach this page) gets a
// read-only "here's what's live, here's what's run before" view.
export default async function WeeklyTrackAdminPage() {
  const [history, role] = await Promise.all([
    getTrackHistory(),
    getEffectiveRole(),
  ]);
  const editable = isOwner(role);
  const [current, ...archive] = history;

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

      {current ? (
        <div className="mt-6">
          <TrackHistoryItem track={current} isCurrent editable={editable} />
        </div>
      ) : (
        <p className="mt-6 text-steel-light">
          No track featured right now — the bottom player is hidden
          site-wide until one is set.
        </p>
      )}

      {editable && <TrackUploadForm />}

      {archive.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl tracking-wide text-ivory">
            PAST SPOTLIGHTS
          </h2>
          <div className="mt-2 h-1 w-12 bg-gold" />
          <p className="mt-3 text-sm text-steel-light">
            Every track that&apos;s been featured before.
            {editable &&
              " Feature one again, or fix a typo without re-uploading."}
          </p>
          <div className="mt-4 space-y-4">
            {archive.map((track) => (
              <TrackHistoryItem
                key={track.id}
                track={track}
                isCurrent={false}
                editable={editable}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

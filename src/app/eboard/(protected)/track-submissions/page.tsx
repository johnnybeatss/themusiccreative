import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage, isOwner } from "@/lib/supabase/role";
import TrackSubmissionItem, {
  type TrackSubmission,
} from "./TrackSubmissionItem";

const BUCKET = "track-submissions";
// Short-lived — regenerated fresh every time this page loads, same reason
// as team-resumes signed URLs (see team-applications/page.tsx).
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function getSubmissions(): Promise<TrackSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("track_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load track submissions:", error.message);
    return [];
  }

  // Audio files live in a private bucket — no public URL to read directly
  // off the row, so a signed URL has to be generated server-side for each
  // one that has a file at all.
  return Promise.all(
    (data ?? []).map(async (row) => {
      if (!row.storage_path) {
        return { ...row, audio_url: null };
      }
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      return { ...row, audio_url: signed?.signedUrl ?? null };
    })
  );
}

// Same owner/admin-only pattern as Team Applications / Join Submissions —
// RLS already blocks eboard-tier reads at the database level (see
// supabase/migrations/0029_track_submissions.sql). "Feature this" is
// further restricted to owner-only inside TrackSubmissionItem, matching
// weekly_track's write policy.
export default async function TrackSubmissionsPage() {
  const role = await getEffectiveRole();

  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          TRACK SUBMISSIONS
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          Track submissions are restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const submissions = await getSubmissions();
  const ownerView = isOwner(role);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-ivory">
            TRACK SUBMISSIONS
          </h1>
          <div className="mt-2 h-1 w-16 bg-gold" />
        </div>
        {submissions.length > 0 && (
          <a
            href="/eboard/track-submissions/export"
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy-950"
          >
            Export to Excel
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-steel-light">
        Responses from the &quot;Get Your Track On The Site&quot; card on the
        homepage. Shortlist a few for the weekly Instagram Story bracket,
        then hit &quot;Feature this&quot; on the winner to push it straight
        into the site-wide player.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-6 text-steel-light">No submissions yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((s) => (
            <TrackSubmissionItem key={s.id} submission={s} isOwnerView={ownerView} />
          ))}
        </ul>
      )}
    </div>
  );
}

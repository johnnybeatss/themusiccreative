import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { lastPage, pageRange, parsePage } from "@/lib/pagination";
import Pagination from "@/components/Pagination";
import { signedUrlMap } from "@/lib/dbAggregates";
import { getEffectiveRole, canManage, isOwner } from "@/lib/supabase/role";
import TrackSubmissionItem, {
  type TrackSubmission,
  type OpenBattle,
} from "./TrackSubmissionItem";

const BUCKET = "track-submissions";
// Short-lived — regenerated fresh every time this page loads, same reason
// as team-resumes signed URLs (see team-applications/page.tsx).
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function getSubmissions(page: number): Promise<{ rows: TrackSubmission[]; total: number }> {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("track_submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(...pageRange(page));
  if (error) {
    console.error("Failed to load track submissions:", error.message);
    return { rows: [], total: 0 };
  }

  // Audio files live in a private bucket — no public URL to read directly
  // off the row, so a signed URL has to be generated server-side for each
  // one that has a file at all.
  // One batched Storage request for every row (was one request per row).
  const urls = await signedUrlMap(supabase, BUCKET, (data ?? []).map((r) => r.storage_path), SIGNED_URL_TTL_SECONDS);
  const rows = (data ?? []).map((row) => ({
    ...row,
    audio_url: row.storage_path ? urls.get(row.storage_path) ?? null : null,
  }));
  return { rows, total: count ?? 0 };
}

// Battles a submission can be shortlisted into (anything not closed), plus
// which of those each submission is already in — see
// 0037_spotlight_battles.sql.
async function getOpenBattles(): Promise<{
  battles: OpenBattle[];
  bySubmission: Record<string, string[]>;
}> {
  const supabase = await createClient();
  const { data: battles } = await supabase
    .from("beat_battles")
    .select("id, title, status")
    .neq("status", "closed")
    .order("created_at", { ascending: false });
  const ids = (battles ?? []).map((b) => b.id);
  const bySubmission: Record<string, string[]> = {};
  if (ids.length) {
    const { data: entries } = await supabase
      .from("battle_entries")
      .select("battle_id, source_submission_id")
      .in("battle_id", ids)
      .not("source_submission_id", "is", null);
    for (const e of entries ?? []) {
      (bySubmission[e.source_submission_id] ??= []).push(e.battle_id);
    }
  }
  return { battles: (battles ?? []) as OpenBattle[], bySubmission };
}

// Same owner/admin-only pattern as Team Applications / Join Submissions —
// RLS already blocks eboard-tier reads at the database level (see
// supabase/migrations/0029_track_submissions.sql). "Feature this" is
// further restricted to owner-only inside TrackSubmissionItem, matching
// weekly_track's write policy.
export default async function TrackSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePage((await searchParams).page);
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

  const [{ rows: submissions, total }, openBattles] = await Promise.all([getSubmissions(page), getOpenBattles()]);
  // e.g. ?page=9 after deletes shrank the list: jump to the real last page.
  if (page > lastPage(total)) redirect(`/eboard/track-submissions?page=${lastPage(total)}`);
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
        {total > 0 && (
          <a
            href="/eboard/track-submissions/export"
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-gold hover:text-white"
          >
            Export to Excel
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-steel-light">
        Responses from the &quot;Get Your Track On The Site&quot; card on the
        homepage. Shortlist the best ones with &quot;Add to battle&quot; — they
        go into this week&apos;s Spotlight Battle for the community to vote
        on, and the crowned winner becomes the spotlight. &quot;Feature
        this&quot; (owner) still skips the vote if you ever need to.
      </p>

      {total === 0 ? (
        <p className="mt-6 text-steel-light">No submissions yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((s) => (
            <TrackSubmissionItem
              key={s.id}
              submission={s}
              isOwnerView={ownerView}
              openBattles={openBattles.battles}
              inBattleIds={openBattles.bySubmission[s.id] ?? []}
            />
          ))}
        </ul>
      )}
      <Pagination basePath="/eboard/track-submissions" page={page} total={total} />
    </div>
  );
}

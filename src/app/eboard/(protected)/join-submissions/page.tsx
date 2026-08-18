import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import JoinSubmissionItem, {
  type JoinSubmission,
} from "./JoinSubmissionItem";

async function getSubmissions(): Promise<JoinSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("join_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load join submissions:", error.message);
    return [];
  }
  return data ?? [];
}

// Same owner/admin-only pattern as the Feedback hub page — RLS already
// blocks eboard-tier reads at the database level (see
// supabase/migrations/0014_join_and_dj_inquiries.sql).
export default async function JoinSubmissionsPage() {
  const role = await getEffectiveRole();

  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          JOIN SUBMISSIONS
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          Join submissions are restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const submissions = await getSubmissions();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-ivory">
            JOIN SUBMISSIONS
          </h1>
          <div className="mt-2 h-1 w-16 bg-gold" />
        </div>
        {submissions.length > 0 && (
          <a
            href="/eboard/join-submissions/export"
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy-950"
          >
            Export to Excel
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-steel-light">
        Responses from the public /join form — never visible outside the
        E-Board area. New ones are marked read as you scroll past them.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-6 text-steel-light">No submissions yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((s) => (
            <JoinSubmissionItem key={s.id} submission={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

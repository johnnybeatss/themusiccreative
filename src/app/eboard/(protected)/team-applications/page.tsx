import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { lastPage, pageRange, parsePage } from "@/lib/pagination";
import Pagination from "@/components/Pagination";
import { signedUrlMap } from "@/lib/dbAggregates";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import TeamApplicationItem, {
  type TeamApplication,
} from "./TeamApplicationItem";

const RESUME_BUCKET = "team-resumes";
// Short-lived — regenerated fresh every time this page loads, so a stale
// link sitting in someone's browser history doesn't stay valid forever.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function getApplications(page: number): Promise<{ rows: TeamApplication[]; total: number }> {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("team_applications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(...pageRange(page));
  if (error) {
    console.error("Failed to load team applications:", error.message);
    return { rows: [], total: 0 };
  }

  // Resumes live in a private bucket — there's no public URL to read
  // directly off the row, so a signed URL has to be generated server-side
  // for each one, scoped to this request.
  // One batched Storage request for every resume (was one per row).
  const urls = await signedUrlMap(supabase, RESUME_BUCKET, (data ?? []).map((r) => r.resume_path), SIGNED_URL_TTL_SECONDS);
  const rows = (data ?? []).map((row) => ({ ...row, resume_url: urls.get(row.resume_path) ?? null }));
  return { rows, total: count ?? 0 };
}

// Same owner/admin-only pattern as Join Submissions / DJ Inquiries — RLS
// already blocks eboard-tier reads at the database level (see
// supabase/migrations/0021_team_applications.sql).
export default async function TeamApplicationsPage({
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
          TEAM APPLICATIONS
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          Team applications are restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const { rows: applications, total } = await getApplications(page);
  // e.g. ?page=9 after deletes shrank the list: jump to the real last page.
  if (page > lastPage(total)) redirect(`/eboard/team-applications?page=${lastPage(total)}`);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-ivory">
            TEAM APPLICATIONS
          </h1>
          <div className="mt-2 h-1 w-16 bg-gold" />
        </div>
        {total > 0 && (
          <a
            href="/eboard/team-applications/export"
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-gold hover:text-white"
          >
            Export to Excel
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-steel-light">
        Responses from the public /join-team form — never visible outside
        the E-Board area. New ones are marked read as you scroll past them.
      </p>

      {total === 0 ? (
        <p className="mt-6 text-steel-light">No applications yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {applications.map((a) => (
            <TeamApplicationItem key={a.id} application={a} />
          ))}
        </ul>
      )}
      <Pagination basePath="/eboard/team-applications" page={page} total={total} />
    </div>
  );
}

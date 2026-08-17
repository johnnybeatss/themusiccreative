import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import DeleteSubmissionButton from "./DeleteSubmissionButton";

type JoinSubmission = {
  id: string;
  full_name: string;
  fiu_email: string;
  student_id: string;
  phone: string;
  major: string;
  year: string;
  creative_roles: string[];
  creative_role_other: string | null;
  experience_length: string;
  achievements: string | null;
  portfolio_link: string;
  club_goals: string;
  wants_collab: string;
  wants_to_perform: string;
  signed_to_label: string;
  workshop_ideas: string | null;
  created_at: string;
};

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
  const role = await getMyRole();

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
        E-Board area.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-6 text-steel-light">No submissions yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ivory">{s.full_name}</p>
                <p className="text-xs text-steel-light">
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-steel-light">
                {s.fiu_email} · {s.phone} · {s.major} · {s.year}
              </p>
              <p className="mt-2 text-sm text-ivory">
                {s.creative_roles.join(", ")}
                {s.creative_role_other ? ` (${s.creative_role_other})` : ""} ·{" "}
                {s.experience_length}
              </p>
              <a
                href={
                  s.portfolio_link.startsWith("http")
                    ? s.portfolio_link
                    : `https://${s.portfolio_link}`
                }
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-gold underline"
              >
                {s.portfolio_link}
              </a>
              <p className="mt-2 text-sm text-steel-light">
                <span className="text-ivory">Goals:</span> {s.club_goals}
              </p>
              <p className="mt-2 text-xs text-steel-light">
                Collab: {s.wants_collab} · Perform: {s.wants_to_perform} ·
                Signed: {s.signed_to_label}
              </p>
              <div className="mt-3">
                <DeleteSubmissionButton id={s.id} name={s.full_name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

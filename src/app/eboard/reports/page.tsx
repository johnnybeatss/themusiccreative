import { createClient } from "@/lib/supabase/server";

type Report = {
  id: string;
  week_of: string;
  submitted_by: string;
  summary: string | null;
  action_items: string | null;
};

async function getReports(): Promise<Report[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .order("week_of", { ascending: false });
  if (error) {
    console.error("Failed to load weekly reports:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div>
      <h1 className="text-2xl font-bold">Weekly Reports</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Submit form coming in Phase 4 — read-only list for now.
      </p>
      {reports.length === 0 ? (
        <p className="mt-4 text-neutral-500">No reports yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-neutral-200 p-4"
            >
              <p className="font-semibold">
                Week of {new Date(r.week_of).toLocaleDateString()} —{" "}
                {r.submitted_by}
              </p>
              {r.summary && <p className="mt-2 text-sm">{r.summary}</p>}
              {r.action_items && (
                <p className="mt-2 text-sm text-neutral-500">
                  Action items: {r.action_items}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

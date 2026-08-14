import { createClient } from "@/lib/supabase/server";
import ReportForm from "./ReportForm";

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
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        WEEKLY REPORTS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />

      <ReportForm />

      {reports.length === 0 ? (
        <p className="mt-6 text-steel-light">No reports yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-navy-800 bg-navy-900 p-4"
            >
              <p className="font-semibold text-ivory">
                Week of {new Date(r.week_of).toLocaleDateString()} —{" "}
                {r.submitted_by}
              </p>
              {r.summary && (
                <p className="mt-2 text-sm text-ivory">{r.summary}</p>
              )}
              {r.action_items && (
                <p className="mt-2 text-sm text-steel-light">
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

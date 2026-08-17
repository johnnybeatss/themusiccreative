import { notFound } from "next/navigation";
import Link from "next/link";
import { formatWeekRange } from "@/lib/weekReports";
import { getItems, getNotes, getReportById } from "../data";

// Read-only snapshot of a past week — no add forms, no delete buttons,
// no upcoming events (those are only meaningful for "right now"). Items
// still show their done/not-done state as it was left, since that's live
// data on the same row rather than a frozen copy.
export default async function PastReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) notFound();

  const [todos, contentIdeas, notes] = await Promise.all([
    getItems(report.id, "todo"),
    getItems(report.id, "content_idea"),
    getNotes(report.id),
  ]);

  return (
    <div>
      <Link
        href="/eboard/reports"
        className="text-sm text-steel-light transition-colors hover:text-gold"
      >
        ← Back to this week
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-ivory">
        WEEKLY REPORT
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm font-semibold text-gold">
        Week of {formatWeekRange(report.week_start, report.week_end)}
      </p>
      <p className="mt-1 text-xs text-steel-light">Read-only archive.</p>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          TO-DO LIST
        </h2>
        {todos.length === 0 ? (
          <p className="mt-3 text-sm text-steel-light">No items.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todos.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-navy-800 bg-navy-900 px-4 py-2.5 text-sm"
              >
                <span
                  className={
                    item.done ? "text-steel-light line-through" : "text-ivory"
                  }
                >
                  {item.done ? "☑" : "☐"} {item.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          CONTENT IDEAS
        </h2>
        {contentIdeas.length === 0 ? (
          <p className="mt-3 text-sm text-steel-light">No items.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {contentIdeas.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-navy-800 bg-navy-900 px-4 py-2.5 text-sm"
              >
                <span
                  className={
                    item.done ? "text-steel-light line-through" : "text-ivory"
                  }
                >
                  {item.done ? "☑" : "☐"} {item.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          NOTES FROM LEADERSHIP
        </h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-steel-light">No notes.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border p-3 ${
                  n.is_priority
                    ? "border-gold/60 bg-navy-900"
                    : "border-navy-800 bg-navy-900"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {n.is_priority && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
                      Priority
                    </span>
                  )}
                  <p className="text-xs text-steel-light">
                    {n.author?.display_name || "E-Board"} ·{" "}
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ivory">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

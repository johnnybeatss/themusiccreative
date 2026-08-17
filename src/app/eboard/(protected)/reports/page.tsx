import Link from "next/link";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { formatEventDateTime } from "@/lib/eventTimezone";
import { formatWeekRange } from "@/lib/weekReports";
import { getItems, getNotes, getUpcomingEvents, getPastReports } from "./data";
import { getOrCreateCurrentReport } from "./actions";
import ItemChecklist from "./ItemChecklist";
import NotesSection from "./NotesSection";

export default async function ReportsPage() {
  const role = await getMyRole();
  const editable = canManage(role);
  const report = await getOrCreateCurrentReport();

  if (!report) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          WEEKLY REPORT
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          Couldn&apos;t load this week&apos;s report — try refreshing.
        </p>
      </div>
    );
  }

  const [upcomingEvents, todos, contentIdeas, notes, pastReports] =
    await Promise.all([
      getUpcomingEvents(),
      getItems(report.id, "todo"),
      getItems(report.id, "content_idea"),
      getNotes(report.id),
      getPastReports(report.id),
    ]);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        WEEKLY REPORT
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm font-semibold text-gold">
        Week of {formatWeekRange(report.week_start, report.week_end)}
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          UPCOMING EVENTS
        </h2>
        {upcomingEvents.length === 0 ? (
          <p className="mt-3 text-sm text-steel-light">
            Nothing on the calendar right now.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcomingEvents.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-navy-800 bg-navy-900 px-4 py-2.5 text-sm"
              >
                <span className="text-ivory">{e.name}</span>
                <span className="ml-2 text-steel-light">
                  {formatEventDateTime(e.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          TO-DO LIST
        </h2>
        <ItemChecklist
          reportId={report.id}
          kind="todo"
          items={todos}
          canDelete={editable}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          CONTENT IDEAS
        </h2>
        <ItemChecklist
          reportId={report.id}
          kind="content_idea"
          items={contentIdeas}
          canDelete={editable}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          NOTES FROM LEADERSHIP
        </h2>
        {!editable && (
          <p className="mt-1 text-xs text-steel-light">
            Viewing only — adding and removing notes is limited to
            owner/admin accounts.
          </p>
        )}
        <NotesSection reportId={report.id} notes={notes} editable={editable} />
      </section>

      {pastReports.length > 0 && (
        <section className="mt-10 border-t border-navy-800 pt-6">
          <h2 className="font-display text-lg tracking-wide text-ivory">
            PAST WEEKS
          </h2>
          <ul className="mt-3 space-y-1">
            {pastReports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/eboard/reports/${r.id}`}
                  className="text-sm text-steel-light transition-colors hover:text-gold"
                >
                  Week of {formatWeekRange(r.week_start, r.week_end)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

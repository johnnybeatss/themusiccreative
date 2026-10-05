import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import { formatEventDateTime } from "@/lib/eventTimezone";

// Events from the last 120 days plus everything upcoming.
const LOOKBACK_DAYS = 120;

export default async function CheckinAdminPage() {
  const role = await getEffectiveRole();
  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">CHECK-IN</h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">Attendance is restricted to owner/admin accounts.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();
  const [{ data: events }, { data: checkins }, { data: codes }] = await Promise.all([
    supabase.from("events").select("id, name, date").gte("date", since).order("date", { ascending: false }),
    supabase.from("event_checkins").select("event_id"),
    supabase.from("event_checkin_codes").select("event_id"),
  ]);

  const counts = new Map<string, number>();
  for (const c of checkins ?? []) counts.set(c.event_id, (counts.get(c.event_id) ?? 0) + 1);
  const hasCode = new Set((codes ?? []).map((c) => c.event_id));

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">CHECK-IN</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Open an event to get its QR code — put it on the projector or a table
        sign. Check-in works from 3 hours before start until 12 hours after.
        Public{" "}
        <Link href="/leaderboard" className="text-accent hover:underline">
          leaderboard
        </Link>{" "}
        shows first name + last initial only.
      </p>

      {(events ?? []).length === 0 ? (
        <p className="mt-6 text-steel-light">No recent or upcoming events.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {(events ?? []).map((e) => (
            <li key={e.id}>
              <Link
                href={`/eboard/checkin/${e.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold"
              >
                <div>
                  <p className="font-semibold text-ivory">{e.name}</p>
                  <p className="text-xs text-steel-light">{formatEventDateTime(e.date)}</p>
                </div>
                <p className="text-sm text-steel-light">
                  {counts.get(e.id) ?? 0} checked in
                  {!hasCode.has(e.id) && <span className="ml-2 text-xs">· no QR yet</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import EventListItem from "../EventListItem";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string;
  status: string;
  description: string | null;
  guest_instagram_url: string | null;
  image_url: string | null;
  photo_urls: string[];
  posh_embed_html: string | null;
  recap: string | null;
};
type Rsvp = { id: string; event_id: string; name: string; email: string; guest_count: string | null; created_at: string };

// Every event that's already happened, newest first, with its RSVPs and
// QR check-ins. RSVPs/check-ins are owner/admin-only by RLS, so eboard-tier
// accounts just see the events.
export default async function PastEventsPage() {
  const role = await getEffectiveRole();
  const editable = canManage(role);
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: events }, { data: rsvps }, { data: checkins }] = await Promise.all([
    supabase.from("events").select("*").lt("date", nowIso).order("date", { ascending: false }),
    editable
      ? supabase.from("event_rsvps").select("id, event_id, name, email, guest_count, created_at").order("created_at")
      : Promise.resolve({ data: [] as Rsvp[] }),
    editable ? supabase.from("event_checkins").select("event_id") : Promise.resolve({ data: [] as { event_id: string }[] }),
  ]);

  const rsvpsByEvent = new Map<string, Rsvp[]>();
  for (const r of (rsvps ?? []) as Rsvp[]) {
    rsvpsByEvent.set(r.event_id, [...(rsvpsByEvent.get(r.event_id) ?? []), r]);
  }
  const checkinCount = new Map<string, number>();
  for (const c of checkins ?? []) checkinCount.set(c.event_id, (checkinCount.get(c.event_id) ?? 0) + 1);

  const list = (events ?? []) as Event[];

  return (
    <div>
      <Link href="/eboard/events" className="text-xs text-steel-light hover:text-accent">
        &larr; Upcoming events
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-ivory">PAST EVENTS</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Everything that&apos;s already happened, newest first. Edit an event to
        add its recap and photos.
      </p>

      {list.length === 0 ? (
        <p className="mt-6 text-steel-light">No past events yet.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {list.map((e) => {
            const eventRsvps = rsvpsByEvent.get(e.id) ?? [];
            const checked = checkinCount.get(e.id) ?? 0;
            return (
              <div key={e.id}>
                <EventListItem event={e} editable={editable} />
                {editable && (
                  <div className="mt-2 rounded-xl border border-navy-800 bg-navy-950 p-4">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      <span className="font-semibold text-ivory">
                        {eventRsvps.length} RSVP{eventRsvps.length === 1 ? "" : "s"}
                      </span>
                      <span className="font-semibold text-ivory">{checked} checked in</span>
                      <Link href={`/eboard/events/${e.id}/rsvps`} className="text-accent hover:underline">
                        RSVP list
                      </Link>
                      <Link href={`/eboard/checkin/${e.id}`} className="text-accent hover:underline">
                        Attendance
                      </Link>
                    </div>
                    {eventRsvps.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-steel-light hover:text-accent">
                          Show RSVPs
                        </summary>
                        <ul className="mt-2 divide-y divide-navy-800">
                          {eventRsvps.map((r) => (
                            <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                              <span className="text-ivory">
                                {r.name}
                                {r.guest_count ? <span className="text-steel-light"> · +{r.guest_count}</span> : null}
                              </span>
                              <span className="text-steel-light">{r.email}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

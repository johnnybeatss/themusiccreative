import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";

type EventRsvp = {
  id: string;
  name: string;
  email: string;
  guest_count: string | null;
  notes: string | null;
  created_at: string;
};

async function getEventName(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return data?.name ?? null;
}

async function getRsvps(eventId: string): Promise<EventRsvp[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load RSVPs:", error.message);
    return [];
  }
  return data ?? [];
}

// Owner/admin only — confirmed with Johnny to match the tier used for
// Feedback, Join Submissions, and DJ Inquiries (see supabase/migrations/0015).
export default async function EventRsvpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await getEffectiveRole();

  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          RSVPS
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          RSVPs are restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const [eventName, rsvps] = await Promise.all([
    getEventName(id),
    getRsvps(id),
  ]);
  if (!eventName) notFound();

  return (
    <div>
      <Link
        href="/eboard/events"
        className="text-xs text-steel-light hover:text-gold"
      >
        &larr; Back to Events
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-ivory">
            RSVPS
          </h1>
          <div className="mt-2 h-1 w-16 bg-gold" />
        </div>
        {rsvps.length > 0 && (
          <a
            href={`/eboard/events/${id}/rsvps/export`}
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy-950"
          >
            Export to Excel
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-steel-light">{eventName}</p>

      {rsvps.length === 0 ? (
        <p className="mt-6 text-steel-light">No RSVPs yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rsvps.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ivory">{r.name}</p>
                <p className="text-xs text-steel-light">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-steel-light">
                {r.email}
                {r.guest_count ? ` · Bringing: ${r.guest_count}` : ""}
              </p>
              {r.notes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-steel-light">
                  {r.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

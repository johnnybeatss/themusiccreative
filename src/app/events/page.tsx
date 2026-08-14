import { createClient } from "@/lib/supabase/server";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string;
  status: string;
};

async function getEvents(): Promise<Event[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) {
    console.error("Failed to load events:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        UPCOMING EVENTS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {events.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No events yet — this fills in once the database is connected
          (Phase 2) and events are entered.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold"
            >
              <p className="font-semibold text-ivory">{e.name}</p>
              <p className="text-sm text-steel-light">
                {new Date(e.date).toLocaleString()}
                {e.location ? ` · ${e.location}` : ""} · {e.type}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

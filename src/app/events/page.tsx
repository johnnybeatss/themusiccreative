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
      <h1 className="text-2xl font-bold">Upcoming Events</h1>
      {events.length === 0 ? (
        <p className="mt-4 text-neutral-500">
          No events yet — this fills in once the database is connected
          (Phase 2) and events are entered.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {events.map((e) => (
            <li key={e.id} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-neutral-500">
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

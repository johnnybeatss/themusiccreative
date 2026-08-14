import { createClient } from "@/lib/supabase/server";
import EventForm from "./EventForm";
import EventListItem from "./EventListItem";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string;
  status: string;
};

async function getEvents(): Promise<Event[]> {
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

// This is the only place events get created/edited/deleted — the public
// /events page just reads from the same table and is read-only by RLS
// (public SELECT only, no write policy for anonymous users).
export default async function EventsAdminPage() {
  const events = await getEvents();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        EVENTS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Manage what shows up on the public Events page.
      </p>

      <EventForm />

      {events.length === 0 ? (
        <p className="mt-6 text-steel-light">No events yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((e) => (
            <EventListItem key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

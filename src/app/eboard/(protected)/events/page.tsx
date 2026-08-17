import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import EventForm from "./EventForm";
import EventListItem from "./EventListItem";

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
  const [events, role] = await Promise.all([getEvents(), getMyRole()]);
  const editable = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        EVENTS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        {editable
          ? "Manage what shows up on the public Events page."
          : "What's currently on the public Events page. Adding, editing, and removing events is limited to owner/admin accounts."}
      </p>

      {editable && <EventForm />}

      {events.length === 0 ? (
        <p className="mt-6 text-steel-light">No events yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((e) => (
            <EventListItem key={e.id} event={e} editable={editable} />
          ))}
        </div>
      )}
    </div>
  );
}

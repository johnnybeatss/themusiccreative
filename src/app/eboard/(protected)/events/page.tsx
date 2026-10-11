import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
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
  posh_embed_html: string | null;
  recap: string | null;
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
export default async function EventsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteBlocked?: string }>;
}) {
  const [all, role, { deleteBlocked }] = await Promise.all([getEvents(), getEffectiveRole(), searchParams]);
  const editable = canManage(role);
  // Past events live on their own page (/eboard/events/past) with their
  // RSVPs and check-ins, so this list stays focused on what's coming up.
  const now = Date.now();
  const events = all.filter((e) => new Date(e.date).getTime() >= now);
  const pastCount = all.length - events.length;

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

      {deleteBlocked && (
        <p className="mt-4 rounded-lg border border-red-400/40 bg-navy-900 p-3 text-sm text-red-300">
          That event has RSVPs or check-ins, so it can&apos;t be deleted —
          deleting it would wipe that attendance (and the leaderboard). It&apos;s
          kept under Past Events instead.
        </p>
      )}

      <Link
        href="/eboard/events/past"
        className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
      >
        Past events ({pastCount}) &rarr;
      </Link>

      {editable && <EventForm />}

      {events.length === 0 ? (
        <p className="mt-6 text-steel-light">No upcoming events.</p>
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

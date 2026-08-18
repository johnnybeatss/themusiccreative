import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import RecapForm from "./RecapForm";
import RecapListItem from "./RecapListItem";

type Recap = {
  id: string;
  title: string;
  body: string;
  photo_url: string | null;
  event_id: string | null;
  published_at: string;
};

type EventOption = { id: string; name: string };

async function getRecaps(): Promise<Recap[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recaps")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("Failed to load recaps:", error.message);
    return [];
  }
  return data ?? [];
}

// For the "related event" dropdown — every event, not just upcoming ones,
// since recaps are written about events that already happened.
async function getEventOptions(): Promise<EventOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name")
    .order("date", { ascending: false });
  if (error) {
    console.error("Failed to load events for recap form:", error.message);
    return [];
  }
  return data ?? [];
}

// Same visibility split as Events/Opportunities: the page is open to every
// signed-in E-board member to read, but publishing/editing/deleting is
// owner/admin only (see supabase/migrations/0026_recaps.sql).
export default async function RecapsAdminPage() {
  const [recaps, events, role] = await Promise.all([
    getRecaps(),
    getEventOptions(),
    getEffectiveRole(),
  ]);
  const editable = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        RECAPS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        {editable
          ? "Short write-ups published after events — helps people find TMC in search and shows what actually happens at meetings."
          : "Recaps published after past events. Adding and editing is limited to owner/admin accounts."}
      </p>

      {editable && <RecapForm events={events} />}

      {recaps.length === 0 ? (
        <p className="mt-6 text-steel-light">No recaps yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {recaps.map((r) => (
            <RecapListItem key={r.id} recap={r} events={events} editable={editable} />
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";

type Note = {
  id: string;
  title: string;
  body: string | null;
  updated_at: string;
};

async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leadership_notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("Failed to load leadership notes:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        LEADERSHIP NOTES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Free-form internal notes. Editing UI coming in Phase 4.
      </p>
      {notes.length === 0 ? (
        <p className="mt-4 text-steel-light">No notes yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-navy-800 bg-navy-900 p-4"
            >
              <p className="font-semibold text-ivory">{n.title}</p>
              {n.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-ivory">
                  {n.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
      <h1 className="text-2xl font-bold">Leadership Notes</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Free-form internal notes. Editing UI coming in Phase 4.
      </p>
      {notes.length === 0 ? (
        <p className="mt-4 text-neutral-500">No notes yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-neutral-200 p-4"
            >
              <p className="font-semibold">{n.title}</p>
              {n.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm">{n.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

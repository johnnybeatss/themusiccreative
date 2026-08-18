import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import NoteForm from "./NoteForm";
import DeleteNoteButton from "./DeleteNoteButton";

type Note = {
  id: string;
  title: string;
  body: string | null;
  updated_at: string;
  author: { display_name: string | null } | null;
};

async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leadership_notes")
    .select("*, author:profiles(display_name)")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("Failed to load leadership notes:", error.message);
    return [];
  }
  return (data as unknown as Note[]) ?? [];
}

export default async function NotesPage() {
  const [notes, role] = await Promise.all([getNotes(), getEffectiveRole()]);
  const editable = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        LEADERSHIP NOTES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {!editable && (
        <p className="mt-4 text-sm text-steel-light">
          Viewing only — adding and removing notes is limited to owner/admin
          accounts.
        </p>
      )}

      {editable && <NoteForm />}

      {notes.length === 0 ? (
        <p className="mt-6 text-steel-light">No notes yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ivory">{n.title}</p>
                {editable && <DeleteNoteButton id={n.id} />}
              </div>
              {n.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-ivory">
                  {n.body}
                </p>
              )}
              <p className="mt-2 text-xs text-steel-light">
                Posted by {n.author?.display_name || "an E-Board member"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

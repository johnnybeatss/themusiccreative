"use client";

import { useActionState, useEffect, useRef } from "react";
import { addNote, deleteNote, type NoteFormState } from "./actions";

type Note = {
  id: string;
  body: string;
  is_priority: boolean;
  created_at: string;
  author: { display_name: string | null } | null;
};

const initialState: NoteFormState = { error: null };

// Owner/admin-only add + delete (RLS-enforced, `editable` just controls
// what's rendered) — everyone else on E-board can view. Priority notes get
// a star and sort to the top (see data.ts's getNotes query).
export default function NotesSection({
  reportId,
  notes,
  editable,
}: {
  reportId: string;
  notes: Note[];
  editable: boolean;
}) {
  const [state, formAction, isPending] = useActionState(addNote, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="mt-3">
      {notes.length === 0 ? (
        <p className="text-sm text-steel-light">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-3 ${
                n.is_priority
                  ? "border-gold/60 bg-navy-900"
                  : "border-navy-800 bg-navy-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {n.is_priority && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
                      Priority
                    </span>
                  )}
                  <p className="text-xs text-steel-light">
                    {n.author?.display_name || "E-Board"} ·{" "}
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {editable && (
                  <form
                    action={deleteNote}
                    onSubmit={(e) => {
                      if (!confirm("Delete this note?")) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="text-xs text-steel-light transition-colors hover:text-red-400"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ivory">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form
          ref={formRef}
          action={formAction}
          className="mt-4 space-y-2 rounded-xl border border-navy-800 bg-navy-900 p-4"
        >
          <input type="hidden" name="report_id" value={reportId} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Note for the team..."
            className="w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-steel-light">
            <input
              type="checkbox"
              name="is_priority"
              value="true"
              className="h-4 w-4 rounded border-navy-800 bg-navy-950 accent-gold"
            />
            Mark as priority
          </label>
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add note"}
          </button>
        </form>
      )}
    </div>
  );
}

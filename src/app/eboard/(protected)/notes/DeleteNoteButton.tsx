"use client";

import { deleteNote } from "./actions";

export default function DeleteNoteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteNote}
      onSubmit={(e) => {
        if (!confirm("Delete this note? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-steel-light hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}

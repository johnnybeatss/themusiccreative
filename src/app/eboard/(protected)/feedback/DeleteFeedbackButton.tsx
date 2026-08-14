"use client";

import { deleteFeedback } from "./actions";

export default function DeleteFeedbackButton({ id }: { id: string }) {
  return (
    <form
      action={deleteFeedback}
      onSubmit={(e) => {
        if (!confirm("Delete this response? This can't be undone.")) {
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

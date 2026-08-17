"use client";

import { deleteJoinSubmission } from "./actions";

export default function DeleteSubmissionButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteJoinSubmission}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}'s submission? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-steel-light transition-colors hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}

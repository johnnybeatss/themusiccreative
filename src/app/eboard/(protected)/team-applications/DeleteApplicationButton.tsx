"use client";

import { deleteTeamApplication } from "./actions";

export default function DeleteApplicationButton({
  id,
  name,
  resumePath,
}: {
  id: string;
  name: string;
  resumePath: string;
}) {
  return (
    <form
      action={deleteTeamApplication}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}'s application? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="resume_path" value={resumePath} />
      <button
        type="submit"
        className="text-xs text-steel-light transition-colors hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}

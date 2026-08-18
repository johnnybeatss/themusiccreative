"use client";

import { deleteTrackSubmission } from "./actions";

export default function DeleteSubmissionButton({
  id,
  trackTitle,
  storagePath,
}: {
  id: string;
  trackTitle: string;
  storagePath: string | null;
}) {
  return (
    <form
      action={deleteTrackSubmission}
      onSubmit={(e) => {
        if (!confirm(`Delete "${trackTitle}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="storage_path" value={storagePath ?? ""} />
      <button
        type="submit"
        className="text-xs text-steel-light transition-colors hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}

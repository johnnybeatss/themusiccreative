"use client";

import { deleteWeeklyTrack } from "./actions";

export default function TrackDeleteForm({
  id,
  trackTitle,
  storagePath,
}: {
  id: string;
  trackTitle: string;
  storagePath: string;
}) {
  return (
    <form
      action={deleteWeeklyTrack}
      onSubmit={(e) => {
        if (
          !confirm(`Remove "${trackTitle}" and hide the player site-wide?`)
        ) {
          e.preventDefault();
        }
      }}
      className="mt-3"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="storage_path" value={storagePath} />
      <button
        type="submit"
        className="text-xs text-steel-light hover:text-red-400"
      >
        Remove featured track
      </button>
    </form>
  );
}

"use client";

import { deleteWeeklyTrack } from "./actions";

export default function TrackDeleteForm({
  id,
  trackTitle,
  storagePath,
  label = "Remove featured track",
  confirmMessage,
}: {
  id: string;
  trackTitle: string;
  storagePath: string;
  // Archive rows reuse this same form (deleting one just drops it from
  // history — it can't be "currently featured"), so the label/confirm
  // copy is overridable instead of always implying the live player.
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={deleteWeeklyTrack}
      onSubmit={(e) => {
        if (
          !confirm(
            confirmMessage ??
              `Remove "${trackTitle}" and hide the player site-wide?`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="storage_path" value={storagePath} />
      <button
        type="submit"
        className="text-xs text-steel-light transition-colors hover:text-red-400"
      >
        {label}
      </button>
    </form>
  );
}

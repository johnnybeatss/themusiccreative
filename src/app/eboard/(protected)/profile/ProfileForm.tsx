"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateDisplayName, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = { error: null };

export default function ProfileForm({
  currentName,
}: {
  currentName: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateDisplayName,
    initialState
  );
  const mounted = useRef(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setJustSaved(state.error === null);
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-6 max-w-sm space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <label className="block text-sm">
        <span className="text-steel-light">Display name</span>
        <input
          id="displayName"
          type="text"
          name="displayName"
          required
          maxLength={60}
          defaultValue={currentName ?? ""}
          placeholder="e.g. Aileen Hernandez"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <p className="text-xs text-steel-light">
        Shown to other E-Board members on things you post, like leadership
        notes.
      </p>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {justSaved && !state.error && (
        <p className="text-sm text-gold">Saved.</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save name"}
      </button>
    </form>
  );
}

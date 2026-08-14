"use client";

import { useActionState, useEffect, useRef } from "react";
import { createNote, type NoteFormState } from "./actions";

const initialState: NoteFormState = { error: null };

export default function NoteForm() {
  const [state, formAction, isPending] = useActionState(
    createNote,
    initialState
  );
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
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <h2 className="font-display text-lg tracking-wide text-ivory">
        ADD A NOTE
      </h2>
      <label className="block text-sm">
        <span className="text-steel-light">Title</span>
        <input
          type="text"
          name="title"
          required
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Body</span>
        <textarea
          name="body"
          rows={4}
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 shadow-lg shadow-gold/20 transition-all hover:bg-gold-light hover:shadow-gold/30 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Add note"}
      </button>
    </form>
  );
}

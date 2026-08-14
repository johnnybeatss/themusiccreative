"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitFeedback, type FeedbackFormState } from "./actions";

const initialState: FeedbackFormState = { error: null };
const CATEGORIES = ["Event idea", "Like", "Dislike", "General"] as const;

export default function FeedbackForm() {
  const [state, formAction, isPending] = useActionState(
    submitFeedback,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      formRef.current?.reset();
      setJustSubmitted(true);
    } else {
      setJustSubmitted(false);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 max-w-lg space-y-4 rounded-xl border border-navy-800 bg-navy-900 p-5"
    >
      <label className="block text-sm">
        <span className="text-steel-light">Name (optional)</span>
        <input
          type="text"
          name="name"
          maxLength={60}
          placeholder="Leave blank to stay anonymous"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Category</span>
        <select
          name="category"
          defaultValue="General"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Your message</span>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={2000}
          placeholder="What events do you want to see? What's working, what's not?"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {justSubmitted && !state.error && (
        <p className="text-sm text-gold">Thanks — sent to the E-Board.</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}

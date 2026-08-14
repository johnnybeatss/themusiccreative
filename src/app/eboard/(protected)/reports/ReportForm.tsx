"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitReport, type SubmitReportState } from "./actions";

const initialState: SubmitReportState = { error: null };

export default function ReportForm() {
  const [state, formAction, isPending] = useActionState(
    submitReport,
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
        SUBMIT A REPORT
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Week of</span>
          <input
            type="date"
            name="week_of"
            required
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Submitted by</span>
          <input
            type="text"
            name="submitted_by"
            required
            placeholder="Your name"
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">Summary</span>
        <textarea
          name="summary"
          rows={3}
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Action items</span>
        <textarea
          name="action_items"
          rows={2}
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 shadow-lg shadow-gold/20 transition-all hover:bg-gold-light hover:shadow-gold/30 disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}

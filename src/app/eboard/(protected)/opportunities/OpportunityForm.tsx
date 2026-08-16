"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createOpportunity,
  updateOpportunity,
  type OpportunityFormState,
} from "./actions";

const OPPORTUNITY_TYPES = [
  "Gig",
  "Collab",
  "Internship",
  "Showcase",
  "Other",
] as const;
const OPPORTUNITY_STATUSES = ["Not started", "In progress", "Done"] as const;

type Opportunity = {
  id: string;
  title: string;
  type: string;
  contact_link: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
};

const initialState: OpportunityFormState = { error: null };

// Same "one form, two modes" pattern as EventForm — no `opportunity` prop
// means "add new" (posts to createOpportunity), passing one means "edit"
// (posts to updateOpportunity).
export default function OpportunityForm({
  opportunity,
  onDone,
}: {
  opportunity?: Opportunity;
  onDone?: () => void;
}) {
  const action = opportunity ? updateOpportunity : createOpportunity;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      if (!opportunity) formRef.current?.reset();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, opportunity]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <h2 className="font-display text-lg tracking-wide text-ivory">
        {opportunity ? "EDIT OPPORTUNITY" : "ADD AN OPPORTUNITY"}
      </h2>
      {opportunity && (
        <input type="hidden" name="id" value={opportunity.id} />
      )}
      <label className="block text-sm">
        <span className="text-steel-light">Title</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={opportunity?.title}
          placeholder="e.g. Sony Music Latin — Summer Internship"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Type</span>
          <select
            name="type"
            defaultValue={opportunity?.type ?? "Internship"}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          >
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Status</span>
          <select
            name="status"
            defaultValue={opportunity?.status ?? "Not started"}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          >
            {OPPORTUNITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">Application link (optional)</span>
        <input
          type="url"
          name="contact_link"
          defaultValue={opportunity?.contact_link ?? ""}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">
          Cover image{" "}
          {opportunity ? "(optional — replaces current)" : "(optional)"}
        </span>
        {opportunity?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={opportunity.image_url}
            alt=""
            className="mt-2 h-24 w-full rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
      </label>
      <p className="text-xs text-steel-light">
        Under 4MB. Postings auto-hide from the public page 60 days after
        they're added, so internships don't sit stale — delete anytime
        before that if it fills sooner.
      </p>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : opportunity
              ? "Save changes"
              : "Add opportunity"}
        </button>
        {opportunity && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-steel-light hover:text-ivory"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

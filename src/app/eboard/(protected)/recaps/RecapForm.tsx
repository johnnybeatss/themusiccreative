"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRecap, updateRecap, type RecapFormState } from "./actions";

type Recap = {
  id: string;
  title: string;
  body: string;
  photo_url: string | null;
  event_id: string | null;
};

type EventOption = { id: string; name: string };

const initialState: RecapFormState = { error: null };

// Same "one form handles add + edit" pattern as EventForm.tsx.
export default function RecapForm({
  recap,
  events,
  onDone,
}: {
  recap?: Recap;
  events: EventOption[];
  onDone?: () => void;
}) {
  const action = recap ? updateRecap : createRecap;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      if (!recap) formRef.current?.reset();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, recap]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <h2 className="font-display text-lg tracking-wide text-ivory">
        {recap ? "EDIT RECAP" : "ADD A RECAP"}
      </h2>
      {recap && <input type="hidden" name="id" value={recap.id} />}
      <label className="block text-sm">
        <span className="text-steel-light">Title</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={recap?.title}
          placeholder="e.g. Recap: Songwriting Workshop with Mike River"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Related event (optional)</span>
        <select
          name="event_id"
          defaultValue={recap?.event_id ?? ""}
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
        >
          <option value="">None</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-steel-light">
          Links this recap to the event&apos;s page — good for both readers
          and search engines.
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Body</span>
        <textarea
          name="body"
          required
          rows={6}
          defaultValue={recap?.body}
          placeholder="What happened, who came through, what people made — a few paragraphs is plenty."
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">
          Photo {recap ? "(optional — replaces current)" : "(optional)"}
        </span>
        {recap?.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recap.photo_url}
            alt=""
            className="mt-2 h-24 w-full rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
        <p className="mt-1 text-xs text-steel-light">Under 4MB.</p>
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {isPending ? "Saving..." : recap ? "Save changes" : "Publish recap"}
        </button>
        {recap && (
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

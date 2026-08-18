"use client";

import { useActionState, useEffect, useRef } from "react";
import { addItem, type ItemFormState } from "./actions";
import ReportItemRow from "./ReportItemRow";

type Item = { id: string; text: string; done: boolean };

const initialState: ItemFormState = { error: null };

// Reused for both the To-Do List and Content Ideas sections — same shape,
// different `kind`. Owner/admin only for add/check/edit/delete — eboard-tier
// members get a read-only list (RLS enforces the same restriction
// server-side either way; see 0025_tighten_team_and_reports_write_access.sql).
export default function ItemChecklist({
  reportId,
  kind,
  items,
  editable,
}: {
  reportId: string;
  kind: "todo" | "content_idea";
  items: Item[];
  editable: boolean;
}) {
  const [state, formAction, isPending] = useActionState(addItem, initialState);
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
    <div className="mt-3">
      {items.length === 0 ? (
        <p className="text-sm text-steel-light">Nothing here yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ReportItemRow key={item.id} item={item} editable={editable} />
          ))}
        </ul>
      )}

      {editable && (
        <form ref={formRef} action={formAction} className="mt-3 flex gap-2">
          <input type="hidden" name="report_id" value={reportId} />
          <input type="hidden" name="kind" value={kind} />
          <input
            type="text"
            name="text"
            required
            placeholder={
              kind === "todo" ? "Add a to-do..." : "Add a content idea..."
            }
            className="w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
      {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
    </div>
  );
}

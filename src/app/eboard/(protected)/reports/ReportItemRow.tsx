"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toggleItem, deleteItem, editItem, type ItemFormState } from "./actions";

type Item = { id: string; text: string; done: boolean };

const initialState: ItemFormState = { error: null };

// One row in a To-Do/Content Ideas checklist (see ItemChecklist.tsx). Split
// out into its own client component so edit-mode state stays local to a
// single item instead of the whole list re-rendering. `editable` is
// owner/admin only — eboard-tier members see a static, non-interactive row.
export default function ReportItemRow({
  item,
  editable,
}: {
  item: Item;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(editItem, initialState);
  const mounted = useRef(false);

  // Closes edit mode automatically once the save succeeds — revalidation
  // from the server action already refreshes `item.text` by the time this
  // runs, so there's no stale-text flash.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) setEditing(false);
  }, [state]);

  if (editing && editable) {
    return (
      <li className="rounded-lg border border-gold/50 bg-navy-900 px-4 py-2.5">
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <input
            type="text"
            name="text"
            required
            defaultValue={item.text}
            autoFocus
            className="w-full rounded-lg border border-navy-800 bg-navy-950 px-2 py-1 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 text-xs text-steel-light hover:text-ivory"
          >
            Cancel
          </button>
        </form>
        {state.error && <p className="mt-1 text-xs text-red-400">{state.error}</p>}
      </li>
    );
  }

  const checkbox = (
    <span
      role="checkbox"
      aria-checked={item.done}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        item.done ? "border-gold bg-gold" : "border-steel-light"
      }`}
    >
      {item.done && (
        <span className="text-[10px] leading-none text-navy-950">✓</span>
      )}
    </span>
  );

  return (
    <li className="flex items-center gap-3 rounded-lg border border-navy-800 bg-navy-900 px-4 py-2.5">
      {editable ? (
        <form action={toggleItem} className="flex flex-1 items-center gap-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="done" value={(!item.done).toString()} />
          <button
            type="submit"
            role="checkbox"
            aria-checked={item.done}
            aria-label={item.done ? "Mark as not done" : "Mark as done"}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              item.done
                ? "border-gold bg-gold"
                : "border-steel-light hover:border-gold"
            }`}
          >
            {item.done && (
              <span className="text-[10px] leading-none text-navy-950">✓</span>
            )}
          </button>
          <span
            className={`text-sm ${
              item.done ? "text-steel-light line-through" : "text-ivory"
            }`}
          >
            {item.text}
          </span>
        </form>
      ) : (
        <div className="flex flex-1 items-center gap-3">
          {checkbox}
          <span
            className={`text-sm ${
              item.done ? "text-steel-light line-through" : "text-ivory"
            }`}
          >
            {item.text}
          </span>
        </div>
      )}
      {editable && (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs text-steel-light transition-colors hover:text-gold"
          >
            Edit
          </button>
          <form
            action={deleteItem}
            onSubmit={(e) => {
              if (!confirm("Remove this item?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="shrink-0 text-xs text-steel-light transition-colors hover:text-red-400"
            >
              Delete
            </button>
          </form>
        </>
      )}
    </li>
  );
}

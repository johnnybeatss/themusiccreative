"use client";

import { useActionState, useEffect, useRef } from "react";
import { addItem, toggleItem, deleteItem, type ItemFormState } from "./actions";

type Item = { id: string; text: string; done: boolean };

const initialState: ItemFormState = { error: null };

// Reused for both the To-Do List and Content Ideas sections — same shape,
// different `kind`. Adding/checking is open to any signed-in E-board
// member; deleting is only shown when `canDelete` (owner/admin) is true —
// RLS enforces the same restriction server-side either way.
export default function ItemChecklist({
  reportId,
  kind,
  items,
  canDelete,
}: {
  reportId: string;
  kind: "todo" | "content_idea";
  items: Item[];
  canDelete: boolean;
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
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-navy-800 bg-navy-900 px-4 py-2.5"
            >
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
                    <span className="text-[10px] leading-none text-navy-950">
                      ✓
                    </span>
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
              {canDelete && (
                <form
                  action={deleteItem}
                  onSubmit={(e) => {
                    if (!confirm("Remove this item?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-xs text-steel-light transition-colors hover:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

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
      {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
    </div>
  );
}

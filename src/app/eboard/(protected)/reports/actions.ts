"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { getCurrentWeekRange } from "@/lib/weekReports";

export type WeeklyReport = { id: string; week_start: string; week_end: string };

// Auto-creates the current week's shared report the first time anyone
// opens the page — there's no manual "start a new report" step. Select
// first; if nothing exists, insert. If two people load the page in the
// same instant, week_start's unique constraint makes the losing insert
// fail cleanly, so we just re-select instead of erroring.
export async function getOrCreateCurrentReport(): Promise<WeeklyReport | null> {
  const supabase = await createClient();
  const { weekStart, weekEnd } = getCurrentWeekRange();

  const { data: existing } = await supabase
    .from("weekly_reports")
    .select("id, week_start, week_end")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("weekly_reports")
    .insert({ week_start: weekStart, week_end: weekEnd })
    .select("id, week_start, week_end")
    .single();

  if (error) {
    const { data: fallback } = await supabase
      .from("weekly_reports")
      .select("id, week_start, week_end")
      .eq("week_start", weekStart)
      .maybeSingle();
    return fallback ?? null;
  }
  return created;
}

export type ItemFormState = { error: string | null };

// To-do list + content ideas are team-wide: any signed-in E-board member
// can add and check items off (see weekly_report_items RLS in
// 0020_weekly_team_reports.sql) — only deleting is locked to owner/admin.
export async function addItem(
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const reportId = formData.get("report_id") as string;
  const kind = formData.get("kind") as string;
  const text = ((formData.get("text") as string) || "").trim();

  if (!reportId || !text) {
    return { error: "Item text is required." };
  }
  if (kind !== "todo" && kind !== "content_idea") {
    return { error: "Invalid item type." };
  }

  const { error } = await supabase.from("weekly_report_items").insert({
    report_id: reportId,
    kind,
    text,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/eboard/reports");
  return { error: null };
}

// Editing text is open to the same audience as adding/checking items (any
// signed-in E-board member) — only deleting is locked to owner/admin. RLS's
// existing "authenticated can update weekly_report_items" policy (0020)
// already covers this since it's row-level, not column-restricted, so no
// migration is needed on top of what toggleItem already relies on.
export async function editItem(
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const id = formData.get("id") as string;
  const text = ((formData.get("text") as string) || "").trim();
  if (!id) return { error: "Missing item id." };
  if (!text) return { error: "Item text is required." };

  const { error } = await supabase
    .from("weekly_report_items")
    .update({ text })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/eboard/reports");
  return { error: null };
}

// Fire-and-forget toggle, submitted as a plain form (no client JS state) —
// same pattern as the checkbox-as-button in FeedbackItem-style components
// elsewhere in the app.
export async function toggleItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;
  const done = formData.get("done") === "true";
  if (!id) return;

  const { error } = await supabase
    .from("weekly_report_items")
    .update({ done })
    .eq("id", id);

  if (error) console.error("Failed to toggle item:", error.message);

  revalidatePath("/eboard/reports");
}

// RLS restricts this to owner/admin — Johnny wanted removal locked down,
// unlike adding/checking which stays open to the whole team. The
// canManage() check here just gives a clean no-op instead of a raw RLS
// error reaching the client.
export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase
    .from("weekly_report_items")
    .delete()
    .eq("id", id);
  if (error) console.error("Failed to delete item:", error.message);

  revalidatePath("/eboard/reports");
}

export type NoteFormState = { error: string | null };

// Notes from Leadership: owner/admin only, same pattern as
// leadership_notes, plus an is_priority flag.
export async function addNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add notes." };
  }

  const reportId = formData.get("report_id") as string;
  const body = ((formData.get("body") as string) || "").trim();
  const isPriority = formData.get("is_priority") === "true";

  if (!reportId || !body) return { error: "Note body is required." };

  const { error } = await supabase.from("weekly_report_notes").insert({
    report_id: reportId,
    body,
    is_priority: isPriority,
    author_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/eboard/reports");
  return { error: null };
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase
    .from("weekly_report_notes")
    .delete()
    .eq("id", id);
  if (error) console.error("Failed to delete note:", error.message);

  revalidatePath("/eboard/reports");
}

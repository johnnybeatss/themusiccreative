"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitReportState = { error: string | null };

// RLS on weekly_reports already restricts INSERT to authenticated users
// (see supabase/migrations/0001_init.sql) — this auth.getUser() check is
// defense in depth, not the only gate.
export async function submitReport(
  _prevState: SubmitReportState,
  formData: FormData
): Promise<SubmitReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to submit a report." };
  }

  const week_of = formData.get("week_of") as string;
  const submitted_by = formData.get("submitted_by") as string;
  const summary = formData.get("summary") as string;
  const action_items = formData.get("action_items") as string;

  if (!week_of || !submitted_by) {
    return { error: "Week of and Submitted by are required." };
  }

  const { error } = await supabase.from("weekly_reports").insert({
    week_of,
    submitted_by,
    summary: summary || null,
    action_items: action_items || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/eboard/reports");
  return { error: null };
}

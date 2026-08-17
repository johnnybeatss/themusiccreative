"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// RLS (0016) also restricts this to owner/admin — this check just gives a
// clean no-op instead of relying solely on the database to reject it.
export async function deleteJoinSubmission(formData: FormData) {
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("join_submissions")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Failed to delete join submission:", error.message);
  }

  revalidatePath("/eboard/join-submissions");
}

// Called directly from JoinSubmissionItem's IntersectionObserver, not a
// form — fires once, the moment a submission actually scrolls into view.
// `.is` guard avoids an unnecessary write once it's already read.
export async function markJoinSubmissionRead(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("join_submissions")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark join submission read:", error.message);
    return;
  }

  // Refreshes the unread badge everywhere it shows (sidebar + dashboard
  // tile), both nested under the (protected) layout.
  revalidatePath("/eboard", "layout");
}

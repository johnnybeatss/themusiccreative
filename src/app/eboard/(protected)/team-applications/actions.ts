"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// RLS (0021_team_applications.sql) also restricts these to owner/admin —
// same defense-in-depth pattern as join_submissions/dj_inquiries actions.

export async function deleteTeamApplication(formData: FormData) {
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  const resumePath = formData.get("resume_path") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_applications")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Failed to delete team application:", error.message);
    return;
  }

  if (resumePath) {
    const { error: storageError } = await supabase.storage
      .from("team-resumes")
      .remove([resumePath]);
    if (storageError) {
      console.error("Failed to delete resume file:", storageError.message);
    }
  }

  revalidatePath("/eboard/team-applications");
}

// Called directly from TeamApplicationItem's IntersectionObserver, not a
// form — same pattern as markJoinSubmissionRead/markDjInquiryRead.
export async function markTeamApplicationRead(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_applications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark team application read:", error.message);
    return;
  }

  revalidatePath("/eboard", "layout");
}

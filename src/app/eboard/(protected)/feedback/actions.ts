"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// RLS on `feedback` restricts DELETE to owner/admin (see
// supabase/migrations/0005) — this check just gives eboard-tier users a
// clear no-op instead of a raw RLS error.
export async function deleteFeedback(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete feedback:", error.message);
  }

  revalidatePath("/eboard/feedback");
}

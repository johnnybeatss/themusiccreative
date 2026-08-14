"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string | null };

// RLS + column-level grants (see supabase/migrations/0005) restrict this
// update to the display_name column only, so there's no way for someone
// to sneak a role change through this same form even if the request were
// tampered with client-side.
export async function updateDisplayName(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to update your name." };
  }

  const displayName = ((formData.get("displayName") as string) || "").trim();
  if (!displayName) {
    return { error: "Name can't be empty." };
  }
  if (displayName.length > 60) {
    return { error: "Name is too long (60 characters max)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/eboard", "layout");
  return { error: null };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { uploadContentImage } from "@/lib/supabase/uploadContentImage";

export type RecapFormState = { error: string | null };

// Owner/admin only — see supabase/migrations/0026_recaps.sql. The
// canManage() checks below give a clean error instead of a raw RLS error
// reaching the client; RLS is what actually enforces it.

function parseRecapForm(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();
  const eventId = ((formData.get("event_id") as string) || "").trim() || null;

  if (!title || !body) {
    return { error: "Title and body are required.", values: null };
  }

  return {
    error: null,
    values: { title, body, event_id: eventId },
  } as const;
}

export async function createRecap(
  _prevState: RecapFormState,
  formData: FormData
): Promise<RecapFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to add a recap." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add recaps." };
  }

  const { error, values } = parseRecapForm(formData);
  if (error || !values) return { error };

  const photo = formData.get("photo") as File | null;
  const { url: photoUrl, error: photoError } = await uploadContentImage(
    supabase,
    photo
  );
  if (photoError) return { error: photoError };

  const { error: insertError } = await supabase
    .from("recaps")
    .insert({ ...values, photo_url: photoUrl, author_id: user.id });
  if (insertError) return { error: insertError.message };

  revalidatePath("/eboard/recaps");
  revalidatePath("/recaps");
  return { error: null };
}

export async function updateRecap(
  _prevState: RecapFormState,
  formData: FormData
): Promise<RecapFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to edit a recap." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can edit recaps." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing recap id." };

  const { error, values } = parseRecapForm(formData);
  if (error || !values) return { error };

  // Only touch photo_url if a new file was actually chosen — leave the
  // existing photo alone otherwise instead of clearing it.
  const photo = formData.get("photo") as File | null;
  const { url: photoUrl, error: photoError } = await uploadContentImage(
    supabase,
    photo
  );
  if (photoError) return { error: photoError };

  const { error: updateError } = await supabase
    .from("recaps")
    .update({ ...values, ...(photoUrl ? { photo_url: photoUrl } : {}) })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/eboard/recaps");
  revalidatePath("/recaps");
  revalidatePath(`/recaps/${id}`);
  return { error: null };
}

export async function deleteRecap(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase.from("recaps").delete().eq("id", id);
  if (error) console.error("Failed to delete recap:", error.message);

  revalidatePath("/eboard/recaps");
  revalidatePath("/recaps");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { uploadContentImage } from "@/lib/supabase/uploadContentImage";

export type OpportunityFormState = { error: string | null };

const OPPORTUNITY_TYPES = [
  "Gig",
  "Collab",
  "Internship",
  "Showcase",
  "Other",
] as const;
const OPPORTUNITY_STATUSES = ["Not started", "In progress", "Done"] as const;

// Same split as events: RLS on `opportunities` allows any authenticated
// user to write (supabase/migrations/0001_init.sql), and canManage() here
// is the actual owner/admin gate, enforced at the app level for a clearer
// error message than a bare RLS rejection.

function parseOpportunityForm(formData: FormData) {
  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const contactLink =
    ((formData.get("contact_link") as string) || "").trim() || null;
  const status = formData.get("status") as string;

  if (!title) {
    return { error: "Title is required.", values: null };
  }
  if (!OPPORTUNITY_TYPES.includes(type as (typeof OPPORTUNITY_TYPES)[number])) {
    return { error: "Invalid opportunity type.", values: null };
  }
  if (
    !OPPORTUNITY_STATUSES.includes(
      status as (typeof OPPORTUNITY_STATUSES)[number]
    )
  ) {
    return { error: "Invalid status.", values: null };
  }

  return {
    error: null,
    values: { title, type, contact_link: contactLink, status },
  } as const;
}

export async function createOpportunity(
  _prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to add an opportunity." };
  }
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add opportunities." };
  }

  const { error, values } = parseOpportunityForm(formData);
  if (error || !values) return { error };

  const image = formData.get("image") as File | null;
  const { url: imageUrl, error: imageError } = await uploadContentImage(
    supabase,
    image
  );
  if (imageError) return { error: imageError };

  const { error: insertError } = await supabase
    .from("opportunities")
    .insert({ ...values, image_url: imageUrl });
  if (insertError) return { error: insertError.message };

  revalidatePath("/eboard/opportunities");
  revalidatePath("/opportunities");
  return { error: null };
}

export async function updateOpportunity(
  _prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to edit an opportunity." };
  }
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can edit opportunities." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing opportunity id." };

  const { error, values } = parseOpportunityForm(formData);
  if (error || !values) return { error };

  const image = formData.get("image") as File | null;
  const { url: imageUrl, error: imageError } = await uploadContentImage(
    supabase,
    image
  );
  if (imageError) return { error: imageError };

  const { error: updateError } = await supabase
    .from("opportunities")
    .update(imageUrl ? { ...values, image_url: imageUrl } : values)
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/eboard/opportunities");
  revalidatePath("/opportunities");
  return { error: null };
}

export async function deleteOpportunity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete opportunity:", error.message);
  }

  revalidatePath("/eboard/opportunities");
  revalidatePath("/opportunities");
}

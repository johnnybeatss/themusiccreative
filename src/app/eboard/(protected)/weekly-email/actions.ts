"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { uploadContentImage } from "@/lib/supabase/uploadContentImage";

// RLS (0022_weekly_email_drafts.sql, 0023_weekly_email_extras.sql) also
// restricts read/update to owner/admin — same defense-in-depth pattern as
// the other admin-only inboxes.

const EXTRAS_ROW_ID = "00000000-0000-0000-0000-000000000001";

export type ExtrasFormState = { error: string | null };

// Saves whatever's filled in for NEXT week's draft — every field is
// optional (see 0023_weekly_email_extras.sql), so blank text fields are
// stored as null rather than empty strings, letting the template's
// null-checks decide what to render. The cron route clears this row again
// once it's actually consumed into a draft.
export async function saveWeeklyEmailExtras(
  _prevState: ExtrasFormState,
  formData: FormData
): Promise<ExtrasFormState> {
  if (!canManage(await getMyRole())) {
    return { error: "Restricted to owner/admin accounts." };
  }

  const supabase = await createClient();

  const text = (name: string) =>
    ((formData.get(name) as string) || "").trim() || null;

  const photo = formData.get("recap_photo") as File | null;
  const removePhoto = formData.get("remove_photo") === "on";

  const { url: uploadedPhotoUrl, error: photoError } = await uploadContentImage(
    supabase,
    photo
  );
  if (photoError) return { error: photoError };

  const { error } = await supabase
    .from("weekly_email_extras")
    .update({
      primary_cta_label: text("primary_cta_label"),
      primary_cta_url: text("primary_cta_url"),
      subject_override: text("subject_override"),
      member_spotlight_name: text("member_spotlight_name"),
      member_spotlight_text: text("member_spotlight_text"),
      member_spotlight_link: text("member_spotlight_link"),
      recap_caption: text("recap_caption"),
      // A newly uploaded photo wins; otherwise "remove photo" clears it;
      // otherwise leave whatever's already stored alone.
      ...(uploadedPhotoUrl
        ? { recap_photo_url: uploadedPhotoUrl }
        : removePhoto
          ? { recap_photo_url: null }
          : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", EXTRAS_ROW_ID);
  if (error) return { error: error.message };

  revalidatePath("/eboard/weekly-email");
  return { error: null };
}

// Called from WeeklyEmailPreview's IntersectionObserver the moment the
// draft card scrolls into view — same "shared inbox, read for everyone
// once anyone's seen it" model as markTeamApplicationRead etc.
export async function markWeeklyEmailDraftReviewed(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("weekly_email_drafts")
    .update({ reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .is("reviewed_at", null);
  if (error) {
    console.error("Failed to mark weekly email draft reviewed:", error.message);
    return;
  }

  revalidatePath("/eboard", "layout");
}

// The one real send action — this is the manual step that replaces true
// autopilot sending. Only sends a broadcast that's still in 'draft' status
// (guards against double-sending if the button is clicked twice).
export async function sendWeeklyEmailDraft(formData: FormData) {
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  const { data: draft, error: fetchError } = await supabase
    .from("weekly_email_drafts")
    .select("id, resend_broadcast_id, status")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !draft) {
    console.error("Failed to load weekly email draft:", fetchError?.message);
    return;
  }
  if (draft.status === "sent") return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return;
  }

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.broadcasts.send(
    draft.resend_broadcast_id
  );
  if (sendError) {
    console.error("Failed to send weekly email broadcast:", sendError.message);
    return;
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("weekly_email_drafts")
    .update({ status: "sent", sent_at: nowIso, reviewed_at: nowIso })
    .eq("id", id);
  if (updateError) {
    console.error("Failed to mark weekly email draft sent:", updateError.message);
    return;
  }

  revalidatePath("/eboard/weekly-email");
  revalidatePath("/eboard", "layout");
}

// Lets you delete a draft (or a sent record) straight from the admin page
// instead of needing Supabase's SQL Editor — mainly useful for re-testing
// the cron route same-week, since it only ever creates one draft per week
// and skips if one already exists.
export async function deleteWeeklyEmailDraft(formData: FormData) {
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  const broadcastId = formData.get("resend_broadcast_id") as string;
  if (!id) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && broadcastId) {
    const resend = new Resend(apiKey);
    const { error: removeError } = await resend.broadcasts.remove(broadcastId);
    if (removeError) {
      // Not fatal — e.g. Resend may refuse to remove an already-sent
      // broadcast. Still delete the local row either way.
      console.error("Failed to remove Resend broadcast:", removeError.message);
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("weekly_email_drafts").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete weekly email draft:", error.message);
    return;
  }

  revalidatePath("/eboard/weekly-email");
  revalidatePath("/eboard", "layout");
}

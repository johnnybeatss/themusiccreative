"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// RLS (0022_weekly_email_drafts.sql) also restricts read/update to
// owner/admin — same defense-in-depth pattern as the other admin-only
// inboxes.

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

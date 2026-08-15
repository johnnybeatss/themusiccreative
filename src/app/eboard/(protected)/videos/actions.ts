"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

export type VideoFormState = { error: string | null };

const BUCKET = "feed-videos";
// Matches the Supabase free-tier global file size cap (Storage Settings).
// If the project moves to Pro, this can go up, but 50MB is already large
// for a short muted background clip.
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export async function uploadVideo(
  _prevState: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to add a video." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add videos." };
  }

  const file = formData.get("file") as File | null;
  const caption = ((formData.get("caption") as string) || "").trim();
  const instagramUrl = ((formData.get("instagram_url") as string) || "").trim();

  if (!file || file.size === 0) return { error: "Choose a video file." };
  if (!caption) return { error: "Caption is required." };
  if (!instagramUrl) return { error: "Instagram link is required." };
  if (!file.type.startsWith("video/")) {
    return { error: "That file isn't a video." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Video is too large — keep it under 50MB." };
  }

  const ext = file.name.split(".").pop() || "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  // New videos go to the end of the wheel.
  const { count } = await supabase
    .from("feed_videos")
    .select("id", { count: "exact", head: true });

  const { error: insertError } = await supabase.from("feed_videos").insert({
    storage_path: path,
    caption,
    instagram_url: instagramUrl,
    sort_order: count ?? 0,
  });
  if (insertError) {
    // Don't leave an orphaned file if the row insert failed.
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: insertError.message };
  }

  revalidatePath("/eboard/videos");
  revalidatePath("/");
  return { error: null };
}

export async function deleteVideo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  const storagePath = formData.get("storage_path") as string;
  if (!id) return;

  const { error } = await supabase.from("feed_videos").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete video row:", error.message);
    return;
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);
    if (storageError) {
      console.error("Failed to delete video file:", storageError.message);
    }
  }

  revalidatePath("/eboard/videos");
  revalidatePath("/");
}

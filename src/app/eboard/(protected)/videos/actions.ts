"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// The video file itself is uploaded client-side, directly from the browser
// to Supabase Storage (see VideoUploadForm.tsx) — not through this Server
// Action. Vercel Functions hard-cap request bodies at 4.5MB platform-wide
// (separate from, and stricter than, Next.js's own serverActions
// bodySizeLimit config), so routing a multi-MB video through here would
// fail regardless of that config. This action only ever handles small text
// fields plus the storage path of an already-uploaded file.

export async function saveFeedVideo({
  storagePath,
  caption,
  instagramUrl,
}: {
  storagePath: string;
  caption: string;
  instagramUrl: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to add a video." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add videos." };
  }
  if (!storagePath || !caption.trim() || !instagramUrl.trim()) {
    return { error: "Missing required fields." };
  }

  // New videos go to the end of the wheel.
  const { count } = await supabase
    .from("feed_videos")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase.from("feed_videos").insert({
    storage_path: storagePath,
    caption: caption.trim(),
    instagram_url: instagramUrl.trim(),
    sort_order: count ?? 0,
  });
  if (error) return { error: error.message };

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
      .from("feed-videos")
      .remove([storagePath]);
    if (storageError) {
      console.error("Failed to delete video file:", storageError.message);
    }
  }

  revalidatePath("/eboard/videos");
  revalidatePath("/");
}

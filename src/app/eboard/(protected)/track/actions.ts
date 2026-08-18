"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, isOwner } from "@/lib/supabase/role";

// The audio file itself is uploaded client-side, straight from the browser
// to Supabase Storage (see TrackUploadForm.tsx) — same reason as the feed
// videos: Vercel Functions hard-cap request bodies at 4.5MB, and this
// Server Action only ever handles small text fields plus a storage path.

export async function saveWeeklyTrack({
  storagePath,
  trackTitle,
  artistName,
  artistInstagramUrl,
  appleMusicUrl,
  spotifyUrl,
}: {
  storagePath: string;
  trackTitle: string;
  artistName: string;
  artistInstagramUrl?: string | null;
  appleMusicUrl?: string | null;
  spotifyUrl?: string | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to do that." };
  if (!isOwner(await getMyRole())) {
    return { error: "Only the owner account can set the featured track." };
  }
  if (!storagePath || !trackTitle.trim() || !artistName.trim()) {
    return { error: "Missing required fields." };
  }

  const { error } = await supabase.from("weekly_track").insert({
    storage_path: storagePath,
    track_title: trackTitle.trim(),
    artist_name: artistName.trim(),
    artist_instagram_url: artistInstagramUrl || null,
    apple_music_url: appleMusicUrl || null,
    spotify_url: spotifyUrl || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/eboard/track");
  revalidatePath("/", "layout");
  return { error: null };
}

export async function deleteWeeklyTrack(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!isOwner(await getMyRole())) return;

  const id = formData.get("id") as string;
  const storagePath = formData.get("storage_path") as string;
  if (!id) return;

  const { error } = await supabase.from("weekly_track").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete weekly_track row:", error.message);
    return;
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("weekly-track")
      .remove([storagePath]);
    if (storageError) {
      console.error("Failed to delete track file:", storageError.message);
    }
  }

  revalidatePath("/eboard/track");
  revalidatePath("/", "layout");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, isOwner } from "@/lib/supabase/role";
import { normalizeInstagram } from "@/lib/normalizeInstagram";

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

// Re-promotes a past weekly_track row back to current — same "insert a
// new row" model as saveWeeklyTrack, so the row being re-featured stays
// in history too (weekly_track has no update-in-place "current" flag;
// whichever row has the newest updated_at IS current, see page.tsx). No
// file to move — archive rows already point at a file already sitting in
// this same bucket, so this is just a metadata copy.
export async function refeatureTrack(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!isOwner(await getMyRole())) return;

  const trackTitle = formData.get("track_title") as string;
  const artistName = formData.get("artist_name") as string;
  const storagePath = formData.get("storage_path") as string;
  const artistInstagramUrl =
    (formData.get("artist_instagram_url") as string) || null;
  const appleMusicUrl = (formData.get("apple_music_url") as string) || null;
  const spotifyUrl = (formData.get("spotify_url") as string) || null;
  if (!trackTitle || !artistName || !storagePath) return;

  const { error } = await supabase.from("weekly_track").insert({
    storage_path: storagePath,
    track_title: trackTitle,
    artist_name: artistName,
    artist_instagram_url: artistInstagramUrl,
    apple_music_url: appleMusicUrl,
    spotify_url: spotifyUrl,
  });
  if (error) {
    console.error("Failed to re-feature track:", error.message);
    return;
  }

  revalidatePath("/eboard/track");
  revalidatePath("/", "layout");
}

export type TrackFormState = { error: string | null };

// Fixes a typo/detail on an existing row in place — unlike
// refeatureTrack, this never inserts a new row or touches the audio file,
// it just corrects what's already there (current or archived).
export async function editTrack(
  _prevState: TrackFormState,
  formData: FormData
): Promise<TrackFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!isOwner(await getMyRole())) {
    return { error: "Only the owner account can edit the weekly spotlight." };
  }

  const id = formData.get("id") as string;
  const trackTitle = ((formData.get("track_title") as string) || "").trim();
  const artistName = ((formData.get("artist_name") as string) || "").trim();
  const artistInstagramUrl = normalizeInstagram(
    (formData.get("artist_instagram") as string) || ""
  );
  const appleMusicUrl =
    ((formData.get("apple_music_url") as string) || "").trim() || null;
  const spotifyUrl =
    ((formData.get("spotify_url") as string) || "").trim() || null;

  if (!id) return { error: "Missing track id." };
  if (!trackTitle) return { error: "Track title is required." };
  if (!artistName) return { error: "Artist name is required." };

  const { error } = await supabase
    .from("weekly_track")
    .update({
      track_title: trackTitle,
      artist_name: artistName,
      artist_instagram_url: artistInstagramUrl,
      apple_music_url: appleMusicUrl,
      spotify_url: spotifyUrl,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/eboard/track");
  revalidatePath("/", "layout");
  return { error: null };
}

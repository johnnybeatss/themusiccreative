"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage, isOwner } from "@/lib/supabase/role";

const SUBMISSIONS_BUCKET = "track-submissions";
const WEEKLY_TRACK_BUCKET = "weekly-track";

// RLS (0029_track_submissions.sql) also restricts these to owner/admin —
// same defense-in-depth pattern as team_applications/join_submissions.

export async function deleteTrackSubmission(formData: FormData) {
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  const storagePath = formData.get("storage_path") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("track_submissions")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Failed to delete track submission:", error.message);
    return;
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .remove([storagePath]);
    if (storageError) {
      console.error(
        "Failed to delete submission audio file:",
        storageError.message
      );
    }
  }

  revalidatePath("/eboard/track-submissions");
}

// Called directly from TrackSubmissionItem's IntersectionObserver, not a
// form — same pattern as markTeamApplicationRead.
export async function markTrackSubmissionRead(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("track_submissions")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark track submission read:", error.message);
    return;
  }

  revalidatePath("/eboard", "layout");
}

// Promotes a shortlisted submission straight into the live weekly_track
// slot — the payoff of the weekly Instagram Story bracket: once the
// community picks a winner, one click here copies its audio into the
// public weekly-track bucket and sets it as the site-wide featured track,
// instead of re-downloading and re-uploading the file by hand.
//
// Owner-only, same as every other weekly_track write (0009_weekly_track.sql)
// — deliberately tighter than the admin's usual owner/admin split, since
// this is the club-wide spotlight.
//
// Requires an uploaded file on the submission. Streaming-link-only
// submissions can still win the vote, but weekly_track.storage_path is
// NOT NULL (the site-wide player needs an actual file to play) — the
// button for those is disabled in the UI; feature them by asking for a
// file and using the existing Weekly Spotlight admin page instead.
export async function featureSubmission(formData: FormData) {
  if (!isOwner(await getMyRole())) return;

  const id = formData.get("id") as string;
  const storagePath = formData.get("storage_path") as string;
  const trackTitle = formData.get("track_title") as string;
  const artistName = formData.get("artist_name") as string;
  const artistInstagramUrl = formData.get("artist_instagram_url") as string;
  const appleMusicUrl = (formData.get("apple_music_url") as string) || null;
  const spotifyUrl = (formData.get("spotify_url") as string) || null;
  if (!id || !storagePath || !trackTitle || !artistName) return;

  const supabase = await createClient();

  const { data: downloaded, error: downloadError } = await supabase.storage
    .from(SUBMISSIONS_BUCKET)
    .download(storagePath);
  if (downloadError || !downloaded) {
    console.error(
      "Failed to download submission audio:",
      downloadError?.message
    );
    return;
  }

  const ext = storagePath.split(".").pop() || "mp3";
  const newPath = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(WEEKLY_TRACK_BUCKET)
    .upload(newPath, downloaded, {
      contentType: downloaded.type || "audio/mpeg",
    });
  if (uploadError) {
    console.error("Failed to copy audio into weekly-track:", uploadError.message);
    return;
  }

  const { error: insertError } = await supabase.from("weekly_track").insert({
    storage_path: newPath,
    track_title: trackTitle,
    artist_name: artistName,
    artist_instagram_url: artistInstagramUrl || null,
    apple_music_url: appleMusicUrl,
    spotify_url: spotifyUrl,
  });
  if (insertError) {
    console.error("Failed to insert weekly_track row:", insertError.message);
    return;
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("track_submissions")
    .update({ featured_at: now, read_at: now })
    .eq("id", id);
  if (updateError) {
    console.error(
      "Failed to mark submission as featured:",
      updateError.message
    );
  }

  revalidatePath("/eboard/track-submissions");
  revalidatePath("/eboard/track");
  revalidatePath("/", "layout");
}

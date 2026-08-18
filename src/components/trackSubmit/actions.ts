"use server";

import { createClient } from "@/lib/supabase/server";

// Public, unauthenticated action — same trust model as /join, /join-team,
// and /dj-booking. RLS (0029_track_submissions.sql) allows the insert but
// has no public select policy, and the audio file (if any) goes to a
// PRIVATE storage bucket, same as team resumes.
//
// The audio file itself is uploaded client-side, straight from the browser
// to Supabase Storage (see SubmitTrackForm.tsx) — same reason as the
// weekly-track admin uploader: Vercel Functions cap request bodies at
// 4.5MB, well under the 20MB an audio file can run.
export async function submitTrackSubmission({
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
  artistInstagramUrl: string;
  appleMusicUrl?: string | null;
  spotifyUrl?: string | null;
}): Promise<{ error: string | null }> {
  if (
    !storagePath ||
    !trackTitle.trim() ||
    !artistName.trim() ||
    !artistInstagramUrl.trim()
  ) {
    return { error: "Missing required fields." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("track_submissions").insert({
    storage_path: storagePath,
    track_title: trackTitle.trim(),
    artist_name: artistName.trim(),
    artist_instagram_url: artistInstagramUrl,
    apple_music_url: appleMusicUrl || null,
    spotify_url: spotifyUrl || null,
  });
  if (error) return { error: error.message };

  return { error: null };
}

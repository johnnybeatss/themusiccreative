import "server-only";
import type { createClient } from "./server";

const BUCKET = "content-photos";
// 4MB — safely under Vercel's serverless function body cap (~4.5MB), so
// this can go through the normal Server Action FormData instead of the
// client-direct-to-storage pattern used for audio/video uploads.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type Client = Awaited<ReturnType<typeof createClient>>;

// Shared by the Events and Opportunities admin forms. Returns `url: null,
// error: null` when no file was chosen (cover image is always optional) —
// callers should treat that as "leave the existing image alone."
export async function uploadContentImage(
  supabase: Client,
  file: File | null
): Promise<{ url: string | null; error: string | null }> {
  if (!file || file.size === 0) return { url: null, error: null };

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Cover must be an image file." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { url: null, error: "Image is too large — keep it under 4MB." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// Same rules as uploadContentImage, applied to a batch — used for the
// Events detail page's extra photo gallery, where more than one file can
// be added at once. Stops and reports on the first bad file rather than
// silently skipping it.
export async function uploadContentImages(
  supabase: Client,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const { url, error } = await uploadContentImage(supabase, file);
    if (error) return { urls: [], error };
    if (url) urls.push(url);
  }
  return { urls, error: null };
}

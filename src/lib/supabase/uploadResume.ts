import "server-only";
import type { createClient } from "./server";

const BUCKET = "team-resumes";
const MAX_RESUME_BYTES = 4 * 1024 * 1024; // 4MB — same cap as uploadContentImage, well under Vercel's ~4.5MB serverless body limit.

type Client = Awaited<ReturnType<typeof createClient>>;

// Uploads to the PRIVATE team-resumes bucket and returns the storage path
// (not a public URL — the bucket has no public-read policy, only owner/
// admin can ever read a file back out; see 0021_team_applications.sql).
export async function uploadResume(
  supabase: Client,
  file: File | null
): Promise<{ path: string | null; error: string | null }> {
  if (!file || file.size === 0) {
    return { path: null, error: "Resume is required." };
  }
  if (file.type !== "application/pdf") {
    return { path: null, error: "Resume must be a PDF." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { path: null, error: "Resume is too large — keep it under 4MB." };
  }

  const path = `${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { path: null, error: uploadError.message };

  return { path, error: null };
}

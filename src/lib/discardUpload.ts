import "server-only";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Public submissions upload audio browser -> Storage first, then record the
// row. When recording fails, the file is orphaned — and the browser can't
// delete it (anonymous visitors have no delete policy on these private
// buckets). This removes it server-side instead.
//
// Guarded so it can't be abused to delete real files: the path must look
// like one our upload form generates ([<uuid>/]<uuid>.<ext>), and nothing
// in `table` may reference it.
const UPLOAD_PATH_RE = /^(?:[0-9a-f-]{36}\/)?[0-9a-f-]{36}\.[a-z0-9]{1,10}$/i;

export async function discardUpload(
  bucket: "track-submissions" | "battle-entries",
  table: "track_submissions" | "battle_entries",
  path: string
): Promise<void> {
  if (!UPLOAD_PATH_RE.test(path)) return;
  const service = createServiceClient();
  const { count, error } = await service
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("storage_path", path);
  if (error || count) return;
  const { error: removeError } = await service.storage.from(bucket).remove([path]);
  if (removeError) console.error("discardUpload failed:", removeError.message);
}

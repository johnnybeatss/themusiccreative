"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveFeedVideo } from "./actions";

const BUCKET = "feed-videos";
// Matches the Supabase free-tier global file size cap (Storage Settings).
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export default function VideoUploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    const caption = ((formData.get("caption") as string) || "").trim();
    const instagramUrl = (
      (formData.get("instagram_url") as string) || ""
    ).trim();

    if (!file || file.size === 0) return setError("Choose a video file.");
    if (!caption) return setError("Caption is required.");
    if (!instagramUrl) return setError("Instagram link is required.");
    if (!file.type.startsWith("video/")) {
      return setError("That file isn't a video.");
    }
    if (file.size > MAX_FILE_BYTES) {
      return setError("Video is too large — keep it under 50MB.");
    }

    setPending(true);
    // Uploaded directly from the browser to Supabase Storage, bypassing
    // Vercel's serverless functions entirely — they hard-cap request
    // bodies at 4.5MB, which any real video file exceeds.
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${crypto.randomUUID()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await saveFeedVideo({
        storagePath: path,
        caption,
        instagramUrl,
      });
      if (result.error) {
        // Don't leave an orphaned file if the row insert failed.
        await supabase.storage.from(BUCKET).remove([path]);
        setError(result.error);
        return;
      }

      formRef.current?.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-6 space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <h2 className="font-display text-lg tracking-wide text-ivory">
        ADD A VIDEO
      </h2>
      <label className="block text-sm">
        <span className="text-steel-light">Video file</span>
        <input
          type="file"
          name="file"
          accept="video/*"
          required
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
      </label>
      <p className="text-xs text-steel-light">
        Under 50MB, already compressed — an mp4 exported straight from
        Instagram works well.
      </p>
      <label className="block text-sm">
        <span className="text-steel-light">Caption</span>
        <input
          type="text"
          name="caption"
          required
          placeholder="e.g. Balcony DJ Set"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Instagram link</span>
        <input
          type="url"
          name="instagram_url"
          required
          placeholder="https://www.instagram.com/reel/..."
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {pending ? "Uploading..." : "Add video"}
      </button>
    </form>
  );
}

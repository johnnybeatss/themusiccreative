"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveWeeklyTrack } from "./actions";

const BUCKET = "weekly-track";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB — plenty for an mp3

export default function TrackUploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    const trackTitle = ((formData.get("track_title") as string) || "").trim();
    const artistName = ((formData.get("artist_name") as string) || "").trim();

    if (!file || file.size === 0) return setError("Choose an audio file.");
    if (!trackTitle) return setError("Track title is required.");
    if (!artistName) return setError("Artist name is required.");
    if (!file.type.startsWith("audio/")) {
      return setError("That file isn't audio.");
    }
    if (file.size > MAX_FILE_BYTES) {
      return setError("File is too large — keep it under 20MB.");
    }

    setPending(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "mp3";
    const path = `${crypto.randomUUID()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await saveWeeklyTrack({
        storagePath: path,
        trackTitle,
        artistName,
      });
      if (result.error) {
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
        SET THIS WEEK&apos;S TRACK
      </h2>
      <label className="block text-sm">
        <span className="text-steel-light">Audio file</span>
        <input
          type="file"
          name="file"
          accept="audio/*"
          required
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
      </label>
      <p className="text-xs text-steel-light">
        Under 20MB — an mp3 exported from the DAW or Instagram works well.
      </p>
      <label className="block text-sm">
        <span className="text-steel-light">Track title</span>
        <input
          type="text"
          name="track_title"
          required
          placeholder="e.g. Slow Wine"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Artist name</span>
        <input
          type="text"
          name="artist_name"
          required
          placeholder="e.g. JAYMUTT"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {pending ? "Uploading..." : "Set as featured track"}
      </button>
    </form>
  );
}

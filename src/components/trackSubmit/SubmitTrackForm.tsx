"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeInstagram } from "@/lib/normalizeInstagram";
import { submitTrackSubmission } from "./actions";

const BUCKET = "track-submissions";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB — same cap as the admin uploader

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";

export default function SubmitTrackForm({
  onSubmitted,
}: {
  onSubmitted: () => void;
}) {
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
    const artistInstagramUrl = normalizeInstagram(
      (formData.get("artist_instagram") as string) || ""
    );
    const appleMusicUrl =
      ((formData.get("apple_music_url") as string) || "").trim() || null;
    const spotifyUrl =
      ((formData.get("spotify_url") as string) || "").trim() || null;

    if (!trackTitle) return setError("Track title is required.");
    if (!artistName) return setError("Artist name is required.");
    if (!artistInstagramUrl) return setError("Instagram handle is required.");
    const hasFile = !!file && file.size > 0;
    if (!hasFile && !appleMusicUrl && !spotifyUrl) {
      return setError(
        "Include an audio file, a Spotify link, or an Apple Music link."
      );
    }
    if (hasFile && !file!.type.startsWith("audio/")) {
      return setError("That file isn't audio.");
    }
    if (hasFile && file!.size > MAX_FILE_BYTES) {
      return setError("File is too large — keep it under 20MB.");
    }

    setPending(true);
    let storagePath: string | null = null;
    try {
      if (hasFile) {
        const supabase = createClient();
        const ext = file!.name.split(".").pop() || "mp3";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file!, { contentType: file!.type });
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        storagePath = path;
      }

      const result = await submitTrackSubmission({
        storagePath,
        trackTitle,
        artistName,
        artistInstagramUrl,
        appleMusicUrl,
        spotifyUrl,
      });
      if (result.error) {
        if (storagePath) {
          const supabase = createClient();
          await supabase.storage.from(BUCKET).remove([storagePath]);
        }
        setError(result.error);
        return;
      }

      formRef.current?.reset();
      onSubmitted();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-navy-800 bg-navy-950 p-4"
    >
      <label className={labelClass}>
        <span className="text-steel-light">Song title</span>
        <input
          type="text"
          name="track_title"
          required
          placeholder="e.g. Slow Wine"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">Artist name</span>
        <input
          type="text"
          name="artist_name"
          required
          placeholder="e.g. JAYMUTT"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">Your Instagram</span>
        <input
          type="text"
          name="artist_instagram"
          required
          placeholder="@handle or full profile link"
          className={inputClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-steel-light">Spotify link (optional)</span>
          <input
            type="url"
            name="spotify_url"
            placeholder="https://open.spotify.com/..."
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Apple Music link (optional)</span>
          <input
            type="url"
            name="apple_music_url"
            placeholder="https://music.apple.com/..."
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-steel-light">
          Audio file (optional if you gave a link above)
        </span>
        <input
          type="file"
          name="file"
          accept="audio/*"
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
        <span className="mt-1 block text-xs text-steel-light">
          Under 20MB — an mp3 exported from the DAW or Instagram works well.
        </span>
      </label>
      <p className="text-xs text-steel-light">
        Give us at least one way to hear it: a Spotify link, an Apple Music
        link, or the file itself.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit track"}
      </button>
    </form>
  );
}

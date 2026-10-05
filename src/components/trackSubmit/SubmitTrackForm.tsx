"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeInstagram } from "@/lib/normalizeInstagram";
import { submitTrackSubmission } from "./actions";
import { submitBattleEntry } from "@/app/battles/[id]/actions";
import { MUSIC_KINDS } from "@/lib/musicKinds";
import HoneypotFields from "@/components/HoneypotFields";
import { HONEYPOT_FIELD, STARTED_AT_FIELD, looksLikeSpam } from "@/lib/formGuard";

// One form for all music. With a `battleId` (a Spotlight Battle is taking
// submissions) the entry goes straight into that battle; otherwise it lands
// in the Track Submissions inbox for E-Board to add to the next battle.
const INBOX_BUCKET = "track-submissions";
const BATTLE_BUCKET = "battle-entries";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB — same cap as the admin uploader

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";

export default function SubmitTrackForm({
  onSubmitted,
  battleId = null,
}: {
  onSubmitted: () => void;
  battleId?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Bail before uploading anything if it's a bot (src/lib/formGuard.ts).
    if (looksLikeSpam(formData)) {
      formRef.current?.reset();
      onSubmitted();
      return;
    }
    const guard = {
      [HONEYPOT_FIELD]: (formData.get(HONEYPOT_FIELD) as string) || "",
      [STARTED_AT_FIELD]: (formData.get(STARTED_AT_FIELD) as string) || "",
    };
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

    const kind = (formData.get("kind") as string) || "";
    if (!kind) return setError("Pick what you're submitting.");
    if (!trackTitle) return setError("Title is required.");
    if (!artistName) return setError("Name is required.");
    if (!artistInstagramUrl) return setError("Instagram handle is required.");
    if (!file || file.size === 0) return setError("Choose an audio file.");
    if (!file.type.startsWith("audio/")) {
      return setError("That file isn't audio.");
    }
    if (file.size > MAX_FILE_BYTES) {
      return setError("File is too large — keep it under 20MB.");
    }

    setPending(true);
    let storagePath: string | null = null;
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "mp3";
      const bucket = battleId ? BATTLE_BUCKET : INBOX_BUCKET;
      const path = battleId
        ? `${battleId}/${crypto.randomUUID()}.${ext}`
        : `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      storagePath = path;

      const result = battleId
        ? await submitBattleEntry({
            battleId,
            storagePath,
            producerName: artistName,
            beatTitle: trackTitle,
            instagram: artistInstagramUrl,
            kind,
            spotifyUrl,
            appleMusicUrl,
            guard,
          })
        : await submitTrackSubmission({
            storagePath,
            trackTitle,
            artistName,
            artistInstagramUrl,
            appleMusicUrl,
            spotifyUrl,
            kind,
            guard,
          });
      if (result.error) {
        if (storagePath && !battleId) {
          const supabase = createClient();
          await supabase.storage.from(INBOX_BUCKET).remove([storagePath]);
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
      className="relative space-y-3 rounded-xl border border-navy-800 bg-navy-950 p-4"
    >
      <HoneypotFields />
      <fieldset>
        <legend className="text-sm text-steel-light">What is it?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {MUSIC_KINDS.map((k) => (
            <label
              key={k}
              className="cursor-pointer rounded-full border border-navy-800 px-3 py-1.5 text-sm text-steel-light transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold has-[:checked]:text-white"
            >
              <input type="radio" name="kind" value={k} className="sr-only" />
              {k}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={labelClass}>
        <span className="text-steel-light">Title</span>
        <input
          type="text"
          name="track_title"
          required
          placeholder="Song, beat, or mix name"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">Artist / producer name</span>
        <input
          type="text"
          name="artist_name"
          required
          placeholder="e.g. johnnybeatss"
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
      <label className={labelClass}>
        <span className="text-steel-light">Audio file</span>
        <input
          type="file"
          name="file"
          accept="audio/*"
          required
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-gold-light"
        />
        <span className="mt-1 block text-xs text-steel-light">
          Under 20MB — an mp3 exported from the DAW or Instagram works well.
        </span>
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
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {pending ? "Uploading..." : battleId ? "Enter the battle" : "Submit"}
      </button>
    </form>
  );
}

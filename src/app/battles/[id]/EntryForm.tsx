"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import HoneypotFields from "@/components/HoneypotFields";
import { HONEYPOT_FIELD, STARTED_AT_FIELD, looksLikeSpam } from "@/lib/formGuard";
import { submitBattleEntry } from "./actions";

const BUCKET = "battle-entries";
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";

// Same browser -> Storage upload flow as the homepage track submission
// form (see src/components/trackSubmit/SubmitTrackForm.tsx).
export default function EntryForm({ battleId }: { battleId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (looksLikeSpam(fd)) {
      setDone(true);
      return;
    }
    const file = fd.get("file") as File | null;
    const producerName = ((fd.get("producer_name") as string) || "").trim();
    if (!producerName) return setError("Producer name is required.");
    if (!file || file.size === 0) return setError("Choose your beat file.");
    if (!file.type.startsWith("audio/")) return setError("That file isn't audio.");
    if (file.size > MAX_FILE_BYTES) return setError("Keep it under 20MB (export an mp3).");

    setPending(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "mp3";
      const path = `${battleId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) return setError(uploadError.message);

      const result = await submitBattleEntry({
        battleId,
        storagePath: path,
        producerName,
        beatTitle: (fd.get("beat_title") as string) || "",
        instagram: (fd.get("instagram") as string) || "",
        guard: {
          [HONEYPOT_FIELD]: (fd.get(HONEYPOT_FIELD) as string) || "",
          [STARTED_AT_FIELD]: (fd.get(STARTED_AT_FIELD) as string) || "",
        },
      });
      if (result.error) return setError(result.error);
      formRef.current?.reset();
      setDone(true);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-gold/50 bg-navy-900 p-5">
        <p className="font-semibold text-ivory">You&apos;re in. 🔥</p>
        <p className="mt-1 text-sm text-steel-light">
          Your beat goes live once E-Board approves it — usually before
          voting opens.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative max-w-lg space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-5"
    >
      <HoneypotFields />
      <h2 className="font-display text-xl tracking-wide text-ivory">ENTER THIS BATTLE</h2>
      <label className="block text-sm">
        <span className="text-steel-light">Producer name</span>
        <input name="producer_name" required maxLength={80} placeholder="e.g. johnnybeatss" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Beat title (optional)</span>
        <input name="beat_title" maxLength={120} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Instagram (optional)</span>
        <input name="instagram" placeholder="@handle" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Beat file</span>
        <input
          type="file"
          name="file"
          accept="audio/*"
          required
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-gold-light"
        />
        <span className="mt-1 block text-xs text-steel-light">mp3 under 20MB. Only send beats you made.</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {pending ? "Uploading..." : "Submit beat"}
      </button>
    </form>
  );
}

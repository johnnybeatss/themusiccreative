"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadVideo, type VideoFormState } from "./actions";

const initialState: VideoFormState = { error: null };

export default function VideoUploadForm() {
  const [state, formAction, isPending] = useActionState(
    uploadVideo,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
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
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Uploading..." : "Add video"}
      </button>
    </form>
  );
}

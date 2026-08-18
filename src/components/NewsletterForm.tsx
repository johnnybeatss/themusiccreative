"use client";

import { useState } from "react";

// Compact footer signup form. Posts straight to /api/newsletter/subscribe,
// which adds the email to the Resend Contacts audience — that's the whole
// mailing list, no separate database table.
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("sent");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Try again.");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-gold">You&apos;re on the list — thanks!</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs">
      <p className="mb-2 text-xs uppercase tracking-wide text-steel-light">
        Weekly updates
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-lg border border-navy-800 bg-navy-900 px-3 py-2 text-sm text-ivory placeholder:text-steel-light transition-colors focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {status === "sending" ? "..." : "Join"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </form>
  );
}

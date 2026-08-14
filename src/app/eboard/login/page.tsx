"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Invite-only magic-link sign-in. There is no password and no public
// sign-up — an account only works if it was created for that email from
// the Supabase dashboard (Authentication > Users > Invite user).
export default function EboardLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mx-auto max-w-sm py-10">
        <h1 className="font-display text-2xl tracking-wide text-ivory">
          CHECK YOUR EMAIL
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-sm text-steel-light">
          We sent a sign-in link to{" "}
          <span className="font-medium text-ivory">{email}</span>. Click it
          to get into the E-Board area — no password needed.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl tracking-wide text-ivory">
        E-BOARD LOGIN
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-6 text-sm text-steel-light">
        Access is invite-only. Enter the email your account was created
        with and we&apos;ll send you a sign-in link — no password needed.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@fiu.edu"
          className="w-full rounded-md border border-navy-800 bg-navy-900 px-3 py-2 text-sm text-ivory placeholder:text-steel-light focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-md bg-gold px-3 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send sign-in link"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}

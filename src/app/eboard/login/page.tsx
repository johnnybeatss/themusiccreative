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
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-neutral-500">
          We sent a sign-in link to <span className="font-medium">{email}</span>.
          Click it to get into the E-Board area — no password needed.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-bold">E-Board Login</h1>
      <p className="mt-2 text-sm text-neutral-500">
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send sign-in link"}
        </button>
        {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

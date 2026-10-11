"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EboardLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Surface *why* a magic-link click bounced back here. The most common
  // cause isn't a bug in this app — email providers (Outlook Safe Links,
  // Gmail's link scanner, etc.) sometimes "pre-visit" links in an email to
  // scan them for safety before you ever click. Since a magic-link code is
  // single-use, that pre-visit burns it, and your real click then fails.
  useEffect(() => {
    if (searchParams.get("error") === "auth-failed") {
      setStatus("error");
      setError(
        "That sign-in link didn't work — it may have expired or already been used (some email apps \"scan\" links automatically, which can use it up before you click). Request a new one below."
      );
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    // IMPORTANT: do NOT use window.location.origin here. If someone submits
    // this form from a stale/preview URL (an old Vercel deployment link,
    // etc.), that wrong origin gets permanently baked into this specific
    // magic-link email. NEXT_PUBLIC_SITE_URL is fixed at build time to the
    // real production domain, so every email always points to the one
    // correct place regardless of what URL the browser happened to be on.
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        // Invite-only: never create an account from this form. Without
        // this, anyone typing any email would get a brand-new account
        // (and the default 'eboard' role from the profiles trigger).
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus("error");
      // With shouldCreateUser:false, an email with no account comes back
      // as "Signups not allowed for otp".
      setError(
        /signups? not allowed/i.test(error.message)
          ? "That email doesn't have E-Board access. Ask an admin to invite you."
          : error.message
      );
      return;
    }

    setStatus("sent");
  }

  // Fallback that works even when the link doesn't: the same email has a
  // one-time code (see the Magic Link email template in Supabase).
  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setVerifying(false);
    if (error) {
      setError("That code didn't work — double-check it or request a new email.");
      return;
    }
    window.location.href = "/eboard";
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
        <form onSubmit={handleCode} className="mt-6 space-y-3">
          <label className="block text-sm text-steel-light">
            Or enter the code from the email
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              placeholder="123456"
              className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-900 px-3 py-2 text-center text-lg tracking-[0.4em] text-ivory placeholder:text-steel-light/50 focus:border-gold focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={verifying || code.length < 6}
            className="w-full rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {verifying ? "Checking..." : "Sign in with code"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
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
          className="w-full rounded-lg border border-navy-800 bg-navy-900 px-3 py-2 text-sm text-ivory placeholder:text-steel-light transition-colors focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-light disabled:opacity-50"
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

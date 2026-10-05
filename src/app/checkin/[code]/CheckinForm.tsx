"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { checkIn } from "./actions";

// Remembered on this device only, so returning members can check in with
// one tap. Never sent anywhere except the check-in action.
const STORAGE_KEY = "tmc_checkin_profile";
type Saved = { firstName: string; lastName: string; email: string; showOnLeaderboard: boolean };

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2.5 text-base text-ivory placeholder:text-steel-light/60 focus:border-gold focus:outline-none";

export default function CheckinForm({ code, eventName }: { code: string; eventName: string }) {
  const [form, setForm] = useState<Saved>({ firstName: "", lastName: "", email: "", showOnLeaderboard: true });
  const [remembered, setRemembered] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ total: number; already: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Saved>;
        setForm((f) => ({ ...f, ...saved }));
        if (saved.firstName && saved.lastName) setRemembered(true);
      }
    } catch {
      // Storage blocked (private mode etc.) — just show the empty form.
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await checkIn({ code, ...form });
      if (res.error) return setError(res.error);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {}
      setResult({ total: res.total ?? 1, already: !!res.already });
    } finally {
      setPending(false);
    }
  }

  function forget() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setForm({ firstName: "", lastName: "", email: "", showOnLeaderboard: true });
    setRemembered(false);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-gold/50 bg-navy-900 p-6 text-center">
        <p className="font-display text-3xl tracking-wide text-ivory">
          {result.already ? "ALREADY IN" : "YOU'RE CHECKED IN"}
        </p>
        <p className="mt-2 text-steel-light">
          {eventName} · {result.total} event{result.total === 1 ? "" : "s"} this school year.
        </p>
        <Link href="/leaderboard" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          See the leaderboard &rarr;
        </Link>
      </div>
    );
  }

  const set = (k: keyof Saved) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "showOnLeaderboard" ? e.target.checked : e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-800 bg-navy-900 p-5">
      {remembered && (
        <p className="text-sm text-steel-light">
          Welcome back, {form.firstName}.{" "}
          <button type="button" onClick={forget} className="text-accent hover:underline">
            Not you?
          </button>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-steel-light">First name</span>
          <input value={form.firstName} onChange={set("firstName")} required maxLength={50} autoComplete="given-name" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Last name</span>
          <input value={form.lastName} onChange={set("lastName")} required maxLength={50} autoComplete="family-name" className={inputClass} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">FIU email (skip if you don&apos;t have one)</span>
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@fiu.edu"
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-steel-light">
        <input type="checkbox" checked={form.showOnLeaderboard} onChange={set("showOnLeaderboard")} className="h-4 w-4 accent-[#2436db]" />
        Show me on the leaderboard (first name + last initial only)
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold px-5 py-3 text-base font-semibold text-white hover:bg-gold-light disabled:opacity-50"
      >
        {pending ? "Checking in..." : "Check in"}
      </button>
    </form>
  );
}

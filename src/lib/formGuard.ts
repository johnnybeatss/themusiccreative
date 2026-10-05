// Lightweight spam + sanity checks shared by every public form.
//
// Spam: a hidden "honeypot" input that real people never see or fill in
// (bots auto-fill every field they find), plus a minimum time-on-form —
// a human can't fill out a form in under ~2 seconds, scripts do it
// instantly. Both fields are rendered by <HoneypotFields /> in
// src/components/HoneypotFields.tsx. When either trips, actions return a
// fake success so bots don't learn to adapt — nothing is saved.
//
// This is a deliberately low-friction baseline (no CAPTCHA for real
// members). If a form starts getting hammered anyway, the next step up is
// Cloudflare Turnstile.

export const HONEYPOT_FIELD = "company_website";
export const STARTED_AT_FIELD = "form_started_at";
const MIN_FILL_MS = 1500;

type FieldSource = FormData | Record<string, unknown> | null | undefined;

function read(src: FieldSource, key: string): string {
  if (!src) return "";
  const v = src instanceof FormData ? src.get(key) : src[key];
  return typeof v === "string" ? v : "";
}

export function looksLikeSpam(src: FieldSource): boolean {
  if (read(src, HONEYPOT_FIELD).trim() !== "") return true;
  const started = Number(read(src, STARTED_AT_FIELD));
  // Missing/invalid timestamp is NOT treated as spam (e.g. JS failed to
  // hydrate) — only a provably-too-fast submission is.
  if (Number.isFinite(started) && started > 0 && Date.now() - started < MIN_FILL_MS) {
    return true;
  }
  return false;
}

// Good-enough shape check, same as the newsletter route — catches typos
// and garbage, not a full RFC 5322 validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

// Returns an error message if any field is over its limit, else null.
export function checkLengths(fields: Record<string, [string | null | undefined, number]>): string | null {
  for (const [label, [value, max]] of Object.entries(fields)) {
    if (value && value.length > max) return `${label} is too long (${max} characters max).`;
  }
  return null;
}

"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ALLOWED: EmailOtpType[] = ["email", "magiclink", "invite", "recovery", "signup", "email_change"];

// Verifies the token_hash from the sign-in email and sets the session
// cookies. Unlike the old ?code= link (/auth/callback), this works no
// matter which browser or device the link is opened on — there's no
// browser-specific "code verifier" involved.
export async function confirmSignIn(formData: FormData) {
  const tokenHash = (formData.get("token_hash") as string) || "";
  const type = formData.get("type") as EmailOtpType;
  const next = (formData.get("next") as string) || "/eboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/eboard";

  if (!tokenHash || !ALLOWED.includes(type)) redirect("/eboard/login?error=auth-failed");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    console.error("verifyOtp failed:", error.message);
    redirect("/eboard/login?error=auth-failed");
  }
  redirect(safeNext);
}

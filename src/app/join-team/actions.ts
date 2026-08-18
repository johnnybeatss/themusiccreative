"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadResume } from "@/lib/supabase/uploadResume";

export type JoinTeamFormState = { error: string | null };

function req(formData: FormData, key: string): string {
  return ((formData.get(key) as string) || "").trim();
}

// Public, unauthenticated action — same trust model as /join, /feedback,
// and /dj-booking. RLS (supabase/migrations/0021_team_applications.sql)
// allows the insert but has no public select policy, and the resume file
// goes to a PRIVATE storage bucket (owner/admin read-only, no public URL).
export async function submitTeamApplication(
  _prevState: JoinTeamFormState,
  formData: FormData
): Promise<JoinTeamFormState> {
  const fullName = req(formData, "full_name");
  const email = req(formData, "email");
  const phone = req(formData, "phone") || null;
  const roleInterest = req(formData, "role_interest");
  const whyJoin = req(formData, "why_join") || null;

  if (!fullName || !email || !roleInterest) {
    return { error: "Name, email, and role are required." };
  }

  const supabase = await createClient();

  const resume = formData.get("resume") as File | null;
  const { path: resumePath, error: resumeError } = await uploadResume(
    supabase,
    resume
  );
  if (resumeError) return { error: resumeError };

  const { error } = await supabase.from("team_applications").insert({
    full_name: fullName,
    email,
    phone,
    role_interest: roleInterest,
    why_join: whyJoin,
    resume_path: resumePath,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

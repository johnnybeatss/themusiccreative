"use server";

import { createClient } from "@/lib/supabase/server";

export type JoinFormState = { error: string | null };

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"] as const;
const EXPERIENCE_LENGTHS = [
  "Just starting",
  "1-2 years",
  "3-5 years",
  "5+ years",
] as const;
const YES_NO_MAYBE = ["yes", "no", "maybe"] as const;
const YES_NO = ["yes", "no"] as const;
const CREATIVE_ROLES = [
  "Music Producer",
  "Artist/Vocalist",
  "DJ",
  "Camera person/Videographer",
  "Digital artist",
  "Sound Engineer",
  "Graphic Designer",
  "Songwriter",
  "Other",
] as const;

function req(formData: FormData, key: string): string {
  return ((formData.get(key) as string) || "").trim();
}

// Public, unauthenticated action — same trust model as the /feedback form.
// RLS (supabase/migrations/0014_join_and_dj_inquiries.sql) allows the
// insert but has no public select policy, so nothing submitted here is
// readable outside the signed-in owner/admin area.
export async function submitJoinForm(
  _prevState: JoinFormState,
  formData: FormData
): Promise<JoinFormState> {
  const fullName = req(formData, "full_name");
  const fiuEmail = req(formData, "fiu_email");
  const studentId = req(formData, "student_id");
  const phone = req(formData, "phone");
  const major = req(formData, "major");
  const year = req(formData, "year");
  const creativeRoles = formData.getAll("creative_roles") as string[];
  const creativeRoleOther = req(formData, "creative_role_other") || null;
  const experienceLength = req(formData, "experience_length");
  const achievements = req(formData, "achievements") || null;
  const portfolioLink = req(formData, "portfolio_link");
  const clubGoals = req(formData, "club_goals");
  const wantsCollab = req(formData, "wants_collab");
  const wantsToPerform = req(formData, "wants_to_perform");
  const signedToLabel = req(formData, "signed_to_label");
  const workshopIdeas = req(formData, "workshop_ideas") || null;

  if (!fullName || !fiuEmail || !studentId || !phone || !major || !year) {
    return { error: "Fill out all of section 1 (Basic Info)." };
  }
  if (!YEARS.includes(year as (typeof YEARS)[number])) {
    return { error: "Invalid year selection." };
  }
  if (
    creativeRoles.length === 0 ||
    !creativeRoles.every((r) =>
      CREATIVE_ROLES.includes(r as (typeof CREATIVE_ROLES)[number])
    )
  ) {
    return { error: "Pick at least one creative role." };
  }
  if (
    !EXPERIENCE_LENGTHS.includes(
      experienceLength as (typeof EXPERIENCE_LENGTHS)[number]
    )
  ) {
    return { error: "Invalid experience length." };
  }
  if (!portfolioLink) {
    return { error: "Drop a social or portfolio link." };
  }
  if (!clubGoals) {
    return { error: "Let us know what you're hoping to gain from the club." };
  }
  if (!YES_NO_MAYBE.includes(wantsCollab as (typeof YES_NO_MAYBE)[number])) {
    return { error: "Answer the collaboration question." };
  }
  if (
    !YES_NO_MAYBE.includes(wantsToPerform as (typeof YES_NO_MAYBE)[number])
  ) {
    return { error: "Answer the performing/showcasing question." };
  }
  if (!YES_NO.includes(signedToLabel as (typeof YES_NO)[number])) {
    return { error: "Answer the label/distribution question." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("join_submissions").insert({
    full_name: fullName,
    fiu_email: fiuEmail,
    student_id: studentId,
    phone,
    major,
    year,
    creative_roles: creativeRoles,
    creative_role_other: creativeRoleOther,
    experience_length: experienceLength,
    achievements,
    portfolio_link: portfolioLink,
    club_goals: clubGoals,
    wants_collab: wantsCollab,
    wants_to_perform: wantsToPerform,
    signed_to_label: signedToLabel,
    workshop_ideas: workshopIdeas,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

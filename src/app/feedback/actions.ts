"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackFormState = { error: string | null };

const CATEGORIES = ["Event idea", "Like", "Dislike", "General"] as const;

// Public, unauthenticated action — anyone can submit, including visitors
// who've never signed in. RLS (supabase/migrations/0005) allows the
// insert but has no public select policy, so nothing submitted here is
// ever readable outside the signed-in E-Board area.
export async function submitFeedback(
  _prevState: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const name = ((formData.get("name") as string) || "").trim() || null;
  const category = formData.get("category") as string;
  const message = ((formData.get("message") as string) || "").trim();

  if (!message) {
    return { error: "Let us know what's on your mind." };
  }
  if (message.length > 2000) {
    return { error: "That's a bit long — 2000 characters max." };
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Pick a category." };
  }
  if (name && name.length > 60) {
    return { error: "Name is too long (60 characters max)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    name,
    category,
    message,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

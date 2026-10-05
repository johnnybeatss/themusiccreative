"use server";

import { createClient } from "@/lib/supabase/server";
import { looksLikeSpam, checkLengths } from "@/lib/formGuard";
import { normalizeInstagram } from "@/lib/normalizeInstagram";
import { COLLAB_ROLES, type CollabRole } from "@/lib/collab";

export type CollabFormState = { error: string | null; done?: boolean };

// Public, unauthenticated. RLS (0035_collab_posts.sql) only allows inserting
// unapproved rows, so nothing goes public until E-Board approves it.
export async function submitCollabPost(
  _prev: CollabFormState,
  formData: FormData
): Promise<CollabFormState> {
  if (looksLikeSpam(formData)) return { error: null, done: true };

  const get = (k: string) => ((formData.get(k) as string) || "").trim();
  const name = get("name");
  const role = get("role") as CollabRole;
  const lookingFor = get("looking_for");
  const details = get("details") || null;
  const instagram = normalizeInstagram(get("instagram"));
  const sample = get("sample_url") || null;

  if (!name || !lookingFor) return { error: "Name and what you're looking for are required." };
  if (!COLLAB_ROLES.includes(role)) return { error: "Pick what you do." };
  if (!instagram) return { error: "Add your Instagram so people can reach you." };
  if (sample && !/^https:\/\/\S+$/i.test(sample)) {
    return { error: "Link to your work should start with https://" };
  }
  const tooLong = checkLengths({
    Name: [name, 60],
    "Looking for": [lookingFor, 120],
    Details: [details, 600],
    Instagram: [instagram, 300],
    Link: [sample, 300],
  });
  if (tooLong) return { error: tooLong };

  const supabase = await createClient();
  const { error } = await supabase.from("collab_posts").insert({
    name,
    role,
    looking_for: lookingFor,
    details,
    instagram_url: instagram,
    sample_url: sample,
  });
  if (error) {
    console.error("Failed to submit collab post:", error.message);
    return { error: "Couldn't post that — try again." };
  }
  return { error: null, done: true };
}

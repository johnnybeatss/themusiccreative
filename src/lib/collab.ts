// Shared by the public Collab Board and its E-Board admin page.
export const COLLAB_ROLES = ["Producer", "Artist", "Songwriter", "DJ", "Engineer", "Other"] as const;
export type CollabRole = (typeof COLLAB_ROLES)[number];
export const COLLAB_POST_DAYS = 30;

export type CollabPost = {
  id: string;
  name: string;
  role: CollabRole;
  looking_for: string;
  details: string | null;
  instagram_url: string;
  sample_url: string | null;
  approved_at: string | null;
  read_at: string | null;
  created_at: string;
};

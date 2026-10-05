// Client-safe — shared by the submit form, battle pages, and admin.
export const MUSIC_KINDS = ["Beat", "Song", "Mix", "Other"] as const;
export type MusicKind = (typeof MUSIC_KINDS)[number];
export function isMusicKind(v: unknown): v is MusicKind {
  return typeof v === "string" && (MUSIC_KINDS as readonly string[]).includes(v);
}
// Streaming links are optional; when given they must be https URLs.
export function isHttpsUrl(v: string | null | undefined): boolean {
  return !v || /^https:\/\/\S+$/i.test(v);
}

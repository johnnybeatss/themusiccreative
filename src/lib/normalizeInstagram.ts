// Accepts "@handle", "handle", or a full profile URL and normalizes to a
// clean https://instagram.com/handle link — same handles-not-URLs pattern
// used for every Instagram field on the site (team cards, weekly track,
// track submissions).
export function normalizeInstagram(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let handle = trimmed;
  const igMatch = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  if (igMatch) {
    handle = igMatch[1];
  }
  handle = handle.replace(/^@/, "").replace(/\/+$/, "");
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

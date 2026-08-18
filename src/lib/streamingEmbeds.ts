// Converts a normal Spotify/Apple Music share link into that platform's
// official embeddable player URL — same official widget both platforms
// provide for free for exactly this purpose, not audio extraction (which
// would violate both platforms' terms of service and isn't something we
// do anywhere in this codebase).
export function toSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("open.spotify.com")) return null;
    if (u.pathname.startsWith("/embed/")) return url;
    // open.spotify.com/track/ID -> open.spotify.com/embed/track/ID
    return `https://open.spotify.com/embed${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

export function toAppleMusicEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("music.apple.com")) return null;
    // music.apple.com/... -> embed.music.apple.com/... (Apple's own
    // documented embed pattern — swap the subdomain, keep the rest).
    return `https://embed.music.apple.com${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

/** @type {import('next').NextConfig} */
// Baseline security headers on every route. HTTPS + HSTS are already
// enforced by Vercel (http:// 308-redirects to https://, and
// Strict-Transport-Security is set on the custom domain).
//
// No Content-Security-Policy yet on purpose: the site embeds Posh checkout,
// Spotify/Apple Music players, Supabase media and Vercel Analytics, and a
// wrong CSP silently breaks those. Add one in report-only mode first if
// you want to go further.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB request body cap, which silently
      // breaks video uploads. Matches the 50MB validation in
      // src/app/eboard/(protected)/videos/actions.ts, with headroom for
      // multipart/form-data overhead.
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;

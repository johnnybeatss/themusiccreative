/** @type {import('next').NextConfig} */
const nextConfig = {
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

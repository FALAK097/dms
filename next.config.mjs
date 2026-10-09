/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      // Preserve Dropbox's registered callback URL across Better Auth's route change.
      {
        source: "/api/auth/oauth2/callback/:providerId",
        destination: "/api/auth/callback/:providerId",
      },
    ];
  },
};

export default nextConfig;

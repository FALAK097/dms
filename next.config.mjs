import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingExcludes: {
    "*": [
      "node_modules/prisma/**",
      "node_modules/@prisma/engines/**",
      "node_modules/@prisma/engines-version/**",
      "node_modules/wrangler/**",
      "node_modules/@opennextjs/**",
      "node_modules/workerd/**",
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-d1",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
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

initOpenNextCloudflareForDev();

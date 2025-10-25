import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    dropbox: {
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      redirectURI: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/auth/callback/dropbox`,
      accessType: "offline",
      scope: ["account_info.read", "files.metadata.read", "files.content.read"],
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["dropbox"],
    },
  },
});

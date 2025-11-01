import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "dropbox",
          clientId: process.env.DROPBOX_CLIENT_ID,
          clientSecret: process.env.DROPBOX_CLIENT_SECRET,
          authorizationUrl: "https://www.dropbox.com/oauth2/authorize",
          tokenUrl: "https://api.dropbox.com/oauth2/token",
          authorizationUrlParams: {
            token_access_type: "offline",
          },
          redirectURI: `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/api/auth/oauth2/callback/dropbox`,
          accessType: "offline",
          scopes: [
            "account_info.read",
            "files.metadata.read",
            "files.content.read",
          ],
          pkce: true,

          getUserInfo: async (tokens) => {
            try {
              const response = await fetch(
                "https://api.dropboxapi.com/2/users/get_current_account",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                  },
                }
              );

              if (!response.ok) {
                console.error(
                  "Failed to fetch Dropbox user info:",
                  await response.text()
                );
                return null;
              }

              const profile = await response.json();

              return {
                id: profile.account_id,
                email: profile.email,
                name: profile.name.display_name,
                image: profile.profile_photo_url || null,
              };
            } catch (error) {
              console.error("Error in getUserInfo:", error);
              return null;
            }
          },
        },
      ],
    }),
  ],
});

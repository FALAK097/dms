import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "./db";

let _auth = null;

function getAuth() {
  if (_auth) return _auth;

  const socialProviders = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  _auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL:
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://dms.falakgala.dev",
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders,
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
              process.env.NEXT_PUBLIC_APP_URL || "https://dms.falakgala.dev"
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

  return _auth;
}

export const auth = new Proxy(
  function () {},
  {
    get(_target, prop) {
      const instance = getAuth();
      const value = instance[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
    has(_target, prop) {
      const instance = getAuth();
      return prop in instance;
    },
    apply(_target, thisArg, argArray) {
      const instance = getAuth();
      if (typeof instance.handler === "function") {
        return instance.handler(...argArray);
      }
      if (typeof instance === "function") {
        return instance(...argArray);
      }
      return Reflect.apply(instance, thisArg, argArray);
    },
  }
);

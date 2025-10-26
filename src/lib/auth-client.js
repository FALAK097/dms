import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  listAccounts,
  unlinkAccount,
} = authClient;

export const linkDropboxAccount = async (callbackURL = "/settings") => {
  const { data, error } = await authClient.oauth2.link({
    providerId: "dropbox",
    callbackURL,
  });
  return { data, error };
};

export const getLinkedAccounts = async () => {
  const { data, error } = await listAccounts();
  return { data, error };
};

export const unlinkDropboxAccount = async () => {
  const { data, error } = await unlinkAccount({
    providerId: "dropbox",
  });
  return { data, error };
};

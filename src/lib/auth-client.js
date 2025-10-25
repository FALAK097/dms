import { createAuthClient } from "better-auth/react";

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  listAccounts,
  unlinkAccount,
} = createAuthClient();

export const dropboxSignIn = async (callbackURL = "/settings") => {
  const data = await signIn.social({
    provider: "dropbox",
    callbackURL,
  });
  return data;
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

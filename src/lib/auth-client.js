import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  listAccounts,
  unlinkAccount,
} = authClient;

export const linkDropboxAccount = async (callbackURL = "/settings") => {
  const { data, error } = await authClient.linkSocial({
    provider: "dropbox",
    callbackURL,
  });
  return { data, error };
};

export const getLinkedAccounts = async () => {
  try {
    const response = await fetch("/api/accounts");
    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return { data: null, error: error.message };
  }
};

export const unlinkDropboxAccount = async () => {
  const { data, error } = await unlinkAccount({
    providerId: "dropbox",
  });
  return { data, error };
};

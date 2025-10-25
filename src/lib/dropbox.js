import { prisma } from "./db";

export async function getDropboxAccessToken(userId) {
  const dropboxAccount = await prisma.account.findFirst({
    where: {
      userId: userId,
      providerId: "dropbox",
    },
  });

  if (!dropboxAccount) {
    return null;
  }

  const now = new Date();
  const tokenExpired =
    dropboxAccount.accessTokenExpiresAt &&
    new Date(dropboxAccount.accessTokenExpiresAt) < now;

  let accessToken = dropboxAccount.accessToken;

  if (tokenExpired && dropboxAccount.refreshToken) {
    try {
      const tokenResponse = await fetch(
        "https://api.dropbox.com/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: dropboxAccount.refreshToken,
            client_id: process.env.DROPBOX_CLIENT_ID,
            client_secret: process.env.DROPBOX_CLIENT_SECRET,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        console.error("Failed to refresh token:", error);
        throw new Error("Failed to refresh token");
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      const updatedAccount = await prisma.account.update({
        where: { id: dropboxAccount.id },
        data: {
          accessToken: tokenData.access_token,
          accessTokenExpiresAt: new Date(
            Date.now() + tokenData.expires_in * 1000
          ),
          ...(tokenData.refresh_token && {
            refreshToken: tokenData.refresh_token,
          }),
        },
      });

      return { accessToken, account: updatedAccount };
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }

  return { accessToken, account: dropboxAccount };
}

export async function dropboxApiRequest(userId, endpoint, options = {}) {
  const tokenData = await getDropboxAccessToken(userId);

  if (!tokenData) {
    throw new Error("Dropbox not connected");
  }

  const { accessToken } = tokenData;

  const isContentEndpoint =
    endpoint.includes("/download") || endpoint.includes("/upload");
  const baseUrl = isContentEndpoint
    ? "https://content.dropboxapi.com"
    : "https://api.dropboxapi.com";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  return response;
}

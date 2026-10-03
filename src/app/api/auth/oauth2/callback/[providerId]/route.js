import { auth } from "@/lib/auth";

// Dropbox already has this callback URL registered. Forward the legacy path
// to Better Auth 1.7's generic social-provider callback without changing the
// provider-side configuration.
export async function GET(request) {
  const callbackUrl = new URL(request.url);
  callbackUrl.pathname = callbackUrl.pathname.replace(
    "/api/auth/oauth2/callback/",
    "/api/auth/callback/"
  );

  return auth.handler(
    new Request(callbackUrl, {
      method: request.method,
      headers: request.headers,
    })
  );
}

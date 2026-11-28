import { auth } from "@/lib/auth";

const handler = async (request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/oauth2/callback/")) {
    url.pathname = url.pathname.replace(
      "/api/auth/oauth2/callback/",
      "/api/auth/callback/"
    );
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const rewrittenRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      redirect: request.redirect,
      ...(hasBody ? { body: request.body, duplex: "half" } : {}),
    });
    return auth.handler(rewrittenRequest);
  }
  return auth.handler(request);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;

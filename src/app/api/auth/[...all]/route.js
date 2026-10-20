import { auth } from "@/lib/auth";

const handler = async (request) => {
  return auth.handler(request);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;

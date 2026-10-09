import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }
  if (![null, -1, 1].includes(body.feedback)) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }
  const result = await prisma.message.updateMany({
    where: { id, role: "ASSISTANT", conversation: { userId: session.user.id } },
    data: { feedback: body.feedback },
  });
  if (!result.count) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  return NextResponse.json({ feedback: body.feedback });
}

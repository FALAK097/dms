import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const provider = globalThis[Symbol.for("__cloudflare-context__")]?.env?.DB
    ? "d1"
    : "sqlite";

  try {
    await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      provider,
      latencyMs: Date.now() - start,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        provider,
      },
      { status: 503 }
    );
  }
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePresignedDownloadUrl } from "@/lib/storage";
import { rateLimit, auditLog } from "@/lib/upstash/redis";

const DOWNLOAD_RATE_LIMIT = 50;
const DOWNLOAD_RATE_WINDOW = 300;

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      `download:${session.user.id}`,
      DOWNLOAD_RATE_LIMIT,
      DOWNLOAD_RATE_WINDOW
    );

    if (!rateLimitResult.success) {
      await auditLog("rate_limit_exceeded", {
        userId: session.user.id,
        action: "download_url_request",
        remaining: rateLimitResult.remaining,
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.reset.toString(),
            "X-RateLimit-Limit": DOWNLOAD_RATE_LIMIT.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.userId !== session.user.id) {
      await auditLog("unauthorized_download_attempt", {
        userId: session.user.id,
        documentId,
        ownerId: document.userId,
      });

      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const downloadUrl = await generatePresignedDownloadUrl(document.key, 300);

    await auditLog("download_url_generated", {
      userId: session.user.id,
      documentId,
      fileName: document.name,
    });

    return NextResponse.json(
      {
        downloadUrl,
        expiresIn: 300,
      },
      {
        headers: {
          "X-RateLimit-Limit": DOWNLOAD_RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Download URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL", details: error.message },
      { status: 500 }
    );
  }
}

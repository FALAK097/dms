import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  generateDocumentKey,
  generatePresignedUploadUrl,
  getCdnUrl,
} from "@/lib/storage";
import { prisma } from "@/lib/db";
import { rateLimit, auditLog } from "@/lib/upstash/redis";

const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_RATE_WINDOW = 300;

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      `upload:${session.user.id}`,
      UPLOAD_RATE_LIMIT,
      UPLOAD_RATE_WINDOW
    );

    if (!rateLimitResult.success) {
      await auditLog("rate_limit_exceeded", {
        userId: session.user.id,
        action: "upload_url_request",
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
            "X-RateLimit-Limit": UPLOAD_RATE_LIMIT.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, contentHash } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    if (contentHash) {
      const existingDocument = await prisma.document.findFirst({
        where: {
          contentHash,
          userId: session.user.id,
        },
      });

      if (existingDocument) {
        return NextResponse.json({
          duplicate: true,
          document: existingDocument,
          message: "Document already exists",
        });
      }
    }

    if (fileType !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of 500MB` },
        { status: 400 }
      );
    }

    if (fileName.length > 255) {
      return NextResponse.json({ error: "Filename too long" }, { status: 400 });
    }

    const key = generateDocumentKey(session.user.id, fileName);

    const presignedUrl = await generatePresignedUploadUrl(key, fileType, 300);

    await auditLog("upload_url_generated", {
      userId: session.user.id,
      fileName,
      fileSize,
      key,
    });

    return NextResponse.json(
      {
        presignedUrl,
        key,
        publicUrl: getCdnUrl(key),
        fileName,
        fileType,
        fileSize,
        contentHash,
      },
      {
        headers: {
          "X-RateLimit-Limit": UPLOAD_RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  generateDocumentKey,
  generatePresignedUploadUrl,
  getCdnUrl,
} from "@/lib/storage";
import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl: getCdnUrl(key),
      fileName,
      fileType,
      fileSize,
      contentHash,
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma, isUniqueConstraintError } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";
import { uploadToR2, deleteFromR2, generateDocumentKey } from "@/lib/storage";
import {
  publishOCRProcessingJob,
  verifyInternalJobRequest,
} from "@/lib/cloudflare/jobs";

const MAX_DROPBOX_FILE_BYTES = 50 * 1024 * 1024;

export async function POST(request) {
  try {
    if (!verifyInternalJobRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { userId, fileEntry } = body;

    if (
      !userId ||
      !fileEntry ||
      typeof fileEntry.name !== "string" ||
      !fileEntry.name.trim() ||
      fileEntry.name.length > 255
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const dotIndex = fileEntry.name.lastIndexOf(".");
    const fileExtension =
      dotIndex >= 0 ? fileEntry.name.substring(dotIndex).toLowerCase() : "";

    if (fileExtension !== ".pdf") {
      console.log(`⏭️  Skipping non-PDF file: ${fileEntry.name}`);
      return NextResponse.json({
        success: true,
        message: "Skipped non-PDF file",
      });
    }

    if (
      Number.isFinite(fileEntry.size) &&
      fileEntry.size > MAX_DROPBOX_FILE_BYTES
    ) {
      console.log(`⏭️  Skipping oversized file: ${fileEntry.name}`);
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Skipped oversized file",
      });
    }

    const contentHash = fileEntry.content_hash || null;
    if (contentHash) {
      const existingDoc = await prisma.document.findFirst({
        where: {
          userId: userId,
          contentHash: contentHash,
        },
      });

      if (existingDoc) {
        console.log(`⏭️  Skipping duplicate file: ${fileEntry.name}`);
        return NextResponse.json({
          success: true,
          message: "Duplicate file skipped",
        });
      }
    }

    console.log(`⬇️  Downloading from Dropbox: ${fileEntry.name}`);
    const downloadResponse = await dropboxApiRequest(
      userId,
      "/2/files/download",
      {
        method: "POST",
        headers: {
          "Dropbox-API-Arg": JSON.stringify({
            path: fileEntry.path_display,
          }),
        },
      }
    );

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text().catch(() => "");
      console.error(
        `Failed to download file from Dropbox: ${downloadResponse.status} ${errorText}`
      );
      return NextResponse.json(
        { error: `Failed to download file from Dropbox: ${downloadResponse.status}` },
        { status: 500 }
      );
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    if (
      fileBuffer.byteLength <= 0 ||
      fileBuffer.byteLength > MAX_DROPBOX_FILE_BYTES
    ) {
      console.log(`⏭️  Skipping invalid/oversized file: ${fileEntry.name}`);
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Skipped oversized file",
      });
    }

    const key = generateDocumentKey(userId, fileEntry.name);

    const file = {
      arrayBuffer: async () => fileBuffer,
      type: "application/pdf",
    };

    const url = await uploadToR2(file, key);

    let document;
    try {
      document = await prisma.document.create({
        data: {
          name: fileEntry.name,
          size: Number.isFinite(fileEntry.size)
            ? fileEntry.size
            : fileBuffer.byteLength,
          type: "application/pdf",
          key: key,
          url: url,
          userId: userId,
          contentHash: contentHash,
          status: "PROCESSING",
          processingStartedAt: new Date(),
        },
      });
    } catch (dbError) {
      await deleteFromR2(key).catch((e) =>
        console.error("Failed to cleanup R2 object:", e)
      );
      if (isUniqueConstraintError(dbError) && contentHash) {
        return NextResponse.json({
          success: true,
          message: "Duplicate file skipped",
        });
      }
      throw dbError;
    }

    const ocrJobResult = await publishOCRProcessingJob(document.id, userId);

    if (ocrJobResult.success) {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          backgroundJobId: ocrJobResult.jobId,
        },
      });
    } else {
      console.error(`❌ Failed to publish OCR job for: ${fileEntry.name}`);
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "FAILED",
          embeddingsError: "Failed to queue OCR processing",
          lastError: ocrJobResult.error,
        },
      });
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      message: `File ${fileEntry.name} processed successfully`,
    });
  } catch (error) {
    console.error("Error in process-file worker:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";
import { uploadToSpaces, generateDocumentKey } from "@/lib/storage";
import {
  publishOCRProcessingJob,
  verifyInternalJobRequest,
} from "@/lib/cloudflare/jobs";

export async function POST(request) {
  try {
    if (!verifyInternalJobRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, fileEntry, source } = body;

    if (!userId || !fileEntry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fileExtension = fileEntry.name
      .substring(fileEntry.name.lastIndexOf("."))
      .toLowerCase();

    if (fileExtension !== ".pdf") {
      console.log(`⏭️  Skipping non-PDF file: ${fileEntry.name}`);
      return NextResponse.json({
        success: true,
        message: "Skipped non-PDF file",
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
      const error = `Failed to download file from Dropbox: ${downloadResponse.status}`;
      console.error(error);
      return NextResponse.json(
        { error, details: await downloadResponse.text() },
        { status: 500 }
      );
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    const key = generateDocumentKey(userId, fileEntry.name);

    const file = {
      arrayBuffer: async () => fileBuffer,
      type: "application/pdf",
    };

    const url = await uploadToSpaces(file, key);

    const document = await prisma.document.create({
      data: {
        name: fileEntry.name,
        size: fileEntry.size,
        type: "application/pdf",
        key: key,
        url: url,
        userId: userId,
        contentHash: contentHash,
        status: "PROCESSING",
        processingStartedAt: new Date(),
      },
    });

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
      {
        error: "Processing failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/ocr";
import { upsertEmbeddings } from "@/lib/upstash/vector";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyQStashSignature } from "@/lib/upstash/qstash";
import { generatePresignedDownloadUrl } from "@/lib/storage";

export async function POST(request) {
  let documentId;
  let isQStashRequest = false;

  try {
    const headersList = await headers();
    const qstashSignature = headersList.get("upstash-signature");

    let body;
    if (qstashSignature) {
      isQStashRequest = true;
      const verification = await verifyQStashSignature(request);
      if (!verification.valid) {
        console.error("Invalid QStash signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
      body = verification.body;
    } else {
      const session = await auth.api.getSession({
        headers: headersList,
      });

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      body = await request.json();
    }

    documentId = body.documentId;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
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

    if (!isQStashRequest) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (document.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "PROCESSING",
        retryCount: { increment: 1 },
      },
    });

    const downloadUrl = await generatePresignedDownloadUrl(document.key, 3600);

    let response;
    let retries = 3;
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        response = await fetch(downloadUrl, {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          break;
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;

        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      } catch (fetchError) {
        lastError = fetchError.message;
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to download document from storage: ${lastError}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await extractTextFromPDF(buffer);

    if (!result.success) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          embeddingsError: result.error || "Text extraction failed",
          lastError: result.error,
        },
      });

      return NextResponse.json(
        {
          error: "Failed to extract text from document",
          documentId: documentId,
          documentName: document.name,
          details: result.error,
        },
        { status: 500 }
      );
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText: result.text,
      },
    });

    const embeddingResult = await upsertEmbeddings(
      documentId,
      result.text,
      document.name,
      document.userId
    );

    if (!embeddingResult.success) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          embeddingsError:
            embeddingResult.error || "Embeddings generation failed",
          lastError: embeddingResult.error,
        },
      });

      return NextResponse.json(
        {
          error: "Failed to generate embeddings",
          documentId: documentId,
          documentName: document.name,
          details: embeddingResult.error,
        },
        { status: 500 }
      );
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "READY",
        embeddingsDone: true,
        chunkCount: embeddingResult.chunkCount,
        embeddingsError: null,
        processingCompletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document processed successfully",
      method: result.method,
      documentId: documentId,
      documentName: document.name,
      embeddingsDone: true,
      chunkCount: embeddingResult.chunkCount,
    });
  } catch (error) {
    console.error("Error processing document:", error);

    if (documentId) {
      try {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: "FAILED",
            embeddingsError: error.message || "Unknown error occurred",
            lastError: error.message,
          },
        });
      } catch (updateError) {
        console.error("Failed to update document status:", updateError);
      }
    }

    return NextResponse.json(
      { error: "Failed to process document", details: error.message },
      { status: 500 }
    );
  }
}

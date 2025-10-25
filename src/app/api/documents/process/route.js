import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/ocr";
import { upsertEmbeddings } from "@/lib/upstash/vector";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await request.json();

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

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    const response = await fetch(document.url);
    if (!response.ok) {
      throw new Error("Failed to download document from storage");
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
    return NextResponse.json(
      { error: "Failed to process document", details: error.message },
      { status: 500 }
    );
  }
}

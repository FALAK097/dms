import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/ocr";

export async function POST(request) {
  try {
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

    if (result.success) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          extractedText: result.text,
          status: "READY",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Document processed successfully",
        method: result.method,
        documentId: documentId,
        documentName: document.name,
      });
    } else {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error: "Failed to extract text from document",
          documentId: documentId,
          documentName: document.name,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Failed to process document", details: error.message },
      { status: 500 }
    );
  }
}

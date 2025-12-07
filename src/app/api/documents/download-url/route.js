import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePresignedDownloadUrl } from "@/lib/storage";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const downloadUrl = await generatePresignedDownloadUrl(document.key, 300);

    return NextResponse.json({
      downloadUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Download URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL", details: error.message },
      { status: 500 }
    );
  }
}

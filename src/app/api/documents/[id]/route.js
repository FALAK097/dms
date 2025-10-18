import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFromSpaces } from "@/lib/storage";
import { vectorIndex } from "@/lib/upstash/vector";

export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
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

    await deleteFromSpaces(document.key);

    if (document.embeddingsDone && document.chunkCount > 0) {
      try {
        const vectorIds = Array.from(
          { length: document.chunkCount },
          (_, i) => `${id}-${i}`
        );
        await vectorIndex.delete(vectorIds);
      } catch (vectorError) {
        console.error("Failed to delete vectors:", vectorError);
      }
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

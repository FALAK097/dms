import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validPage - 1) * validLimit;

    const where = {
      userId: session.user.id,
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive",
        },
      }),
    };

    const totalCount = await prisma.document.count({ where });

    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: sortOrder === "asc" ? "asc" : "desc",
      },
      select: {
        id: true,
        name: true,
        size: true,
        type: true,
        url: true,
        status: true,
        extractedText: true,
        embeddingsDone: true,
        embeddingsError: true,
        chunkCount: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: validLimit,
    });

    return NextResponse.json({
      documents,
      pagination: {
        total: totalCount,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(totalCount / validLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

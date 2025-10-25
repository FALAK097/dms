import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";
import { processNewFile } from "@/lib/dropbox-sync";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dropboxAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "dropbox",
      },
    });

    if (!dropboxAccount) {
      return NextResponse.json(
        { error: "Dropbox not connected" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dropboxWebhookCursor: true },
    });

    let cursor = user?.dropboxWebhookCursor || null;
    let newFilesCount = 0;
    let hasMore = true;

    while (hasMore) {
      let result;

      if (cursor) {
        const response = await dropboxApiRequest(
          session.user.id,
          "/2/files/list_folder/continue",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cursor: cursor,
            }),
          }
        );
        result = await response.json();
      } else {
        const response = await dropboxApiRequest(
          session.user.id,
          "/2/files/list_folder",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: "",
              recursive: true,
              include_deleted: false,
            }),
          }
        );
        result = await response.json();
      }

      for (const entry of result.entries) {
        if (entry[".tag"] === "file") {
          const processed = await processNewFile(session.user.id, entry);
          if (processed) newFilesCount++;
        }
      }

      cursor = result.cursor;

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          dropboxWebhookCursor: cursor,
          dropboxCursorUpdatedAt: new Date(),
        },
      });

      hasMore = result.has_more;
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${newFilesCount} new file(s) imported.`,
      newFilesCount,
    });
  } catch (error) {
    console.error("Manual sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error.message },
      { status: 500 }
    );
  }
}

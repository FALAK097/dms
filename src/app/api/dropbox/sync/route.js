import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";
import { publishBatchFileProcessingJobs } from "@/lib/cloudflare/jobs";

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

    if (!dropboxAccount.syncFolderId) {
      return NextResponse.json(
        { error: "Please select a folder to sync" },
        { status: 400 }
      );
    }

    let syncPath = "";
    const metadataResponse = await dropboxApiRequest(
      session.user.id,
      "/2/files/get_metadata",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: dropboxAccount.syncFolderId,
          include_deleted: false,
        }),
      }
    );

    if (!metadataResponse.ok) {
      console.error("Failed to get folder metadata");
      return NextResponse.json(
        { error: "Failed to access selected folder" },
        { status: 400 }
      );
    }

    const metadata = await metadataResponse.json();
    syncPath = metadata.path_display;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dropboxWebhookCursor: true },
    });

    let cursor = null;
    const filesToProcess = [];
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
              path: syncPath,
              recursive: true,
              include_deleted: false,
            }),
          }
        );
        result = await response.json();
      }

      for (const entry of result.entries) {
        if (entry[".tag"] === "file") {
          filesToProcess.push(entry);
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

    if (filesToProcess.length > 0) {
      const queueResult = await publishBatchFileProcessingJobs(
        session.user.id,
        filesToProcess,
        { source: "manual_sync" }
      );

      return NextResponse.json({
        success: true,
        message: `${queueResult.queuedCount} file(s) queued for processing. They will appear in your dashboard shortly.`,
        queuedCount: queueResult.queuedCount,
        failedCount: queueResult.failedCount,
      });
    } else {
      console.log("ℹ️  No new files to sync");
      return NextResponse.json({
        success: true,
        message: "No new files to sync.",
        queuedCount: 0,
        failedCount: 0,
      });
    }
  } catch (error) {
    console.error("Manual sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error.message },
      { status: 500 }
    );
  }
}

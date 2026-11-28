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

    let cursor = user?.dropboxWebhookCursor || null;
    let latestCursor = null;
    let cursorResetAttempted = false;
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
            body: JSON.stringify({ cursor }),
          }
        );

        if (!response.ok) {
          if (cursorResetAttempted) {
            throw new Error(
              `Dropbox list_folder/continue failed (${response.status}): ${await response.text()}`
            );
          }
          console.log("Sync cursor invalid, reinitializing...");
          cursor = null;
          cursorResetAttempted = true;
          continue;
        }

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

        if (!response.ok) {
          throw new Error(
            `Dropbox list_folder failed (${response.status}): ${await response.text()}`
          );
        }

        result = await response.json();
      }

      for (const entry of result.entries || []) {
        if (entry[".tag"] === "file") {
          filesToProcess.push(entry);
        }
      }

      cursor = result.cursor;
      latestCursor = result.cursor;
      hasMore = Boolean(result.has_more);
    }

    if (filesToProcess.length > 0) {
      const queueResult = await publishBatchFileProcessingJobs(
        session.user.id,
        filesToProcess,
        { source: "manual_sync" }
      );

      if (queueResult.failedCount > 0) {
        console.error(
          `Dropbox manual sync failed to queue ${queueResult.failedCount} file(s); cursor not advanced`
        );
        return NextResponse.json(
          {
            success: false,
            error: "Some files failed to queue for processing. Please retry sync.",
            queuedCount: queueResult.queuedCount,
            failedCount: queueResult.failedCount,
          },
          { status: 502 }
        );
      }

      if (latestCursor) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            dropboxWebhookCursor: latestCursor,
            dropboxCursorUpdatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `${queueResult.queuedCount} file(s) queued for processing. They will appear in your dashboard shortly.`,
        queuedCount: queueResult.queuedCount,
        failedCount: queueResult.failedCount,
      });
    }

    if (latestCursor) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          dropboxWebhookCursor: latestCursor,
          dropboxCursorUpdatedAt: new Date(),
        },
      });
    }

    console.log("ℹ️  No new files to sync");
    return NextResponse.json({
      success: true,
      message: "No new files to sync.",
      queuedCount: 0,
      failedCount: 0,
    });
  } catch (error) {
    console.error("Manual sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

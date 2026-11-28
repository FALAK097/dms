import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";
import { publishBatchFileProcessingJobs } from "@/lib/cloudflare/jobs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get("challenge");

    if (!challenge) {
      return NextResponse.json(
        { error: "Missing challenge parameter" },
        { status: 400 }
      );
    }

    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Webhook verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const secret = process.env.DROPBOX_CLIENT_SECRET;
    if (!secret) {
      console.error("DROPBOX_CLIENT_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const headersList = await headers();
    const signature = headersList.get("x-dropbox-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const body = await request.text();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (payload.list_folder && Array.isArray(payload.list_folder.accounts)) {
      const accounts = payload.list_folder.accounts;

      await Promise.all(
        accounts.map(async (dropboxAccountId) => {
          try {
            await processDropboxChanges(dropboxAccountId);
          } catch (error) {
            console.error(
              `Error processing changes for account ${dropboxAccountId}:`,
              error
            );
          }
        })
      );
    }

    return new NextResponse("", { status: 200 });
  } catch (error) {
    console.error("Webhook notification error:", error);
    return new NextResponse("", { status: 200 });
  }
}

async function processDropboxChanges(dropboxAccountId) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        accountId: dropboxAccountId,
        providerId: "dropbox",
      },
      include: {
        user: true,
      },
    });

    if (!account) {
      console.log(`No account found for Dropbox ID: ${dropboxAccountId}`);
      return;
    }

    let syncPath = "";
    if (account.syncFolderId) {
      const metadataResponse = await dropboxApiRequest(
        account.userId,
        "/2/files/get_metadata",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: account.syncFolderId,
            include_deleted: false,
          }),
        }
      );

      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        syncPath = metadata.path_display;
      } else {
        console.error("Failed to get folder metadata for webhook");
        return;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: account.userId },
      select: { dropboxWebhookCursor: true },
    });

    let cursor = user?.dropboxWebhookCursor || null;
    let latestCursor = null;
    let cursorResetAttempted = false;
    let hasMore = true;
    const filesToProcess = [];

    while (hasMore) {
      let result;

      if (cursor) {
        const response = await dropboxApiRequest(
          account.userId,
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
          console.log("Cursor invalid, reinitializing...");
          cursor = null;
          cursorResetAttempted = true;
          continue;
        }

        result = await response.json();
      } else {
        const response = await dropboxApiRequest(
          account.userId,
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
        account.userId,
        filesToProcess,
        {
          source: "webhook",
        }
      );

      if (queueResult.failedCount > 0) {
        console.error(
          `Webhook failed to queue ${queueResult.failedCount} file(s) for user ${account.userId}; cursor not advanced`
        );
        return;
      }
    } else {
      console.log("ℹ️  No new files to process");
    }

    if (latestCursor) {
      await prisma.user.update({
        where: { id: account.userId },
        data: {
          dropboxWebhookCursor: latestCursor,
          dropboxCursorUpdatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Error in processDropboxChanges:", error);
    throw error;
  }
}

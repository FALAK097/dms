import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";
import { processNewFile } from "@/lib/dropbox-sync";

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
    const headersList = await headers();
    const signature = headersList.get("x-dropbox-signature");
    const body = await request.text();

    if (signature && process.env.DROPBOX_CLIENT_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.DROPBOX_CLIENT_SECRET)
        .update(body)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )
      ) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    const payload = JSON.parse(body);

    if (payload.list_folder && payload.list_folder.accounts) {
      const accounts = payload.list_folder.accounts;

      for (const dropboxAccountId of accounts) {
        processDropboxChanges(dropboxAccountId).catch((error) => {
          console.error(
            `Error processing changes for account ${dropboxAccountId}:`,
            error
          );
        });
      }
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
    let hasMore = true;

    if (!cursor || account.syncFolderId) {
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

      const result = await response.json();

      for (const entry of result.entries) {
        if (entry[".tag"] === "file") {
          await processNewFile(account.userId, entry);
        } else if (entry[".tag"] === "deleted") {
          console.log(`File deleted: ${entry.path_display}`);
        }
      }

      cursor = result.cursor;

      await prisma.user.update({
        where: { id: account.userId },
        data: {
          dropboxWebhookCursor: cursor,
          dropboxCursorUpdatedAt: new Date(),
        },
      });

      hasMore = result.has_more;
    }

    while (hasMore) {
      const response = await dropboxApiRequest(
        account.userId,
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

      const result = await response.json();

      for (const entry of result.entries) {
        if (entry[".tag"] === "file") {
          await processNewFile(account.userId, entry);
        } else if (entry[".tag"] === "deleted") {
          console.log(`File deleted: ${entry.path_display}`);
        }
      }

      cursor = result.cursor;

      await prisma.user.update({
        where: { id: account.userId },
        data: {
          dropboxWebhookCursor: cursor,
          dropboxCursorUpdatedAt: new Date(),
        },
      });

      hasMore = result.has_more;
    }
  } catch (error) {
    console.error("Error in processDropboxChanges:", error);
    throw error;
  }
}

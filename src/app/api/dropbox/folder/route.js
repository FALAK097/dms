import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dropboxApiRequest } from "@/lib/dropbox";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json(
        { error: "Folder path is required" },
        { status: 400 }
      );
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

    try {
      const metadataResponse = await dropboxApiRequest(
        session.user.id,
        "/2/files/get_metadata",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: folderPath,
            include_deleted: false,
          }),
        }
      );

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        console.error("Failed to get folder metadata:", {
          folderPath,
          errorData,
        });
        return NextResponse.json(
          {
            error: "Folder not found or inaccessible",
            details: errorData?.error_summary || "Unknown error",
          },
          { status: 400 }
        );
      }

      const metadata = await metadataResponse.json();

      if (metadata[".tag"] !== "folder") {
        return NextResponse.json(
          { error: "Selected path is not a folder" },
          { status: 400 }
        );
      }

      await prisma.account.update({
        where: { id: dropboxAccount.id },
        data: {
          syncFolderId: metadata.path_display || folderPath,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Folder selected successfully",
        folderName: metadata.name,
        folderPath: metadata.path_display,
      });
    } catch (error) {
      console.error("Error validating folder:", error);
      return NextResponse.json(
        { error: "Failed to validate folder", details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving folder:", error);
    return NextResponse.json(
      { error: "Failed to save folder" },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/storage";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "No files data provided" },
        { status: 400 }
      );
    }

    if (files.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 files per request" },
        { status: 400 }
      );
    }

    const createdDocuments = [];
    const failedFiles = [];

    for (const fileData of files) {
      const { key, publicUrl, fileName, fileType, fileSize, contentHash } =
        fileData;

      if (!key || !publicUrl || !fileName) {
        console.error("Invalid file data:", fileData);
        failedFiles.push({ fileName, reason: "Missing required fields" });
        continue;
      }

      const expectedPrefix = `documents/${session.user.id}/`;
      if (!key.startsWith(expectedPrefix)) {
        console.error(
          `Security violation: User ${session.user.id} attempted to confirm file with key: ${key}`
        );
        failedFiles.push({ fileName, reason: "Unauthorized key" });
        continue;
      }

      if (fileType !== "application/pdf") {
        failedFiles.push({ fileName, reason: "Invalid file type" });
        continue;
      }

      try {
        const headCommand = new HeadObjectCommand({
          Bucket: process.env.DO_SPACES_NAME,
          Key: key,
        });

        const headResult = await s3Client.send(headCommand);

        if (
          fileSize &&
          headResult.ContentLength &&
          Math.abs(headResult.ContentLength - fileSize) > 1000
        ) {
          console.warn(
            `File size mismatch for ${fileName}: expected ${fileSize}, got ${headResult.ContentLength}`
          );
        }
      } catch (storageError) {
        console.error(`File not found in storage: ${key}`, storageError);
        failedFiles.push({ fileName, reason: "File not found in storage" });
        continue;
      }

      try {
        const document = await prisma.document.create({
          data: {
            name: fileName,
            size: fileSize || 0,
            type: fileType || "application/pdf",
            key,
            url: publicUrl,
            contentHash: contentHash || null,
            userId: session.user.id,
          },
        });

        createdDocuments.push(document);
      } catch (dbError) {
        console.error(`Failed to create document ${fileName}:`, dbError);
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      documents: createdDocuments,
      count: createdDocuments.length,
      failed: failedFiles.length > 0 ? failedFiles : undefined,
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    return NextResponse.json(
      { error: "Failed to confirm uploads", details: error.message },
      { status: 500 }
    );
  }
}

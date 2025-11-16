import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyObjectExists } from "@/lib/storage";
import { publishOCRProcessingJob } from "@/lib/upstash/qstash";
import { auditLog } from "@/lib/upstash/redis";

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

      const expectedPrefix = `uploads/${session.user.id}/`;
      if (!key.startsWith(expectedPrefix)) {
        console.error(
          `Security violation: User ${session.user.id} attempted to confirm file with key: ${key}`
        );

        await auditLog("security_violation", {
          userId: session.user.id,
          attemptedKey: key,
          fileName,
        });

        failedFiles.push({ fileName, reason: "Unauthorized key" });
        continue;
      }

      if (fileType !== "application/pdf") {
        failedFiles.push({ fileName, reason: "Invalid file type" });
        continue;
      }

      try {
        const verification = await verifyObjectExists(key);

        if (!verification.exists) {
          console.error(`File not found in storage: ${key}`);
          failedFiles.push({ fileName, reason: "File not found in storage" });
          continue;
        }

        if (
          fileSize &&
          verification.size &&
          Math.abs(verification.size - fileSize) > 1000
        ) {
          console.warn(
            `File size mismatch for ${fileName}: expected ${fileSize}, got ${verification.size}`
          );
        }
      } catch (storageError) {
        console.error(`Storage verification failed: ${key}`, storageError);
        failedFiles.push({ fileName, reason: "Storage verification failed" });
        continue;
      }

      try {
        const document = await prisma.document.create({
          data: {
            name: fileName,
            size: fileSize || 0,
            type: fileType || "application/pdf",
            key,
            url: key,
            contentHash: contentHash || null,
            userId: session.user.id,
            status: "PENDING",
          },
        });

        const isDevelopment = process.env.NODE_ENV === "development";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        const isLocalhost =
          baseUrl &&
          (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"));

        if (isDevelopment || isLocalhost) {
          console.log(
            `[DEV] Skipping QStash for document ${document.id} - processing directly`
          );

          await prisma.document.update({
            where: { id: document.id },
            data: {
              status: "PENDING",
            },
          });

          await auditLog("document_uploaded", {
            userId: session.user.id,
            documentId: document.id,
            fileName,
            fileSize,
            processingMode: "direct",
          });
        } else {
          const qstashResult = await publishOCRProcessingJob(
            document.id,
            session.user.id
          );

          if (qstashResult.success) {
            await prisma.document.update({
              where: { id: document.id },
              data: {
                qstashMessageId: qstashResult.messageId,
                status: "PROCESSING",
                processingStartedAt: new Date(),
              },
            });

            await auditLog("document_uploaded", {
              userId: session.user.id,
              documentId: document.id,
              fileName,
              fileSize,
              qstashMessageId: qstashResult.messageId,
            });
          } else {
            console.error(
              `Failed to enqueue processing for document ${document.id}`
            );
            await prisma.document.update({
              where: { id: document.id },
              data: {
                status: "FAILED",
                embeddingsError: "Failed to queue processing job",
              },
            });
          }
        }

        createdDocuments.push(document);
      } catch (dbError) {
        console.error(`Failed to create document ${fileName}:`, dbError);
        failedFiles.push({ fileName, reason: "Database error" });
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

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToR2, generateDocumentKey } from "@/lib/storage";

const MAX_FILES_PER_REQUEST = 50;
const MAX_DIRECT_UPLOAD_BYTES = 50 * 1024 * 1024;

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} files per request` },
        { status: 400 }
      );
    }

    const uploadedDocuments = [];

    for (const file of files) {
      if (!file || typeof file.name !== "string" || !file.name) continue;

      const fileName = file.name.split("/").pop().split("\\").pop();
      if (!fileName || fileName.length > 255) {
        return NextResponse.json(
          { error: "Invalid or overly long filename" },
          { status: 400 }
        );
      }

      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are allowed" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_DIRECT_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "File size exceeds direct upload limit of 50MB" },
          { status: 400 }
        );
      }

      const key = generateDocumentKey(session.user.id, fileName);

      try {
        const url = await uploadToR2(file, key);

        const document = await prisma.document.create({
          data: {
            name: fileName,
            size: file.size,
            type: file.type,
            key,
            url,
            userId: session.user.id,
          },
        });

        uploadedDocuments.push(document);
      } catch (uploadError) {
        console.error(`Failed to upload ${fileName}:`, uploadError);
        throw uploadError;
      }
    }

    return NextResponse.json({
      success: true,
      documents: uploadedDocuments,
      count: uploadedDocuments.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files", details: error.message },
      { status: 500 }
    );
  }
}

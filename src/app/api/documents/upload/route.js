import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToR2, deleteFromR2, generateDocumentKey } from "@/lib/storage";

const MAX_FILES_PER_REQUEST = 50;
const MAX_DIRECT_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = MAX_DIRECT_UPLOAD_BYTES + 1024 * 1024;

async function readBoundedFormData(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return {
      error: NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      ),
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_TOTAL_UPLOAD_BYTES) {
      return {
        error: NextResponse.json(
          { error: "Upload payload exceeds maximum size of 50MB" },
          { status: 413 }
        ),
      };
    }
  }

  if (!request.body) {
    return {
      error: NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      ),
    };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      await reader.cancel().catch(() => {});
      return {
        error: NextResponse.json(
          { error: "Upload payload exceeds maximum size of 50MB" },
          { status: 413 }
        ),
      };
    }
    chunks.push(value);
  }

  const bodyBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const formData = await new Response(bodyBuffer, {
      headers: { "content-type": contentType },
    }).formData();
    return { formData };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid multipart form data" },
        { status: 400 }
      ),
    };
  }
}

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formData, error: formError } = await readBoundedFormData(request);
    if (formError) {
      return formError;
    }

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

    const validatedFiles = [];
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

      if (
        !Number.isFinite(file.size) ||
        file.size <= 0 ||
        file.size > MAX_DIRECT_UPLOAD_BYTES
      ) {
        return NextResponse.json(
          { error: "File size exceeds direct upload limit of 50MB" },
          { status: 400 }
        );
      }

      validatedFiles.push({ file, fileName });
    }

    if (validatedFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedDocuments = [];

    for (const { file, fileName } of validatedFiles) {
      const key = generateDocumentKey(session.user.id, fileName);

      try {
        const url = await uploadToR2(file, key);

        try {
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
        } catch (dbError) {
          await deleteFromR2(key).catch((e) =>
            console.error("Failed to cleanup R2 object:", e)
          );
          throw dbError;
        }
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
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}

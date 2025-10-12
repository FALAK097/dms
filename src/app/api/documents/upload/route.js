import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToSpaces, generateDocumentKey } from "@/lib/storage";

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

    const uploadedDocuments = [];

    for (const file of files) {
      if (!file || !file.name) continue;

      const fileName = file.name.split("/").pop().split("\\").pop();

      const key = generateDocumentKey(session.user.id, fileName);

      try {
        const url = await uploadToSpaces(file, key);

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

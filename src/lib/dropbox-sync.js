import { prisma } from "./db";
import { dropboxApiRequest } from "./dropbox";
import { uploadToSpaces, generateDocumentKey } from "./storage";
import { extractTextFromPDF } from "./ocr";
import { upsertEmbeddings } from "./upstash/vector";

export async function processNewFile(userId, fileEntry) {
  try {
    const fileExtension = fileEntry.name
      .substring(fileEntry.name.lastIndexOf("."))
      .toLowerCase();

    if (fileExtension !== ".pdf") {
      return false;
    }

    const contentHash = fileEntry.content_hash || null;

    if (contentHash) {
      const existingDoc = await prisma.document.findFirst({
        where: {
          userId: userId,
          contentHash: contentHash,
        },
      });

      if (existingDoc) {
        return false;
      }
    }

    const downloadResponse = await dropboxApiRequest(
      userId,
      "/2/files/download",
      {
        method: "POST",
        headers: {
          "Dropbox-API-Arg": JSON.stringify({
            path: fileEntry.path_display,
          }),
        },
      }
    );

    if (!downloadResponse.ok) {
      console.error(`Failed to download file: ${fileEntry.name}`);
      return false;
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const key = generateDocumentKey(userId, fileEntry.name);

    const file = {
      arrayBuffer: async () => fileBuffer,
      type: "application/pdf",
    };

    const url = await uploadToSpaces(file, key);

    const document = await prisma.document.create({
      data: {
        name: fileEntry.name,
        size: fileEntry.size,
        type: "application/pdf",
        key: key,
        url: url,
        userId: userId,
        contentHash: contentHash,
        status: "PROCESSING",
      },
    });

    try {
      const result = await extractTextFromPDF(buffer);

      if (!result.success) {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            status: "FAILED",
            embeddingsError: result.error || "Text extraction failed",
          },
        });
        return false;
      }

      await prisma.document.update({
        where: { id: document.id },
        data: {
          extractedText: result.text,
        },
      });

      const embeddingResult = await upsertEmbeddings(
        document.id,
        result.text,
        document.name,
        userId
      );

      if (!embeddingResult.success) {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            status: "FAILED",
            embeddingsError:
              embeddingResult.error || "Embeddings generation failed",
          },
        });
        return false;
      }

      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "READY",
          embeddingsDone: true,
          chunkCount: embeddingResult.chunkCount,
          embeddingsError: null,
        },
      });

      return true;
    } catch (processingError) {
      console.error(`Error processing document:`, processingError);
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "FAILED",
          embeddingsError: processingError.message || "Processing failed",
        },
      });
      return false;
    }
  } catch (error) {
    console.error(`Error processing file ${fileEntry.name}:`, error);
    return false;
  }
}

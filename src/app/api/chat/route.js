import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findRelevantContent } from "@/lib/upstash/vector";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

function loadPrompts() {
  const promptsPath = path.join(process.cwd(), "src/config/prompts.yml");
  const fileContents = fs.readFileSync(promptsPath, "utf8");
  return yaml.load(fileContents);
}

function buildRAGPrompt(userMessage, contextChunks, documentName, prompts) {
  if (contextChunks.length === 0) {
    return prompts.no_context_response;
  }

  const chunksText = contextChunks
    .map((chunk, i) =>
      prompts.chunk_template
        .replace("{index}", i + 1)
        .replace("{content}", chunk.content)
    )
    .join("\n\n");

  const contextSection = prompts.context_template
    .replace("{documentName}", documentName || "your documents")
    .replace("{chunks}", chunksText);

  const systemPrompt = documentName
    ? prompts.system.document_chat
    : prompts.system.global_chat;

  return `${systemPrompt}\n\n${contextSection}\n\nUser Question: ${userMessage}\n\nAnswer:`;
}

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, docId } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.parts?.[0]?.text || lastMessage.content;

    if (docId) {
      const document = await prisma.document.findUnique({
        where: { id: docId },
        select: {
          userId: true,
          status: true,
          embeddingsDone: true,
          name: true,
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      if (document.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (document.status !== "READY" || !document.embeddingsDone) {
        return NextResponse.json(
          { error: "Document not ready for chat" },
          { status: 400 }
        );
      }
    }

    const contextChunks = await findRelevantContent(userMessage, docId, 5);

    const documentName = docId
      ? contextChunks[0]?.documentName || "Document"
      : null;

    const prompts = loadPrompts();
    const prompt = buildRAGPrompt(
      userMessage,
      contextChunks,
      documentName,
      prompts
    );

    const sources = contextChunks.map((chunk, i) => ({
      index: i + 1,
      documentName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      score: chunk.score,
      content: chunk.content.substring(0, 200) + "...",
      documentId: chunk.documentId,
    }));

    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
    });

    return result.toUIMessageStreamResponse({
      getMessageAnnotations: () => ({ sources }),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat", details: error.message },
      { status: 500 }
    );
  }
}

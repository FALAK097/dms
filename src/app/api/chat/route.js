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

function buildRAGPrompt(
  userMessage,
  contextChunks,
  prompts,
  documentName = null
) {
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

  const docName =
    documentName || contextChunks[0]?.documentName || "your documents";

  const contextSection = prompts.context_template
    .replace("{documentName}", docName)
    .replace("{chunks}", chunksText);

  return `${prompts.system.global_chat}\n\n${contextSection}\n\nUser Question: ${userMessage}\n\nAnswer:`;
}

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages, conversationId, documentId } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.parts?.[0]?.text || lastMessage.content;

    let selectedDocument = null;
    if (documentId) {
      selectedDocument = await prisma.document.findUnique({
        where: { id: documentId, userId: session.user.id },
      });

      if (!selectedDocument) {
        return NextResponse.json(
          { error: "Document not found or access denied" },
          { status: 404 }
        );
      }
    }

    let conversation;
    let isNewConversation = false;

    if (
      conversationId &&
      conversationId !== "null" &&
      conversationId !== "undefined"
    ) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      if (conversation.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: "New Chat",
        },
      });
      isNewConversation = true;
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: userMessage,
      },
    });

    const contextChunks = await findRelevantContent(
      userMessage,
      documentId || null,
      5
    );

    const prompts = loadPrompts();
    const prompt = buildRAGPrompt(
      userMessage,
      contextChunks,
      prompts,
      selectedDocument?.name
    );

    const sources =
      contextChunks.length > 0
        ? [
            {
              documentName:
                selectedDocument?.name || contextChunks[0].documentName,
              documentId: selectedDocument?.id || contextChunks[0].resourceId,
            },
          ]
        : [];

    const messageMetadata = {
      sources,
      conversationId: conversation.id,
      ...(selectedDocument && {
        selectedDocument: {
          id: selectedDocument.id,
          name: selectedDocument.name,
        },
      }),
    };

    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
      async onFinish({ text }) {
        try {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: text,
              sources: sources.length > 0 ? sources : null,
            },
          });

          if (isNewConversation) {
            const appUrl =
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

            setTimeout(() => {
              fetch(
                `${appUrl}/api/conversations/${conversation.id}/generate-title`,
                {
                  method: "POST",
                  headers: {
                    Cookie: request.headers.get("cookie") || "",
                  },
                }
              ).catch((err) => console.error("Failed to generate title:", err));
            }, 100);
          }
        } catch (error) {
          console.error("Error saving assistant message:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: () => messageMetadata,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat", details: error.message },
      { status: 500 }
    );
  }
}

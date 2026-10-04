import { createHash } from "node:crypto";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findRelevantContent } from "@/lib/cloudflare/vectorize";
import { openai } from "@ai-sdk/openai";
import { google } from "@/lib/ai/google";
import { streamText, tool, isStepCount } from "ai";
import { z } from "zod";

function loadPrompts() {
  const promptsPath = path.join(process.cwd(), "src/config/prompts.yml");
  const fileContents = fs.readFileSync(promptsPath, "utf8");
  return yaml.load(fileContents);
}

function buildRAGPrompt(
  userMessage,
  contextChunks,
  prompts,
  conversationHistory = [],
  documentName = null
) {
  let conversationContext = "";
  if (conversationHistory.length > 1) {
    const previousMessages = conversationHistory.slice(0, -1);
    conversationContext = "\n\nPrevious Conversation:\n";
    previousMessages.forEach((msg) => {
      const role = msg.role === "USER" ? "User" : "Assistant";
      conversationContext += `${role}: ${msg.content}\n`;
    });
    conversationContext +=
      "\nContinue with concise, readable Markdown where it helps (short headings, bullets, and bold emphasis). Avoid large walls of text.\n";
  }

  if (contextChunks.length === 0) {
    return `${prompts.no_context_response}${conversationContext}\n\nUser Question: ${userMessage}\n\nRespond directly in concise Markdown when it improves readability.\n\nAnswer:`;
  }

  const validChunks = contextChunks.filter(
    (chunk) => chunk.content && chunk.content.trim().length > 0
  );

  console.log(
    `Total chunks received: ${contextChunks.length}, Valid chunks: ${validChunks.length}`
  );

  if (validChunks.length === 0) {
    return `${prompts.no_context_response}${conversationContext}\n\nUser Question: ${userMessage}\n\nRespond directly in concise Markdown when it improves readability.\n\nAnswer:`;
  }

  const chunksText = validChunks
    .map((chunk, i) =>
      prompts.chunk_template
        .replace("{index}", i + 1)
        .replace("{content}", chunk.content)
    )
    .join("\n\n");

  const docName =
    documentName || validChunks[0]?.documentName || "your documents";

  const contextSection = prompts.context_template
    .replace("{documentName}", docName)
    .replace("{chunks}", chunksText);

  return `${prompts.system.global_chat}\n\n${contextSection}${conversationContext}\n\nUser Question: ${userMessage}\n\nWrite a direct, well-structured answer using concise Markdown when useful. Use short paragraphs and lists for steps or multiple findings. Cite facts using numbered Markdown links matching the context chunks, such as [1](#dms-citation-1 "exact excerpt copied from source 1"). Put the shortest verbatim passage supporting the claim in the link title. Never paraphrase the excerpt. If an excerpt contains quotation marks, use a bare [1] marker instead. Cite only information supported by those chunks. Do not invent citation numbers.\n\nAnswer:`;
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

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = Array.isArray(lastMessage?.parts)
      ? lastMessage.parts.filter((part) => part.type === "text").map((part) => part.text).join("")
      : lastMessage?.content;
    const clientTurnId = lastMessage?.id;
    if (lastMessage?.role !== "user" || typeof userMessage !== "string" || !userMessage.trim() || typeof clientTurnId !== "string" || !clientTurnId || clientTurnId.length > 200) {
      return NextResponse.json({ error: "A user message with text and an ID is required" }, { status: 400 });
    }

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

    const userTurnId = createHash("sha256")
      .update(`${session.user.id}:${conversation.id}:${clientTurnId}`)
      .digest("hex");
    await prisma.message.upsert({
      where: { id: userTurnId },
      update: {},
      create: {
        id: userTurnId,
        conversationId: conversation.id,
        role: "USER",
        content: userMessage,
      },
    });

    const recentMessages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const conversationHistory = recentMessages.reverse();

    const contextChunks = await findRelevantContent(
      userMessage,
      session.user.id,
      documentId || null,
      8
    );

    const prompts = loadPrompts();
    const prompt = buildRAGPrompt(
      userMessage,
      contextChunks,
      prompts,
      conversationHistory,
      selectedDocument?.name
    );

    const sources = contextChunks.filter((chunk) => chunk.content?.trim()).map((chunk, index) => ({
      citation: index + 1,
      documentName: chunk.documentName || selectedDocument?.name,
      documentId: chunk.resourceId || selectedDocument?.id,
      content: chunk.content,
      quote: chunk.content,
      chunkIndex: chunk.chunkIndex,
    }));
    const assistantMessageId = createHash("sha256").update(`${userTurnId}:assistant`).digest("hex");

    const messageMetadata = {
      messageId: assistantMessageId,
      sources,
      conversationId: conversation.id,
      ...(selectedDocument && {
        selectedDocument: {
          id: selectedDocument.id,
          name: selectedDocument.name,
        },
      }),
    };

    let chatModel;
    try {
      chatModel = google("gemini-3-flash-preview");
    } catch {
      chatModel = openai("gpt-4o-mini");
    }

    const result = streamText({
      model: chatModel,
      tools: {
        total_documents: tool({
          description:
            "Returns the total count and up to 8 most recently uploaded documents. Use ONLY when the user asks for an unfiltered count/list such as 'how many documents do I have' or 'show my documents'; tell them the total and direct them to the library for the full collection. NEVER use for questions with filters (year, date, type, recency); use relevant context chunks instead.",
          inputSchema: z.object({}),
          execute: async () => {
            const where = { userId: session.user.id };
            const [totalCount, documents] = await Promise.all([
              prisma.document.count({ where }),
              prisma.document.findMany({
                where,
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 8,
              }),
            ]);

            const result = {
              totalCount,
              documents: documents.map((doc) => ({
                id: doc.id,
                name: doc.name,
                uploadedAt: doc.createdAt.toISOString(),
              })),
            };

            return result;
          },
        }),
        find_document_by_name: tool({
          description:
            "Searches for up to 8 documents by name when the user mentions a specific document but no context was found. Use this when a named document question has no relevant retrieved chunks. The result includes the total match count; ask the user to refine the name or use @ to select a specific document when there are multiple matches.",
          inputSchema: z.object({
            documentName: z
              .string()
              .describe("The document name or partial name to search for"),
          }),
          execute: async ({ documentName }) => {
            const where = {
              userId: session.user.id,
              name: {
                contains: documentName,
                mode: "insensitive",
              },
            };
            const [totalCount, documents] = await Promise.all([
              prisma.document.count({ where }),
              prisma.document.findMany({
                where,
                select: {
                  id: true,
                  name: true,
                  status: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 8,
              }),
            ]);

            if (totalCount === 0) {
              return {
                found: false,
                message: `No document found matching "${documentName}". Please check the document name or use @ to mention a specific document.`,
              };
            }

            return {
              found: true,
              totalCount,
              documents: documents.map((doc) => ({
                id: doc.id,
                name: doc.name,
                status: doc.status,
                uploadedAt: doc.createdAt.toISOString(),
              })),
              message:
                totalCount === 1
                  ? `Found the document "${documents[0].name}". To ask questions about this document, please use @ to mention it in your message, or try rephrasing your question.`
                  : `Found ${totalCount} documents matching "${documentName}". Showing up to ${documents.length}; please use @ to select and mention the specific document you want to ask about.`,
            };
          },
        }),
      },
      stopWhen: isStepCount(5),
      prompt: prompt,
      onFinish: async ({ response }) => {
        try {
          let messageContent = "";
          const toolResults = [];
          const toolParts = [];

          for (const msg of response.messages || []) {
            if (msg.role === "assistant" && msg.content) {
              for (const part of msg.content) {
                if (part.type === "text") {
                  messageContent += part.text;
                }
              }
            }

            if (msg.role === "tool" && msg.content) {
              for (const part of msg.content) {
                if (part.type === "tool-result" && ["total_documents", "find_document_by_name"].includes(part.toolName)) {
                  toolParts.push({ type: `tool-${part.toolName}`, toolCallId: part.toolCallId, state: "output-available", output: part.output?.value || part.output });
                }
                if (
                  part.type === "tool-result" &&
                  part.toolName === "total_documents"
                ) {
                  const output = part.output?.value || part.output;
                  if (output && output.totalCount !== undefined) {
                    const docs =
                      output.documents
                        ?.map((d) => d.name.replace(/\.[^/.]+$/, ""))
                        .join(", ") || "";
                    toolResults.push(
                      `You have ${output.totalCount} document${
                        output.totalCount !== 1 ? "s" : ""
                      }. Recent documents: ${docs}${output.totalCount > (output.documents?.length || 0) ? `, and ${output.totalCount - (output.documents?.length || 0)} more in your library.` : "."}`
                    );
                  }
                }

                if (
                  part.type === "tool-result" &&
                  part.toolName === "find_document_by_name"
                ) {
                  const output = part.output?.value || part.output;
                  if (output && output.message) {
                    toolResults.push(output.message);
                  }
                }
              }
            }
          }

          const fullContent =
            toolResults.length > 0
              ? toolResults.join("\n")
              : messageContent || "";

          if (fullContent && fullContent.trim()) {
            const data = {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: messageContent || fullContent,
              sources: sources.length > 0 ? sources : [],
              parts: [...(messageContent ? [{ type: "text", text: messageContent }] : []), ...toolParts],
            };
            await prisma.message.upsert({
              where: { id: assistantMessageId },
              update: { ...data, feedback: null },
              create: { id: assistantMessageId, ...data },
            });
          }

          if (isNewConversation || conversation.title === "New Chat") {
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

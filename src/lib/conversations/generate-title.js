import { prisma } from "@/lib/db";
import { openai } from "@ai-sdk/openai";
import { google } from "@/lib/ai/google";
import { generateText } from "ai";

/**
 * Generates and persists a concise title for a conversation that still has the default title.
 */
export async function generateConversationTitle(conversationId, userId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        take: 4,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return { status: 404, error: "Conversation not found" };
  }

  if (conversation.userId !== userId) {
    return { status: 403, error: "Forbidden" };
  }

  if (conversation.title !== "New Chat") {
    return { status: 200, title: conversation.title };
  }

  const userMsg = conversation.messages.find((m) => m.role === "USER");
  const assistantMsg = conversation.messages.find((m) => m.role === "ASSISTANT");

  if (!userMsg || !assistantMsg) {
    return { status: 400, error: "Not enough messages to generate title" };
  }

  const prompt = `Generate a concise, descriptive title (3-6 words) for this conversation. Do not provide generic titles. Provide a unique title that reflects the content of the conversation and is personalized. Only return the title, nothing else.

User: ${userMsg.content}
Assistant: ${assistantMsg.content.substring(0, 200)}...

Title:`;

  let text = "";
  try {
    const primaryModel = process.env.GEMINI_API_KEY
      ? google("gemini-2.5-flash")
      : openai("gpt-4o-mini");
    const res = await generateText({
      model: primaryModel,
      prompt,
      maxOutputTokens: 30,
      temperature: 0.7,
    });
    text = res.text;
  } catch (err) {
    console.warn("Primary title model failed, falling back to OpenAI:", err?.message);
    const res = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 30,
      temperature: 0.7,
    });
    text = res.text;
  }

  const title =
    text.trim().replace(/^["']|["']$/g, "").slice(0, 120) || "New Chat";

  await prisma.conversation.updateMany({
    where: { id: conversationId, userId, title: "New Chat" },
    data: { title },
  });

  return { status: 200, title };
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          take: 2,
          orderBy: { createdAt: "asc" },
        },
      },
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

    if (conversation.messages.length < 2) {
      return NextResponse.json(
        { error: "Not enough messages to generate title" },
        { status: 400 }
      );
    }

    const userMsg = conversation.messages.find((m) => m.role === "USER");
    const assistantMsg = conversation.messages.find(
      (m) => m.role === "ASSISTANT"
    );

    const prompt = `Generate a concise, descriptive title (3-6 words) for this conversation. Only return the title, nothing else.

User: ${userMsg.content}
Assistant: ${assistantMsg.content.substring(0, 200)}...

Title:`;

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: prompt,
      maxTokens: 30,
      temperature: 0.7,
    });

    const title = text.trim().replace(/^["']|["']$/g, "");

    await prisma.conversation.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}

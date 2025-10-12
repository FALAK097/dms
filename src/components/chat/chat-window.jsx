"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { Skeleton } from "@/components/ui/skeleton";

function getDocumentName(docId) {
  if (!docId) return null;
  return `Document_${docId.slice(-4)}.pdf`;
}

function simulateAIResponse(userMessage, docName) {
  const responses = [
    `I understand you're asking about${
      docName ? ` ${docName}` : " your documents"
    }. Let me help you with that.`,
    `Based on${
      docName ? ` the content of ${docName}` : " the available documents"
    }, here's what I found: This is a detailed response that demonstrates streaming text. The system processes your query and retrieves relevant information from the document database.`,
    `Great question! ${
      docName ? `In ${docName}, ` : ""
    }I can see several key points that might help answer your question. Would you like me to elaborate on any specific aspect?`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function ChatWindow({ docId }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef(null);
  const docName = docId ? getDocumentName(docId) : null;

  useEffect(() => {
    let active = true;
    setLoading(true);

    setTimeout(() => {
      if (!active) return;

      const initialMessages = docId
        ? [
            {
              id: "1",
              role: "assistant",
              content: `Hello! I'm ready to help you with ${docName}. What would you like to know?`,
              timestamp: new Date().toISOString(),
            },
          ]
        : [
            {
              id: "1",
              role: "assistant",
              content:
                "Hello! I'm your document assistant. I can help you understand and navigate your documents. What would you like to know?",
              timestamp: new Date().toISOString(),
            },
          ];

      setMessages(initialMessages);
      setLoading(false);
    }, 500);

    return () => {
      active = false;
    };
  }, [docId, docName]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || streaming) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStreaming(true);
    setStreamingText("");

    const aiResponse = simulateAIResponse(content, docName);
    let currentText = "";

    for (let i = 0; i < aiResponse.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, 20 + Math.random() * 30)
      );
      currentText += aiResponse[i];
      setStreamingText(currentText);
    }

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: currentText,
      timestamp: new Date().toISOString(),
      docId: docId || null,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setStreamingText("");
    setStreaming(false);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={i % 2 === 0 ? "flex justify-end" : "flex"}>
              <Skeleton className="h-20 w-3/4 max-w-[600px] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => router.push("/")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold truncate">
              {docName || "Global Chat"}
            </h1>
          </div>
        </div>
        {docId && (
          <Badge variant="outline" className="hidden sm:flex shrink-0">
            Document Chat
          </Badge>
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="mx-auto max-w-3xl space-y-4 py-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {streaming && streamingText && (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingText,
                timestamp: new Date().toISOString(),
              }}
              isStreaming
            />
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSendMessage} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { conversationAPI } from "@/lib/api";
import {
  AlertCircle,
  ArrowUpRight,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat-store";

const suggestedQuestions = [
  "Summarize a document",
  "Find a date or deadline",
  "What should I know?",
];

export function ChatWindow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const {
    currentConversationId,
    setCurrentConversation,
    clearCurrentConversation,
  } = useChatStore();

  const activeConversationId = conversationIdFromUrl || currentConversationId;
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const conversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    conversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    stop,
    regenerate,
    clearError,
  } = useChat({
    transport,
    onFinish: async ({ message }) => {
      if (!conversationIdRef.current && message.metadata?.conversationId) {
        const newConvId = message.metadata.conversationId;
        setCurrentConversation(newConvId);
        router.replace(`/chat?conversationId=${newConvId}`, { scroll: false });

        setTimeout(() => {
          const { triggerConversationRefresh } = useChatStore.getState();
          triggerConversationRefresh();
        }, 2000);
      }
    },
  });
  const isStreaming = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (
      conversationIdFromUrl &&
      conversationIdFromUrl !== currentConversationId
    ) {
      setCurrentConversation(conversationIdFromUrl);
      setHistoryLoaded(false);
    } else if (!conversationIdFromUrl && currentConversationId) {
      clearCurrentConversation();
      setHistoryLoaded(false);
    } else if (!conversationIdFromUrl && !currentConversationId) {
      setHistoryLoaded(false);
    }
  }, [
    conversationIdFromUrl,
    currentConversationId,
    setCurrentConversation,
    clearCurrentConversation,
  ]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!activeConversationId) {
        setMessages([]);
        setHistoryLoaded(true);
        setLoadingHistory(false);
        return;
      }

      if (historyLoaded) {
        return;
      }

      setLoadingHistory(true);
      try {
        const { conversation } = await conversationAPI.getById(
          activeConversationId
        );

        const formattedMessages = conversation.messages.map((msg) => {
          let sources;
          if (msg.sources) {
            sources =
              typeof msg.sources === "string"
                ? JSON.parse(msg.sources)
                : msg.sources;
          }

          return {
            id: msg.id,
            role: msg.role.toLowerCase(),
            parts: [{ type: "text", text: msg.content }],
            metadata: sources ? { sources } : undefined,
          };
        });

        setMessages(formattedMessages);
        setHistoryLoaded(true);
      } catch (error) {
        console.error("Error loading conversation:", error);
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadConversation();
  }, [activeConversationId, historyLoaded, setMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() || isStreaming) {
      return;
    }

    const userMessage = input.trim();
    setInput("");

    await sendMessage(
      { text: userMessage },
      {
        body: {
          conversationId: conversationIdRef.current,
          documentId: selectedDocument?.id || null,
        },
      }
    );
  };

  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loadingHistory) {
    return (
      <div className="flex h-[calc(100svh-7rem)] min-h-[420px] items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin text-primary" />
        Loading conversation…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-7rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1 px-4">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col space-y-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border bg-muted/60 text-primary">
                <MessageSquareText className="size-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                What would you like to find?
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Ask a question about your PDFs. Answers include links back to
                their sources.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setInput(question)}
                    className="group inline-flex min-h-9 items-center gap-2 rounded-full border bg-background px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {question}
                    <ArrowUpRight className="size-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={
                isStreaming && message.id === messages[messages.length - 1]?.id
              }
            />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-background/95 p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          {isStreaming && (
            <div
              className="mb-2 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                {status === "submitted"
                  ? "Finding relevant passages…"
                  : "Writing an answer…"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={() => stop()}
              >
                <Square className="size-3" />
                Stop
              </Button>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm"
            >
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="size-4 text-destructive" />
                Your response couldn’t be completed.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2"
                onClick={() => {
                  clearError();
                  regenerate();
                }}
              >
                <RotateCcw className="size-3.5" />
                Try again
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <ChatInput
              value={input}
              onChange={handleInputChange}
              disabled={isStreaming}
              selectedDocument={selectedDocument}
              onDocumentSelect={handleDocumentSelect}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

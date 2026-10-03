"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatFeedback } from "@/components/chat/chat-feedback";
import { ChatInput } from "@/components/chat/chat-input";
import { conversationAPI } from "@/lib/api";
import { ArrowDown } from "lucide-react";
import { BaseChatButton } from "@/components/chat/base-chat-button";
import { useChatStore } from "@/stores/chat-store";

function formatConversationMessages(conversation) {
  return conversation.messages.map((message) => {
    const sources = message.sources
      ? typeof message.sources === "string"
        ? JSON.parse(message.sources)
        : message.sources
      : undefined;

    return {
      id: message.id,
      role: message.role.toLowerCase(),
      parts: [{ type: "text", text: message.content }],
      metadata: sources ? { sources } : undefined,
    };
  });
}

export function ChatWindow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");
  const scrollRef = useRef(null);
  const shouldFollowRef = useRef(true);
  const [input, setInput] = useState("");
  const [loadedConversationId, setLoadedConversationId] = useState(null);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [historyFailureKey, setHistoryFailureKey] = useState(null);

  const {
    currentConversationId,
    setCurrentConversation,
    clearCurrentConversation,
  } = useChatStore();

  const activeConversationId = conversationIdFromUrl || currentConversationId;
  const historyRequestKey = `${activeConversationId || ""}:${historyRetry}`;
  const historyError = Boolean(activeConversationId && historyFailureKey === historyRequestKey);
  const loadingHistory = Boolean(activeConversationId && loadedConversationId !== activeConversationId && !historyError);
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
    } else if (!conversationIdFromUrl && currentConversationId) {
      clearCurrentConversation();
    }
  }, [
    conversationIdFromUrl,
    currentConversationId,
    setCurrentConversation,
    clearCurrentConversation,
  ]);

  useEffect(() => {
    let ignore = false;
    if (!activeConversationId) {
      // The URL/store identifies the conversation; clearing the chat hook's
      // state here prevents a previous conversation flashing in a new chat.
      setMessages([]);
      return () => {
        ignore = true;
      };
    }

    conversationAPI
      .getById(activeConversationId)
      .then(({ conversation }) => {
        if (ignore) return;
        setMessages(formatConversationMessages(conversation));
        setLoadedConversationId(activeConversationId);
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Error loading conversation:", error);
        // Never leave a different conversation visible after this one fails.
        setMessages([]);
        setHistoryFailureKey(historyRequestKey);
      });

    return () => {
      ignore = true;
    };
  }, [activeConversationId, historyRequestKey, setMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() || isStreaming) {
      return;
    }

    const userMessage = input.trim();
    setInput("");
    shouldFollowRef.current = true;

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

  const getScrollViewport = useCallback(() => {
    if (scrollRef.current) {
      return scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
    }
    return null;
  }, []);

  const scrollToLatest = useCallback((behavior = "smooth") => {
    const viewport = getScrollViewport();
    if (!viewport) return;
    shouldFollowRef.current = true;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    setShowScrollToLatest(false);
  }, [getScrollViewport]);

  useEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    const updateScrollState = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldFollowRef.current = distanceFromBottom <= 96;
      setShowScrollToLatest(distanceFromBottom > 96);
    };

    viewport.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => viewport.removeEventListener("scroll", updateScrollState);
  }, [getScrollViewport]);

  useEffect(() => {
    const viewport = getScrollViewport();
    const content = viewport?.firstElementChild;
    if (!viewport || !content || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      if (shouldFollowRef.current) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        const distanceFromBottom =
          viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        setShowScrollToLatest(distanceFromBottom > 96);
      }
    });
    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, [getScrollViewport]);

  if (loadingHistory) {
    return (
      <div className="flex h-[calc(100dvh-5.5rem)] min-h-[280px] items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground sm:min-h-[420px]">
        <Loader2 className="mr-2 size-4 animate-spin text-primary" />
        Loading conversation…
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100dvh-5.5rem)] min-h-[280px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm sm:min-h-[420px]">
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1 px-3 sm:px-5">
        <ChatMessageList
          messages={messages}
          isStreaming={isStreaming}
          onSuggest={(question) => {
            setInput(question);
            document.querySelector('[aria-label="Chat message"]')?.focus();
          }}
        />
      </ScrollArea>

      {showScrollToLatest && messages.length > 0 && (
        <BaseChatButton
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/95 shadow-md backdrop-blur"
          onClick={() => scrollToLatest("smooth")}
        >
          <ArrowDown className="size-3.5" />
          Latest response
        </BaseChatButton>
      )}

      <div className="border-t bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <ChatFeedback
            historyError={historyError}
            onHistoryRetry={() => setHistoryRetry((attempt) => attempt + 1)}
            isStreaming={isStreaming}
            status={status}
            onStop={stop}
            error={error}
            onRetry={() => {
              clearError();
              regenerate();
            }}
          />
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

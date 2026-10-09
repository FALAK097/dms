"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { useRef, useEffect, useLayoutEffect, useMemo, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentPreviewLayout } from "@/components/chat/document-preview";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatFeedback } from "@/components/chat/chat-feedback";
import { ChatInput } from "@/components/chat/chat-input";
import { conversationAPI } from "@/lib/api";
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
      parts: message.parts?.length ? message.parts : [{ type: "text", text: message.content }],
      metadata: { sources: sources || [], messageId: message.id, feedback: message.feedback },
    };
  });
}

export function ChatWindow() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const draftVersion = useChatStore((state) => state.draftVersion);
  return <DocumentPreviewLayout key={conversationId || `draft-${draftVersion}`}><ConversationChat activeConversationId={conversationId} /></DocumentPreviewLayout>;
}

function ConversationChat({ activeConversationId }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const shouldFollowRef = useRef(true);
  const [input, setInput] = useState("");
  const [loadedConversationId, setLoadedConversationId] = useState(null);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [historyFailureKey, setHistoryFailureKey] = useState(null);

  const mountedRef = useRef(false);
  const requestBodyRef = useRef(null);
  const preparationAttemptRef = useRef(0);
  const [preparing, setPreparing] = useState(false);
  const [preparationError, setPreparationError] = useState(null);
  const historyRequestKey = `${activeConversationId || ""}:${historyRetry}`;
  const historyError = Boolean(activeConversationId && historyFailureKey === historyRequestKey);
  const loadingHistory = Boolean(activeConversationId && loadedConversationId !== activeConversationId && !historyError);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const conversationIdRef = useRef(activeConversationId);

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
    onFinish: ({ message, isAbort, isError }) => {
      if (!mountedRef.current || isAbort || isError) return;
      const id = message.metadata?.conversationId || conversationIdRef.current;
      if (!id) return;
      useChatStore.getState().triggerConversationRefresh();
      if (!activeConversationId) router.replace(`/chat?conversationId=${id}`, { scroll: false });
    },
  });
  const isStreaming = preparing || status === "submitted" || status === "streaming";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [stop]);

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
    const attempt = ++preparationAttemptRef.current;
    setPreparing(true);
    setPreparationError(null);
    try {
      if (!conversationIdRef.current) {
        const { conversation } = await conversationAPI.create();
        if (!mountedRef.current || preparationAttemptRef.current !== attempt) return;
        conversationIdRef.current = conversation.id;
      }
      const body = {
        conversationId: conversationIdRef.current,
        documentId: selectedDocument?.id || null,
      };
      requestBodyRef.current = body;
      setInput("");
      shouldFollowRef.current = true;
      await sendMessage({ text: userMessage }, { body });
    } catch {
      if (mountedRef.current) setPreparationError("Could not start the conversation. Please try again.");
    } finally {
      if (mountedRef.current && preparationAttemptRef.current === attempt) setPreparing(false);
    }
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

    let lastSaved = 0;
    const saveScroll = () => {
      if (!activeConversationId) return;
      const now = Date.now();
      if (now - lastSaved < 300) return;
      lastSaved = now;
      useChatStore.getState().setScrollPosition(activeConversationId, viewport.scrollTop);
    };

    const updateScrollState = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldFollowRef.current = distanceFromBottom <= 96;
      setShowScrollToLatest(distanceFromBottom > 96);
      saveScroll();
    };

    viewport.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => viewport.removeEventListener("scroll", updateScrollState);
  }, [getScrollViewport, loadingHistory, activeConversationId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const viewport = getScrollViewport();
      if (viewport && activeConversationId) {
        useChatStore.getState().setScrollPosition(activeConversationId, viewport.scrollTop);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [getScrollViewport, activeConversationId]);

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
  }, [getScrollViewport, loadingHistory]);

  const restoredConversationRef = useRef(null);
  useLayoutEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport || !activeConversationId || loadedConversationId !== activeConversationId) return;
    if (restoredConversationRef.current === activeConversationId) return;
    restoredConversationRef.current = activeConversationId;

    const saved = useChatStore.getState().getScrollPosition(activeConversationId);
    if (typeof saved === "number") {
      viewport.scrollTop = saved;
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldFollowRef.current = distanceFromBottom <= 96;
      setShowScrollToLatest(distanceFromBottom > 96);
    } else {
      viewport.scrollTop = viewport.scrollHeight;
      shouldFollowRef.current = true;
      setShowScrollToLatest(false);
    }
  }, [getScrollViewport, activeConversationId, loadedConversationId]);

  if (loadingHistory) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-muted-foreground">
        <HugeiconsIcon icon={Loading02Icon} className="mr-2 size-4 animate-spin text-primary" />
        Loading conversation…
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
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
          size="icon"
          className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 size-8 rounded-full bg-background/95 shadow-md backdrop-blur"
          aria-label="Scroll to latest response"
          onClick={() => scrollToLatest("smooth")}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
        </BaseChatButton>
      )}

      <div className="bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <ChatFeedback
            historyError={historyError}
            onHistoryRetry={() => setHistoryRetry((attempt) => attempt + 1)}
            isStreaming={isStreaming}
            status={status}
            onStop={() => {
              preparationAttemptRef.current += 1;
              setPreparing(false);
              stop();
            }}
            error={error}
            onRetry={() => {
              clearError();
              if (requestBodyRef.current) regenerate({ body: requestBodyRef.current });
            }}
          />
          {preparationError && <p role="alert" className="mb-2 text-sm text-destructive">{preparationError}</p>}
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

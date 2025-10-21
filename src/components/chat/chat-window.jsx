"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { conversationAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";

export function ChatWindow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const {
    currentConversationId,
    setCurrentConversation,
    clearCurrentConversation,
  } = useChatStore();

  const activeConversationId = conversationIdFromUrl || currentConversationId;

  const conversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    conversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const { messages, isLoading, sendMessage, setMessages } = useChat({
    api: "/api/chat",
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

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    setInput("");

    await sendMessage(
      { text: userMessage },
      {
        body: {
          conversationId: conversationIdRef.current,
        },
      }
    );
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
      <div className="flex h-[calc(95vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(95vh-4rem)] flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="mx-auto max-w-3xl space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">
                Start a conversation
              </h2>
              <p className="text-muted-foreground">
                Ask me anything about your documents
              </p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={
                isLoading && message.id === messages[messages.length - 1]?.id
              }
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-4">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit}>
            <ChatInput
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

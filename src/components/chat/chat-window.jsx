"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";

export function ChatWindow({ docId }) {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");

  const { messages, isLoading, sendMessage } = useChat({
    api: "/api/chat",
    body: { docId },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    setInput("");

    sendMessage({ text: userMessage });
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

  return (
    <div className="flex h-[calc(95vh-4rem)] flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="mx-auto max-w-3xl space-y-4 py-4">
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

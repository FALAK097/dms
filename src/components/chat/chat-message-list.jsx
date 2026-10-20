"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { MessageBubble } from "@/components/chat/message-bubble";

const suggestedQuestions = [
  "Summarize a document",
  "Find a date or deadline",
  "What should I know?",
];

export function ChatMessageList({ messages = [], isStreaming = false, status, onSuggest }) {
  const lastMessage = messages[messages.length - 1];
  const isWaitingForAssistant = isStreaming && (!lastMessage || lastMessage.role === "user");

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col space-y-6 py-5 sm:py-8">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border bg-muted/60 text-primary">
            <HugeiconsIcon icon={Message01Icon} className="size-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">What would you like to find?</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Ask a question about your PDFs. Answers include links back to their sources.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onSuggest(question)}
                className="group inline-flex min-h-9 items-center gap-2 rounded-full border bg-background px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {question}
                <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isStreaming={isStreaming && index === messages.length - 1}
        />
      ))}
      {isWaitingForAssistant && (
        <div className="flex w-full min-w-0 flex-row gap-3">
          <div className="flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-1 items-start">
            <div className="flex items-center gap-2.5 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground border border-border/40 shadow-xs">
              <div className="flex gap-1.5 items-center">
                <div className="size-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                <div className="size-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                <div className="size-2 rounded-full bg-primary/70 animate-bounce" />
              </div>
              <span className="text-xs font-medium">
                {status === "submitted" ? "Finding relevant passages…" : "Thinking…"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

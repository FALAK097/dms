"use client";

import { ArrowUpRight, MessageSquareText } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";

const suggestedQuestions = [
  "Summarize a document",
  "Find a date or deadline",
  "What should I know?",
];

export function ChatMessageList({ messages, isStreaming, onSuggest }) {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col space-y-6 py-5 sm:py-8">
      {messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border bg-muted/60 text-primary">
            <MessageSquareText className="size-5" />
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
                <ArrowUpRight className="size-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && index === messages.length - 1}
        />
      ))}
    </div>
  );
}

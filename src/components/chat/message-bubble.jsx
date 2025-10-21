"use client";

import { Bot, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";

  const sources = message.metadata?.sources || [];

  const messageContent =
    message.parts
      ?.map((part) => (part.type === "text" ? part.text : ""))
      .join("") ||
    message.content ||
    "";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg px-4 py-3 max-w-[85%] md:max-w-[75%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className="max-w-none break-words">
          <p className="whitespace-pre-wrap m-0">{messageContent}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>

        {!isUser && sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-1">
              {sources.length === 1 ? "Source:" : "Sources:"}
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) =>
                source?.documentId ? (
                  <Link
                    key={`${source.documentId}-${index}`}
                    href={`/dashboard?documentId=${source.documentId}`}
                    target="_blank"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {source.documentName || "View Document"}
                  </Link>
                ) : (
                  <span key={index} className="text-xs text-muted-foreground">
                    {source.documentName || "Unknown"}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
        <div
          className={cn(
            "max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3",
            "bg-primary text-primary-foreground",
            "break-words"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <time className="mt-1 block text-[10px] opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3",
            "bg-muted/50 text-foreground",
            "break-words"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground" />
            )}
          </p>
          {!isStreaming && (
            <time className="mt-1 block text-[10px] text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          )}
        </div>
        {message.docId && (
          <div className="mt-2 ml-1">
            <a
              href={`/chat?docId=${message.docId}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              📄 Referenced: Document_{message.docId.slice(-4)}.pdf
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

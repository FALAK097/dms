"use client";

import { cn } from "@/lib/utils";
import { Bot, User, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function MessageBubble({ message, isStreaming = false }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const router = useRouter();
  const isUser = message.role === "user";

  const sources = message.annotations?.sources || message.data?.sources || [];

  const textPart = message.parts?.find((part) => part.type === "text");
  let messageContent = textPart?.text || message.content || "";

  messageContent = messageContent.replace(/\*\*(.*?)\*\*/g, "$1");

  const handleSourceClick = (documentId) => {
    if (documentId) {
      router.push(`/dashboard/documents/${documentId}`);
    }
  };

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
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <p className="whitespace-pre-wrap m-0">{messageContent}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>

        {!isUser && sources.length > 0 && (
          <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                {sourcesOpen ? "Hide" : "View"} sources ({sources.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2 text-xs">
                {sources.map((source, i) => (
                  <button
                    key={i}
                    onClick={() => handleSourceClick(source.documentId)}
                    className="w-full text-left rounded border bg-background/50 p-2 space-y-1 hover:bg-background transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1 font-medium">
                      <span>
                        [{source.index}] {source.documentName}
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                    <div className="text-muted-foreground line-clamp-2">
                      {source.content}
                    </div>
                    <div className="text-muted-foreground">
                      Chunk {source.chunkIndex} • Relevance:{" "}
                      {(source.score * 100).toFixed(1)}%
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
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

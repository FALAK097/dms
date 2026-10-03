"use client";

import { useState } from "react";
import { Bot, Check, Copy, FileSearch, User } from "lucide-react";
import Link from "next/link";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { BaseChatButton } from "@/components/chat/base-chat-button";
import { DocumentResultRenderer } from "@/components/chat/document-result-renderer";

function ToolProgress({ label, failed = false }) {
  return (
    <div className={cn(
      "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs",
      failed ? "border-destructive/25 bg-destructive/5 text-destructive" : "bg-background/80 text-muted-foreground"
    )} role={failed ? "status" : "status"}>
      <FileSearch className="size-3.5" aria-hidden="true" />
      {label}
    </div>
  );
}

function ToolResult({ part }) {
  if (part.state === "input-streaming" || part.state === "input-available") {
    return <ToolProgress label={part.type === "tool-total_documents" ? "Finding your documents" : "Searching document names"} />;
  }

  if (part.state === "output-error") {
    return <ToolProgress label="Couldn’t complete the document search" failed />;
  }

  if (part.state !== "output-available" || !part.output || typeof part.output !== "object") {
    return null;
  }

  if (part.type === "tool-total_documents") {
    const count = Number.isFinite(part.output.totalCount) ? part.output.totalCount : 0;
    return (
      <DocumentResultRenderer
        title={`${count} document${count === 1 ? "" : "s"} in your library`}
        documents={Array.isArray(part.output.documents) ? part.output.documents : []}
        totalCount={count}
      />
    );
  }

  if (part.type === "tool-find_document_by_name") {
    const documents = Array.isArray(part.output.documents) ? part.output.documents : [];
    return documents.length > 0 ? (
      <DocumentResultRenderer title="Matching documents" documents={documents} />
    ) : (
      <p className="text-sm text-muted-foreground">{part.output.message || "No matching documents found."}</p>
    );
  }

  return null;
}

export function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const sources = Array.from(new Map((message.metadata?.sources || []).map((source) => [
    source?.documentId || source?.documentName || JSON.stringify(source),
    source,
  ])).values());
  const textParts = (message.parts || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  const hasToolResults = message.parts?.some(
    (part) => part.type?.startsWith("tool-") && part.state === "output-available"
  );

  const handleCopy = async () => {
    if (!textParts || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(textParts);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className={cn("flex min-w-0 gap-2.5 sm:gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border bg-primary/8 text-primary" aria-hidden="true">
          <Bot className="size-4" />
        </div>
      )}

      <div className={cn("min-w-0", isUser ? "max-w-[88%] sm:max-w-[78%]" : "w-full max-w-[calc(100%-2.75rem)]")}>
        <div className={cn(
          "min-w-0 break-words text-sm leading-7 sm:text-[15px]",
          isUser && "rounded-2xl rounded-br-md bg-muted px-3.5 py-2.5 sm:px-4"
        )}>
          {textParts ? (
            isUser ? (
              <div className="whitespace-pre-wrap">{textParts}</div>
            ) : (
              <Streamdown
                animated={{ animation: "blurIn", duration: 160, easing: "ease-out" }}
                isAnimating={isStreaming}
              >
                {textParts}
              </Streamdown>
            )
          ) : !message.parts?.length && message.content ? (
            isUser ? <div className="whitespace-pre-wrap">{message.content}</div> : (
              <Streamdown animated={{ animation: "blurIn", duration: 160, easing: "ease-out" }} isAnimating={isStreaming}>
                {message.content}
              </Streamdown>
            )
          ) : null}

          {!isUser && message.parts?.map((part) =>
            part.type?.startsWith("tool-") && part.toolCallId ? (
              <ToolResult key={part.toolCallId} part={part} />
            ) : null
          )}

          {isStreaming && !isUser && !textParts && !message.parts?.some((part) => part.type?.startsWith("tool-")) && (
            <span className="inline-flex items-center gap-1 py-1" role="status" aria-label="Preparing answer">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
            </span>
          )}
        </div>

        {!isUser && sources.length > 0 && !hasToolResults && (
          <div className="mt-3 border-t pt-2.5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {sources.length === 1 ? "Source" : "Sources"}
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => {
                const label = source?.documentName?.replace(/\.[^/.]+$/, "") || "View document";
                return source?.documentId ? (
                  <Link
                    key={source.documentId || source.documentName}
                    href={`/dashboard/document?documentId=${encodeURIComponent(source.documentId)}`}
                    className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate">{label}</span>
                  </Link>
                ) : (
                  <span key={source.documentName || label} className="text-xs text-muted-foreground">{label}</span>
                );
              })}
            </div>
          </div>
        )}

        {!isUser && textParts && !isStreaming && (
          <div className="mt-1 flex justify-end">
            <BaseChatButton
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={handleCopy}
              aria-label={copied ? "Response copied" : "Copy response"}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </BaseChatButton>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden="true">
          <User className="size-4" />
        </div>
      )}
    </article>
  );
}

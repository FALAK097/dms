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
    <div
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs",
        failed
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "bg-background/80 text-muted-foreground"
      )}
      role="status"
    >
      <FileSearch className="size-3.5" aria-hidden="true" />
      {label}
    </div>
  );
}

function TotalDocumentsResult({ output }) {
  const count = Number.isFinite(output.totalCount) ? output.totalCount : 0;
  return (
    <DocumentResultRenderer
      title={`${count} document${count === 1 ? "" : "s"} in your library`}
      documents={Array.isArray(output.documents) ? output.documents : []}
      totalCount={count}
    />
  );
}

function NamedDocumentResults({ output }) {
  const documents = Array.isArray(output.documents) ? output.documents : [];
  if (!documents.length) {
    return <p className="text-sm text-muted-foreground">{output.message || "No matching documents found."}</p>;
  }

  return (
    <DocumentResultRenderer
      title="Matching documents"
      documents={documents}
      totalCount={Number.isFinite(output.totalCount) ? output.totalCount : documents.length}
    />
  );
}

function ToolResult({ part }) {
  if (part.state === "input-streaming" || part.state === "input-available") {
    const label = part.type === "tool-total_documents" ? "Finding your documents" : "Searching document names";
    return <ToolProgress label={label} />;
  }
  if (part.state === "output-error") {
    return <ToolProgress label="Couldn’t complete the document search" failed />;
  }
  if (part.state !== "output-available" || !part.output || typeof part.output !== "object") {
    return null;
  }

  switch (part.type) {
    case "tool-total_documents":
      return <TotalDocumentsResult output={part.output} />;
    case "tool-find_document_by_name":
      return <NamedDocumentResults output={part.output} />;
    default:
      return null;
  }
}

function MessageText({ isUser, message, textParts, isStreaming }) {
  const content = textParts || (!message.parts?.length ? message.content : "");
  if (!content) return null;
  if (isUser) return <div className="whitespace-pre-wrap">{content}</div>;

  return (
    <Streamdown
      animated={{ animation: "blurIn", duration: 160, easing: "ease-out" }}
      isAnimating={isStreaming}
    >
      {content}
    </Streamdown>
  );
}

function ToolResults({ parts = [] }) {
  return parts.map((part) =>
    part.type?.startsWith("tool-") && part.toolCallId
      ? <ToolResult key={part.toolCallId} part={part} />
      : null
  );
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 py-1" role="status" aria-label="Preparing answer">
      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
      <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
    </span>
  );
}

function SourceLinks({ sources }) {
  return (
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
  );
}

function CopyResponseButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
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
  );
}

function getMessageView(message, isStreaming) {
  const isUser = message.role === "user";
  const sources = Array.from(new Map((message.metadata?.sources || []).map((source) => [
    source?.documentId || source?.documentName || JSON.stringify(source),
    source,
  ])).values());
  const parts = message.parts || [];
  const textParts = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  const hasToolResults = parts.some(
    (part) => part.type?.startsWith("tool-") && part.state === "output-available"
  );
  const hasToolParts = parts.some((part) => part.type?.startsWith("tool-"));
  return {
    isUser,
    message,
    parts,
    sources,
    textParts,
    isStreaming,
    hasToolResults,
    showTyping: isStreaming && !isUser && !textParts && !hasToolParts,
  };
}

function AssistantMessage({ view }) {
  return (
    <article className="flex min-w-0 justify-start gap-2.5 sm:gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border bg-primary/8 text-primary" aria-hidden="true">
        <Bot className="size-4" />
      </div>
      <div className="w-full min-w-0 max-w-[calc(100%-2.75rem)]">
        <div className="min-w-0 break-words text-sm leading-7 sm:text-[15px]">
          <MessageText message={view.message} textParts={view.textParts} isStreaming={view.isStreaming} />
          <ToolResults parts={view.parts} />
          {view.showTyping && <TypingIndicator />}
        </div>
        {view.sources.length > 0 && !view.hasToolResults && <SourceLinks sources={view.sources} />}
        {view.textParts && !view.isStreaming && <CopyResponseButton text={view.textParts} />}
      </div>
    </article>
  );
}

function UserMessage({ view }) {
  return (
    <article className="flex min-w-0 justify-end gap-2.5 sm:gap-3">
      <div className="max-w-[88%] min-w-0 break-words rounded-2xl rounded-br-md bg-muted px-3.5 py-2.5 text-sm leading-7 sm:max-w-[78%] sm:px-4 sm:text-[15px]">
        <MessageText isUser message={view.message} textParts={view.textParts} />
      </div>
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden="true">
        <User className="size-4" />
      </div>
    </article>
  );
}

export function MessageBubble({ message, isStreaming = false }) {
  const view = getMessageView(message, isStreaming);
  return (
    view.isUser ? <UserMessage view={view} /> : <AssistantMessage view={view} />
  );
}

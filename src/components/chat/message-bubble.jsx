"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { BotIcon, FileSearchIcon, UserIcon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import { useDocumentPreview } from "./document-preview";
import { BaseChatButton } from "./base-chat-button";
import { remarkCitations, verifiedCitationSource } from "@/lib/chat-citations";
import { Streamdown, defaultRemarkPlugins } from "streamdown";
import { cn } from "@/lib/utils";
import { MessageActions } from "@/components/chat/message-actions";
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
      <HugeiconsIcon icon={FileSearchIcon} className="size-3.5" aria-hidden="true" />
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
  const openSource = useDocumentPreview();
  const remarkPlugins = useMemo(() => [...Object.values(defaultRemarkPlugins), [remarkCitations, { citations: (message.metadata?.sources || []).map((source) => source.citation).filter(Boolean) }]], [message]);
  const components = useMemo(() => ({
    a: ({ href, title, children }) => {
      const match = href?.match(/^#dms-citation-(\d+)$/);
      const source = match && (message.metadata?.sources || []).find((item) => item.citation === Number(match[1]));
      if (source && openSource) return <BaseChatButton variant="ghost" className="mx-0.5 inline-flex h-6 min-w-6 rounded-md bg-muted px-1.5 py-0 align-baseline text-xs tabular-nums" aria-label={`Source ${source.citation}: ${source.documentName}`} title={source.documentName} onClick={() => openSource(verifiedCitationSource(source, title))}>{children}</BaseChatButton>;
      return <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{children}</a>;
    },
  }), [message, openSource]);
  const content = textParts || (!message.parts?.length ? message.content : "");
  if (!content) return null;
  if (isUser) return <div className="whitespace-pre-wrap">{content}</div>;

  return (
    <Streamdown
      remarkPlugins={remarkPlugins}
      components={components}
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
  const openSource = useDocumentPreview();
  return (
    <div className="mt-3 border-t pt-2.5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {sources.length === 1 ? "Source" : "Sources"}
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => {
          const label = source?.documentName?.replace(/\.[^/.]+$/, "") || "View document";
          return source?.documentId ? (
            <BaseChatButton
              variant="ghost"
              key={source.citation || source.documentId}
              onClick={() => openSource?.(source)}
              className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {source.citation && <span className="text-muted-foreground">{source.citation}</span>}
              <span className="truncate">{label}</span>
            </BaseChatButton>
          ) : (
            <span key={source.documentName || label} className="text-xs text-muted-foreground">{label}</span>
          );
        })}
      </div>
    </div>
  );
}

function getMessageView(message, isStreaming) {
  const isUser = message.role === "user";
  const sources = Array.from(new Map((message.metadata?.sources || []).map((source) => [
    source?.citation || source?.documentId || source?.documentName || JSON.stringify(source),
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
        <HugeiconsIcon icon={BotIcon} className="size-4" />
      </div>
      <div className="w-full min-w-0 max-w-[calc(100%-2.75rem)]">
        <div className="min-w-0 break-words text-sm leading-7 sm:text-[15px]">
          <MessageText message={view.message} textParts={view.textParts} isStreaming={view.isStreaming} />
          <ToolResults parts={view.parts} />
          {view.showTyping && <TypingIndicator />}
        </div>
        {view.sources.length > 0 && <SourceLinks sources={view.sources} />}
        {view.textParts && !view.isStreaming && <MessageActions message={view.message} text={view.textParts} />}
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
        <HugeiconsIcon icon={UserIcon} className="size-4" />
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

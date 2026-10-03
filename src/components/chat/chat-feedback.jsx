"use client";

import { AlertCircle, Loader2, RotateCcw, Square } from "lucide-react";
import { BaseChatButton } from "@/components/chat/base-chat-button";

export function ChatFeedback({
  historyError,
  onHistoryRetry,
  isStreaming,
  status,
  onStop,
  error,
  onRetry,
}) {
  return (
    <>
      {historyError && (
        <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm">
          <span className="text-muted-foreground">This conversation couldn’t be loaded.</span>
          <BaseChatButton type="button" size="sm" variant="outline" onClick={onHistoryRetry}>Retry</BaseChatButton>
        </div>
      )}
      {isStreaming && (
        <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground" aria-live="polite">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            {status === "submitted" ? "Finding relevant passages…" : "Writing an answer…"}
          </span>
          <BaseChatButton type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={onStop}>
            <Square className="size-3" />
            Stop
          </BaseChatButton>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="size-4 text-destructive" />
            Your response couldn’t be completed.
          </span>
          <BaseChatButton type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2" onClick={onRetry}>
            <RotateCcw className="size-3.5" />
            Try again
          </BaseChatButton>
        </div>
      )}
    </>
  );
}

"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { BaseChatButton } from "@/components/chat/base-chat-button";

export function ChatFeedback({
  historyError,
  onHistoryRetry,
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
      {error && (
        <div role="alert" className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-destructive" />
            Your response couldn’t be completed.
          </span>
          <BaseChatButton type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2" onClick={onRetry}>
            <HugeiconsIcon icon={RotateLeft01Icon} className="size-3.5" />
            Try again
          </BaseChatButton>
        </div>
      )}
    </>
  );
}

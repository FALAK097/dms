"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick01Icon, ThumbsUpIcon, ThumbsDownIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { BaseChatButton } from "./base-chat-button";

export function MessageActions({ message, text }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(message.metadata?.feedback ?? null);
  const [saving, setSaving] = useState(false);
  const messageId = message.metadata?.messageId;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error("Could not copy the response."); }
  }

  async function rate(value) {
    if (!messageId || saving) return;
    const previous = feedback;
    const next = feedback === value ? null : value;
    setFeedback(next);
    setSaving(true);
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(messageId)}/feedback`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feedback: next }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setFeedback(previous);
      toast.error("Could not save feedback. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <div className="mt-2 flex items-center gap-0.5 text-muted-foreground">
      <BaseChatButton variant="ghost" size="icon" className="size-9" onClick={copy} aria-label={copied ? "Response copied" : "Copy response"} title={copied ? "Copied" : "Copy response"}>
        <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={16} />
      </BaseChatButton>
      {[[1, ThumbsUpIcon, "Helpful"], [-1, ThumbsDownIcon, "Not helpful"]].map(([value, icon, label]) => (
        <BaseChatButton key={value} variant="ghost" size="icon" className="size-9 aria-pressed:bg-muted aria-pressed:text-foreground" aria-label={label} title={label} aria-pressed={feedback === value} disabled={saving || !messageId} onClick={() => rate(value)}>
          <HugeiconsIcon icon={icon} size={16} />
        </BaseChatButton>
      ))}
      <span role="status" className="sr-only">{copied ? "Response copied" : saving ? "Saving feedback" : ""}</span>
    </div>
  );
}

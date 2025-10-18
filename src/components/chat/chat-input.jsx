"use client";

import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ChatInput({ value, onChange, disabled = false }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled ? "Waiting for response..." : "Type your message..."
        }
        disabled={disabled}
        rows={1}
        className={cn(
          "min-h-[44px] max-h-[200px] resize-none",
          "focus-visible:ring-1"
        )}
        aria-label="Chat message"
      />
      <Button
        type="submit"
        disabled={!value?.trim() || disabled}
        size="icon"
        className="h-11 w-11 shrink-0"
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}

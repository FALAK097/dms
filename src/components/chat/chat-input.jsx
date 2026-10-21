"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowUp02Icon, SquareIcon, File01Icon } from "@hugeicons/core-free-icons";
import { useRef, useEffect, useState } from "react";
import { BaseChatButton } from "@/components/chat/base-chat-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DocumentMentionDropdown } from "./document-mention-dropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isStreaming = false,
  onStop,
  selectedDocument,
  onDocumentSelect,
}) {
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(e);
    setCursorPosition(cursorPos);

    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\-.]*)$/);

    if (atMatch) {
      setShowDropdown(true);
      setSearchQuery(atMatch[1] || "");
    } else {
      setShowDropdown(false);
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e) => {
    // If mention dropdown is open, allow dropdown to handle navigation/selection
    if (showDropdown) {
      if (
        e.key === "Enter" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Escape"
      ) {
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!value?.trim() || isStreaming) return;

      if (onSubmit) {
        onSubmit(e);
      } else {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  const handleDocumentSelect = (doc) => {
    if (!doc) {
      setShowDropdown(false);
      return;
    }

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\-.]*)$/);

    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, atMatch.index);
      const newValue = beforeAt + textAfterCursor;

      const syntheticEvent = {
        target: {
          value: newValue,
        },
      };
      onChange(syntheticEvent);
    }

    onDocumentSelect(doc);
    setShowDropdown(false);
    setSearchQuery("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleRemoveDocument = () => {
    onDocumentSelect(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex w-full flex-col rounded-3xl border border-border/60 bg-card p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 focus-within:shadow-md"
    >
      {selectedDocument && (
        <div className="mb-1.5 flex items-center px-1.5 pt-0.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/15">
            <HugeiconsIcon icon={File01Icon} className="size-3.5 text-primary shrink-0" />
            <span className="max-w-[240px] truncate sm:max-w-[380px] font-medium text-foreground">
              {selectedDocument.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveDocument}
              className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground transition-colors focus:outline-none"
              aria-label="Remove document context"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="relative flex items-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? "Waiting for response…"
              : selectedDocument
              ? `Ask about ${selectedDocument.name}…`
              : "Ask anything, or type @ to select a document…"
          }
          disabled={isStreaming}
          rows={1}
          className={cn(
            "min-h-11 max-h-[200px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none sm:text-base focus-visible:ring-0 placeholder:text-muted-foreground/60 scrollbar-hide",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          aria-label="Chat message"
        />

        <div className="mb-0.5 mr-0.5 shrink-0">
          {isStreaming ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BaseChatButton
                    type="button"
                    onClick={onStop}
                    size="icon"
                    className="size-9 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-all shadow-xs"
                    aria-label="Stop generation"
                  >
                    <HugeiconsIcon icon={SquareIcon} className="size-3.5 fill-current" />
                  </BaseChatButton>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Stop generation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BaseChatButton
                    type="submit"
                    disabled={!value?.trim()}
                    size="icon"
                    className="size-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-30"
                    aria-label="Send message"
                  >
                    <HugeiconsIcon icon={ArrowUp02Icon} className="size-4" />
                  </BaseChatButton>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Send message (Enter)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <DocumentMentionDropdown
        isOpen={showDropdown}
        onSelect={handleDocumentSelect}
        position={{ bottom: "100%", left: 0 }}
        searchQuery={searchQuery}
      />
    </div>
  );
}

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { useRef, useEffect, useState } from "react";
import { BaseChatButton } from "@/components/chat/base-chat-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DocumentMentionDropdown } from "./document-mention-dropdown";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatInput({
  value,
  onChange,
  disabled = false,
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
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowDropdown(true);
      setSearchQuery(atMatch[1] || "");
    } else {
      setShowDropdown(false);
      setSearchQuery("");
    }
  };

  const handleDocumentSelect = (doc) => {
    if (!doc) {
      setShowDropdown(false);
      return;
    }

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

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
    <div className="space-y-2">
      {selectedDocument && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 py-2 bg-muted rounded-lg">
          <Badge variant="secondary" className="gap-1 w-fit">
            <span className="text-xs hidden sm:inline">Chatting about:</span>
            <span className="text-xs sm:hidden">About:</span>
            <span className="font-medium truncate max-w-[200px]">
              {selectedDocument.name}
            </span>
          </Badge>
          <BaseChatButton
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleRemoveDocument}
            aria-label="Remove document context"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
          </BaseChatButton>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex items-end gap-2"
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}

          placeholder={
            disabled
              ? "Answer is streaming…"
              : selectedDocument
              ? `Ask about ${selectedDocument.name}…`
              : "@ to choose a PDF, or ask a question…"
          }
          disabled={disabled}
          rows={1}
          className={cn(
            "min-h-12 max-h-[200px] min-w-0 resize-none flex-1 rounded-lg border-none bg-transparent text-sm shadow-none sm:text-base",
            "focus-visible:border-none focus-visible:ring-0 focus-visible:ring-transparent"
          )}
          aria-label="Chat message"
        />
        <div className="flex shrink-0 self-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BaseChatButton
                  type="submit"
                  disabled={!value?.trim() || disabled}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                  aria-label="Send message"
                >
                  <HugeiconsIcon icon={ArrowUp02Icon} className="h-5 w-5" />
                </BaseChatButton>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <DocumentMentionDropdown
          isOpen={showDropdown}
          onSelect={handleDocumentSelect}
          position={{ bottom: "100%", left: 0 }}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

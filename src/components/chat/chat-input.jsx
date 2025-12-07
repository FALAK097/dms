"use client";

import { useRef, useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleKeyDown = (e) => {
    if (showDropdown) {
      return;
    }

    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleRemoveDocument}
            aria-label="Remove document context"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Waiting for response..."
              : selectedDocument
              ? `Ask about ${selectedDocument.name}... (Shift+Enter to send, @ to change)`
              : "Type your message... (Shift+Enter to send, @ to select)"
          }
          disabled={disabled}
          rows={1}
          className={cn(
            "min-h-11 max-h-[200px] resize-none flex-1",
            "focus-visible:ring-1 text-sm sm:text-base"
          )}
          aria-label="Chat message"
        />
        <div className="flex gap-2 sm:gap-0 sm:ml-2 self-end sm:self-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  disabled={!value?.trim() || disabled}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Shift + Enter to send</p>
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

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
    const atMatch = textBeforeCursor.match(/@/);

    if (atMatch) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
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
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <Badge variant="secondary" className="gap-1">
            <span className="text-xs">Chatting about:</span>
            <span className="font-medium">{selectedDocument.name}</span>
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={handleRemoveDocument}
            aria-label="Remove document context"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div ref={containerRef} className="relative flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Waiting for response..."
              : selectedDocument
              ? `Ask about ${selectedDocument.name}... (Type @ to change document)`
              : "Type your message... (Shift+Enter to send, @ to select a document)"
          }
          disabled={disabled}
          rows={1}
          className={cn(
            "min-h-[44px] max-h-[200px] resize-none",
            "focus-visible:ring-1"
          )}
          aria-label="Chat message"
        />
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
            <TooltipContent>
              <p>Shift + Enter to send</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DocumentMentionDropdown
          isOpen={showDropdown}
          onSelect={handleDocumentSelect}
          position={{ bottom: "100%", left: 0 }}
        />
      </div>
    </div>
  );
}

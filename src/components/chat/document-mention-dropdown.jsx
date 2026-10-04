"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState, useRef } from "react";
import { documentAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DocumentMentionDropdown({
  isOpen,
  onSelect,
  position,
  searchQuery = "",
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedItemRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll({ limit: 50 });
      setDocuments(response.documents || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.type?.toLowerCase().includes(query)
    );
  });

  const handleKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (!isOpen || filteredDocuments.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredDocuments.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredDocuments.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredDocuments[selectedIndex]) {
          onSelect(filteredDocuments[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onSelect(null);
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedItemRef.current && scrollContainerRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute z-50 w-full max-w-md bg-popover border rounded-lg shadow-lg overflow-hidden"
      style={{
        bottom: position?.bottom || "100%",
        left: position?.left || 0,
        marginBottom: "8px",
      }}
    >
      <div
        className="max-h-64 overflow-y-auto scrollbar-hide"
        ref={scrollContainerRef}
      >
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <HugeiconsIcon icon={Loading02Icon} className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {searchQuery
              ? `No documents found matching "${searchQuery}"`
              : "No documents available"}
          </div>
        ) : (
          <div className="p-1">
            {filteredDocuments.map((doc, index) => (
              <button
                type="button"
                ref={selectedIndex === index ? selectedItemRef : null}
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedIndex === index && "bg-accent text-accent-foreground"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                  <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    {doc.status === "READY" ? (
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      >
                        Ready
                      </Badge>
                    ) : doc.status === "PROCESSING" ? (
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      >
                        Processing
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {doc.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>↑↓ Navigate • Enter Select • Esc Cancel</span>
          {searchQuery && (
            <span className="font-medium">
              {filteredDocuments.length} result
              {filteredDocuments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

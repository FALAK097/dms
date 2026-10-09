"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState, useRef } from "react";
import { documentAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

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
      className="absolute z-50 w-full max-w-md rounded-lg border bg-popover shadow-lg overflow-hidden"
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
          <div className="p-6 text-center text-sm text-muted-foreground">
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
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedIndex === index && "bg-accent text-accent-foreground"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <HugeiconsIcon
                  icon={File01Icon}
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">
                  {doc.name.replace(/\.[^/.]+$/, "")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

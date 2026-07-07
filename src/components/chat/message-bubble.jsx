"use client";

import { Bot, User } from "lucide-react";
import Link from "next/link";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";

  const sources = message.metadata?.sources || [];

  const hasToolResults = message.parts?.some(
    (part) =>
      part.type &&
      part.type.startsWith("tool-") &&
      part.state === "output-available"
  );

  const textParts = (message.parts || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  const hasTextContent = textParts.length > 0;

  const renderMessageContent = () => {
    if (!message.parts || message.parts.length === 0) {
      return (
        <Streamdown animated={isStreaming && !isUser}>
          {message.content || ""}
        </Streamdown>
      );
    }

    return message.parts.map((part, index) => {
      switch (part.type) {
        case "text":
          return null;

        case "tool-total_documents": {
          const callId = part.toolCallId;

          switch (part.state) {
            case "input-streaming":
              return (
                <div
                  key={callId}
                  className="text-sm text-muted-foreground italic"
                >
                  Preparing to fetch documents...
                </div>
              );
            case "input-available":
              return (
                <div
                  key={callId}
                  className="text-sm text-muted-foreground italic"
                >
                  Fetching total documents...
                </div>
              );
            case "output-available": {
              const output = part.output;
              if (
                output &&
                typeof output === "object" &&
                output.totalCount !== undefined
              ) {
                return (
                  <div key={callId} className="space-y-2">
                    <p className="m-0">
                      You have {output.totalCount} document
                      {output.totalCount !== 1 ? "s" : ""}:
                    </p>
                    {output.documents && output.documents.length > 0 && (
                      <ul className="space-y-1">
                        {output.documents.map((doc) => {
                          const displayName = doc.name.replace(/\.[^/.]+$/, "");
                          return (
                            <li key={doc.id} className="text-sm">
                              <Link
                                href={`/dashboard/document?documentId=${doc.id}`}
                                target="_blank"
                                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                {displayName}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              }
            }
          }
          break;
        }

        case "tool-find_document_by_name": {
          const callId = part.toolCallId;

          switch (part.state) {
            case "input-streaming":
            case "input-available":
              return (
                <div
                  key={callId}
                  className="text-sm text-muted-foreground italic"
                >
                  Searching for document...
                </div>
              );
            case "output-available": {
              const output = part.output;
              if (output && typeof output === "object") {
                return (
                  <div key={callId} className="space-y-2">
                    <p className="m-0">{output.message}</p>
                    {output.found &&
                      output.documents &&
                      output.documents.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {output.documents.map((doc) => {
                            const displayName = doc.name.replace(
                              /\.[^/.]+$/,
                              ""
                            );
                            return (
                              <li key={doc.id} className="text-sm">
                                <Link
                                  href={`/dashboard/document?documentId=${doc.id}`}
                                  target="_blank"
                                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  {displayName}
                                </Link>
                                {doc.status && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({doc.status})
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                  </div>
                );
              }
            }
          }
          break;
        }
      }
    });
  };

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg px-4 py-3 max-w-[85%] md:max-w-[75%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className="max-w-none break-words">
          {hasTextContent && (
            <Streamdown animated={isStreaming && !isUser}>
              {textParts}
            </Streamdown>
          )}
          {renderMessageContent()}
          {isStreaming && !isUser && !hasTextContent && (
            <span className="inline-flex items-center gap-1 ml-1">
              <span
                className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          )}
        </div>

        {!isUser && sources.length > 0 && !hasToolResults && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-1">
              {sources.length === 1 ? "Source:" : "Sources:"}
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) =>
                source?.documentId ? (
                  <Link
                    key={`${source.documentId}-${index}`}
                    href={`/dashboard/document?documentId=${source.documentId}`}
                    target="_blank"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {source.documentName?.replace(/\.[^/.]+$/, "") ||
                      "View Document"}
                  </Link>
                ) : (
                  <span key={index} className="text-xs text-muted-foreground">
                    {source.documentName?.replace(/\.[^/.]+$/, "") || "Unknown"}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

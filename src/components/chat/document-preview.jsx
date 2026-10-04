"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Dialog } from "@base-ui/react/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowUpRight01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { documentAPI } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { BaseChatButton } from "./base-chat-button";

const PDFViewer = dynamic(() => import("@/components/document/pdf-viewer").then((module) => module.PDFViewer), { ssr: false });
const PreviewContext = createContext(null);
export function useDocumentPreview() { return useContext(PreviewContext); }

export function DocumentPreviewLayout({ children }) {
  const [source, setSource] = useState(null);
  const openerRef = useRef(null);
  const previewContainerRef = useRef(null);
  const mobile = useIsMobile();
  function openSource(next) {
    openerRef.current = document.activeElement;
    setSource(next);
  }
  return (
    <PreviewContext.Provider value={openSource}>
      <Dialog.Root open={Boolean(source)} modal={mobile} disablePointerDismissal onOpenChange={(open) => { if (!open) setSource(null); }}>
        <div className="flex h-[calc(100dvh-5.5rem)] min-h-0 gap-4">
          <div className="min-w-0 flex-1">{children}</div>
          <div ref={previewContainerRef} className={source ? "contents min-[1200px]:block min-[1200px]:w-[42%] min-[1200px]:max-w-[600px] min-[1200px]:shrink-0" : "hidden"}>
          {source && (
            <Dialog.Portal container={previewContainerRef} className="h-full">
            <Dialog.Popup finalFocus={openerRef} className="fixed inset-0 z-50 flex min-h-0 flex-col bg-background outline-none min-[1200px]:static min-[1200px]:z-auto min-[1200px]:h-full min-[1200px]:w-full min-[1200px]:rounded-xl min-[1200px]:border">
              <PreviewContent key={`${source.documentId}:${source.citation || "document"}`} source={source} />
            </Dialog.Popup>
            </Dialog.Portal>
          )}
          </div>
        </div>
      </Dialog.Root>
    </PreviewContext.Provider>
  );
}

function PreviewContent({ source }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState("pdf");
  const [matched, setMatched] = useState(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    let ignored = false;
    Promise.all([documentAPI.getById(source.documentId), documentAPI.getDownloadUrl(source.documentId)])
      .then(([{ document }, { downloadUrl }]) => { if (!ignored) { setData({ document, downloadUrl }); setError(false); } })
      .catch(() => { if (!ignored) setError(true); });
    return () => { ignored = true; };
  }, [source.documentId, retry]);

  useEffect(() => {
    if (mode === "text") highlightRef.current?.scrollIntoView({ block: "center" });
  }, [mode, data]);

  const text = data?.document.extractedText || "";
  const quote = source.quote || "";
  const offset = quote ? text.toLowerCase().indexOf(quote.toLowerCase()) : -1;
  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <Dialog.Title className="min-w-0 flex-1 truncate text-sm font-medium">{data?.document.name || source.documentName || "Document preview"}</Dialog.Title>
        {data && <a href={data.downloadUrl} target="_blank" rel="noopener noreferrer" aria-label="Open original document" title="Open original document" className="flex size-9 items-center justify-center rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><HugeiconsIcon icon={ArrowUpRight01Icon} size={16} /></a>}
        <Dialog.Close render={<BaseChatButton variant="ghost" size="icon" className="size-9" aria-label="Close document preview" />}><HugeiconsIcon icon={Cancel01Icon} size={18} /></Dialog.Close>
      </header>
      <Dialog.Description className="sr-only">Preview the original PDF and its extracted text. Citation text is highlighted when available.</Dialog.Description>
      {quote && <div className="shrink-0 border-b px-4 py-3"><p className="mb-1 text-xs font-medium text-muted-foreground">Source {source.citation}</p><p className="line-clamp-3 text-sm leading-6">{quote}</p></div>}
      {error ? <div role="alert" className="p-4 text-sm">Could not load this document.<BaseChatButton variant="outline" size="sm" className="mt-3" onClick={() => { setError(false); setRetry((n) => n + 1); }}>Try again</BaseChatButton></div> : !data ? <div role="status" className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin" />Loading document…</div> : (
        <>
          <div className="flex shrink-0 gap-1 border-b p-2" role="group" aria-label="Preview format">
            {["pdf", "text"].map((value) => <BaseChatButton key={value} variant={mode === value ? "outline" : "ghost"} size="sm" aria-pressed={mode === value} onClick={() => setMode(value)}>{value === "pdf" ? "PDF" : "Extracted text"}</BaseChatButton>)}
          </div>
          {mode === "pdf" ? <div className="min-h-0 flex-1"><PDFViewer fileUrl={data.downloadUrl} highlight={quote} onHighlightResult={setMatched} /></div> : (
            <div className="min-h-0 flex-1 overflow-auto p-4 text-sm leading-7 whitespace-pre-wrap">
              {offset >= 0 ? <>{text.slice(0, offset)}<mark ref={highlightRef} className="rounded bg-amber-200 px-0.5 text-neutral-950 dark:bg-amber-400">{text.slice(offset, offset + quote.length)}</mark>{text.slice(offset + quote.length)}</> : text || "No extracted text is available for this document."}
            </div>
          )}
          {quote && matched === false && mode === "pdf" && <p role="status" className="border-t p-3 text-xs text-muted-foreground">This passage could not be located in the PDF text layer. <button type="button" className="font-medium underline" onClick={() => setMode("text")}>View extracted text</button>.</p>}
        </>
      )}
    </>
  );
}

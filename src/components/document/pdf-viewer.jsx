"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { findScannedPassage } from "@/lib/pdf-highlight";
import { BaseChatButton } from "@/components/chat/base-chat-button";
import { useTheme } from "next-themes";
import { escapeSearchText } from "@/lib/chat-citations";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin, Trigger } from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

const HighlightContext = createContext([]);
function ScannedHighlights({ pageIndex, rotation, getCssProperties }) {
  const areas = useContext(HighlightContext);
  return <>{areas.filter((area) => area.pageIndex === pageIndex).map((area, index) => (
    <div key={index} aria-label="Highlighted citation" className="pointer-events-none absolute rounded-sm bg-amber-300/40 mix-blend-multiply" style={getCssProperties(area, rotation)} />
  ))}</>;
}

export function PDFViewer({ fileUrl, highlight, initialPage = 1 }) {
  "use no memo";
  // This plugin factory calls React hooks despite its non-hook name. The
  // compiler must not memoize or skip the factory on subsequent renders.
  const [doc, setDoc] = useState(null);
  const [areas, setAreas] = useState([]);
  const [status, setStatus] = useState(null);
  const [retry, setRetry] = useState(0);
  const jobRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: () => [],
        toolbarPlugin: {
          fullScreenPlugin: {},
        },
        renderToolbar: (Toolbar) => (
          <Toolbar>
            {(slots) => {
              const {
                CurrentPageInput,
                EnterFullScreen,
                GoToNextPage,
                GoToPreviousPage,
                NumberOfPages,
                ShowSearchPopover,
                Zoom,
                ZoomIn,
                ZoomOut,
              } = slots;
              return (
                <div className="flex w-full items-center gap-0.5 px-1 text-xs whitespace-nowrap">
                  <ShowSearchPopover />
                  <ZoomOut />
                  <div className="hidden sm:block"><Zoom /></div>
                  <ZoomIn />
                  <div className="ml-auto"><GoToPreviousPage /></div>
                  <div className="w-10 shrink-0"><CurrentPageInput /></div>
                  <span className="flex shrink-0 gap-1">/ <NumberOfPages /></span>
                  <GoToNextPage />
                  <div className="hidden sm:block"><EnterFullScreen /></div>
                </div>
              );
            }}
          </Toolbar>
        ),
      });

  // Call the hook-based factory on every render, but retain the plugin identity
  // passed to Viewer so its installation effects do not loop.
  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.None,
    renderHighlights: (props) => <ScannedHighlights {...props} />,
  });
  const [plugins] = useState([defaultLayoutPluginInstance, highlightPluginInstance]);

  useEffect(() => {
    if (!doc || !highlight) return;
    const controller = new AbortController();
    jobRef.current = controller;
    const search = plugins[0].toolbarPluginInstance.searchPluginInstance;
    async function locate() {
      setAreas([]);
      setStatus({ kind: "searching", text: "Finding cited passage…" });
      try {
        const matches = await search.highlight(new RegExp(escapeSearchText(highlight), "gi"));
        if (controller.signal.aborted) return;
        if (matches.length) { search.jumpToMatch(1); setStatus(null); return; }
        setStatus({ kind: "ocr", text: "Preparing scanned-page search…" });
        const boxes = await findScannedPassage(doc, highlight, {
          signal: controller.signal,
          initialPage,
          onProgress: (page, total) => { if (!controller.signal.aborted) setStatus({ kind: "ocr", text: `Finding passage · page ${page} of ${total}` }); },
        });
        if (controller.signal.aborted) return;
        if (boxes.length) {
          setAreas(boxes);
          plugins[1].jumpToHighlightArea(boxes[0]);
          setStatus(null);
        } else setStatus({ kind: "missing", text: "The cited passage could not be located in this PDF." });
      } catch {
        if (!controller.signal.aborted) setStatus({ kind: "error", text: "Could not highlight this passage." });
      }
    }
    void locate();
    return () => { controller.abort(); };
  }, [doc, highlight, initialPage, plugins, retry]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <HighlightContext.Provider value={areas}>
      <div className="min-h-0 flex-1">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer key={fileUrl} defaultScale={SpecialZoomLevel.PageWidth} initialPage={Number.isInteger(initialPage) ? Math.max(0, initialPage - 1) : 0} theme={resolvedTheme === "dark" ? "dark" : "light"} onDocumentLoad={(event) => setDoc(event.doc)} fileUrl={fileUrl} plugins={plugins} />
      </Worker>
      </div>
      </HighlightContext.Provider>
      {status && <div className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span role="status">{status.text}</span>
        {status.kind === "ocr" ? <BaseChatButton variant="ghost" size="sm" onClick={() => { jobRef.current?.abort(); setStatus({ kind: "cancelled", text: "Passage search stopped." }); }}>Stop</BaseChatButton> : ["error", "cancelled"].includes(status.kind) && <BaseChatButton variant="ghost" size="sm" onClick={() => setRetry((value) => value + 1)}>Try again</BaseChatButton>}
      </div>}
    </div>
  );
}

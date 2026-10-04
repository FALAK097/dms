"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { escapeSearchText } from "@/lib/chat-citations";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export function PDFViewer({ fileUrl, highlight, onHighlightResult }) {
  "use no memo";
  // This plugin factory calls React hooks despite its non-hook name. The
  // compiler must not memoize or skip the factory on subsequent renders.
  const [loaded, setLoaded] = useState(false);
  const { resolvedTheme } = useTheme();
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [defaultTabs[0], defaultTabs[1]],
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
  const [plugins] = useState([defaultLayoutPluginInstance]);

  useEffect(() => {
    if (!loaded || !highlight) return;
    let ignored = false;
    const search = plugins[0].toolbarPluginInstance.searchPluginInstance;
    search.highlight(new RegExp(escapeSearchText(highlight), "gi")).then((matches) => {
      if (ignored) return;
      onHighlightResult?.(matches.length > 0);
      if (matches.length) search.jumpToMatch(1);
    }).catch(() => { if (!ignored) onHighlightResult?.(false); });
    return () => { ignored = true; };
  }, [loaded, highlight, plugins, onHighlightResult]);

  return (
    <div className="h-full w-full">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer theme={resolvedTheme === "dark" ? "dark" : "light"} onDocumentLoad={() => setLoaded(true)} fileUrl={fileUrl} plugins={plugins} />
      </Worker>
    </div>
  );
}

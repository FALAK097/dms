"use client";

import { useMemo } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export function PDFViewer({ fileUrl }) {
  const defaultLayoutPluginInstance = useMemo(
    () =>
      defaultLayoutPlugin({
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
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    width: "100%",
                  }}
                >
                  <div style={{ padding: "0px 2px" }}>
                    <ShowSearchPopover />
                  </div>
                  <div style={{ padding: "0px 2px" }}>
                    <ZoomOut />
                  </div>
                  <div style={{ padding: "0px 2px" }}>
                    <Zoom />
                  </div>
                  <div style={{ padding: "0px 2px" }}>
                    <ZoomIn />
                  </div>
                  <div style={{ padding: "0px 2px", marginLeft: "auto" }}>
                    <GoToPreviousPage />
                  </div>
                  <div
                    style={{
                      padding: "0px 2px",
                      width: "4rem",
                      marginRight: "4px",
                    }}
                  >
                    <CurrentPageInput />
                  </div>
                  <div style={{ padding: "0px 2px" }}>
                    / <NumberOfPages />
                  </div>
                  <div style={{ padding: "0px 2px" }}>
                    <GoToNextPage />
                  </div>
                  <div
                    style={{
                      padding: "0px 2px",
                      marginLeft: "auto",
                      marginRight: "20px",
                    }}
                  >
                    <EnterFullScreen />
                  </div>
                </div>
              );
            }}
          </Toolbar>
        ),
      }),
    []
  );

  return (
    <div className="h-full w-full">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
      </Worker>
    </div>
  );
}

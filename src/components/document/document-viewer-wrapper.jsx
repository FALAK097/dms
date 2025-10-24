"use client";

import dynamic from "next/dynamic";

const DocumentViewer = dynamic(
  () => import("./document-viewer").then((mod) => mod.DocumentViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Loading document viewer...
        </p>
      </div>
    ),
  }
);

export function DocumentViewerWrapper() {
  return <DocumentViewer />;
}

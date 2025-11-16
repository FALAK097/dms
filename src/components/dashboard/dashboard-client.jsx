"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
import { DocumentTable } from "@/components/dashboard/document-table";
import { UploadQueueStatus } from "@/components/dashboard/upload-queue-status";

export function DashboardClient() {
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, search, and manage your uploads.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full sm:flex-1 sm:max-w-[340px]">
            <Input
              placeholder="Search documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
              aria-label="Search documents"
            />
          </div>
          <UploadDialog onComplete={handleUploadComplete} />
        </div>
      </div>

      <DocumentTable searchQuery={query} refreshKey={refreshKey} />

      <UploadQueueStatus />
    </div>
  );
}

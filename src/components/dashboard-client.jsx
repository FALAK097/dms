"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDialog } from "@/components/upload-dialog";
import { DocumentTable } from "@/components/document-table";

export function DashboardClient() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
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
          <div className="flex w-full sm:w-[340px]">
            <Input
              placeholder="Search documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
              aria-label="Search documents"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              className="w-full sm:w-[180px]"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <UploadDialog onComplete={() => setRefreshKey((k) => k + 1)} />
        </div>
      </div>

      <DocumentTable
        searchQuery={query}
        statusFilter={status}
        refreshKey={refreshKey}
      />
    </div>
  );
}

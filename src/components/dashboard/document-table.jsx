"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 10;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function statusBadge(status) {
  const s = status.toLowerCase();
  if (s === "ready") return <Badge>Ready</Badge>;
  if (s === "processing") return <Badge variant="secondary">Processing</Badge>;
  if (s === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function makeMockDocuments(count = 37) {
  const names = [
    "Proposal.pdf",
    "Annual_Report_2024.pdf",
    "Invoices_March.xlsx",
    "Meeting_Notes.docx",
    "Design_Specs.pdf",
    "Research_Paper.pdf",
    "Contract_Acme.docx",
    "User_Manual.pdf",
    "Dataset.csv",
    "Presentation_Q2.pptx",
  ];
  const statuses = ["ready", "processing", "failed"];
  const now = Date.now();
  return Array.from({ length: count }).map((_, i) => {
    const name = names[i % names.length];
    const status = statuses[i % statuses.length];
    const size = Math.floor(50_000 + Math.random() * 5_000_000);
    const uploadedAt = new Date(
      now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)
    );
    return {
      id: `doc_${i + 1}`,
      name: `${i + 1}_${name}`,
      status,
      size,
      uploadedAt: uploadedAt.toISOString(),
    };
  });
}

export function DocumentTable({
  searchQuery = "",
  statusFilter = "all",
  refreshKey = 0,
}) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Fetch mock data (simulate network)
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      if (!active) return;
      setDocs(makeMockDocuments());
      setLoading(false);
      setPage(1);
    }, 750);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const s = statusFilter.toLowerCase();
    return docs
      .filter((d) => (s === "all" ? true : d.status === s))
      .filter((d) => (q ? d.name.toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [docs, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Loading skeletons
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="hidden md:block rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Document Name</TableHead>
                <TableHead>Uploaded Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No documents found. Try adjusting your search or filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Document Name</TableHead>
              <TableHead>Uploaded Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{statusBadge(doc.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatSize(doc.size)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    aria-label={`Chat about ${doc.name}`}
                  >
                    <Link href={`/chat?docId=${encodeURIComponent(doc.id)}`}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {pageItems.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{doc.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                {statusBadge(doc.status)}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Size: {formatSize(doc.size)}
              </div>
              <div className="mt-4">
                <Button
                  asChild
                  size="sm"
                  className="w-full"
                  variant="outline"
                  aria-label={`Chat about ${doc.name}`}
                >
                  <Link href={`/chat?docId=${encodeURIComponent(doc.id)}`}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Trash2,
  ArrowUpDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { documentAPI } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function getStatusIcon(status) {
  switch (status) {
    case "READY":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "PROCESSING":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function getStatusBadge(status) {
  const variants = {
    READY: "default",
    PROCESSING: "secondary",
    FAILED: "destructive",
    PENDING: "outline",
  };
  return (
    <Badge variant={variants[status] || "outline"} className="text-xs">
      <span className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </span>
    </Badge>
  );
}

export function DocumentTable({ searchQuery = "", refreshKey = 0 }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortOrder, setSortOrder] = useState("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingDocs, setProcessingDocs] = useState(new Set());
  const pollIntervalRef = useRef(null);
  const previousDocsStatusRef = useRef(new Map());
  const initialLoadRef = useRef(true);

  const fetchDocuments = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const response = await documentAPI.getAll();

      if (response.documents) {
        const newDocs = response.documents;

        if (!initialLoadRef.current && previousDocsStatusRef.current.size > 0) {
          newDocs.forEach((doc) => {
            const prevStatus = previousDocsStatusRef.current.get(doc.id);

            if (prevStatus) {
              if (prevStatus === "PROCESSING" && doc.status === "READY") {
                toast.success(`"${doc.name}" is ready for chat`, {
                  description: "Document processing completed successfully",
                });
              } else if (
                prevStatus === "PROCESSING" &&
                doc.status === "FAILED"
              ) {
                toast.error(`"${doc.name}" processing failed`, {
                  description:
                    doc.embeddingsError ||
                    "Please try uploading the document again",
                });
              }
            }
          });
        }

        const statusMap = new Map();
        newDocs.forEach((doc) => {
          statusMap.set(doc.id, doc.status);
        });
        previousDocsStatusRef.current = statusMap;

        setDocs(newDocs);

        if (!silent) {
          setPage(1);
        }

        const processing = new Set(
          newDocs.filter((d) => d.status === "PROCESSING").map((d) => d.id)
        );
        setProcessingDocs(processing);

        if (initialLoadRef.current) {
          initialLoadRef.current = false;
        }

        return processing.size > 0;
      }
      return false;
    } catch (err) {
      console.error("Error fetching documents:", err);
      if (!silent) {
        setError(err.message);
      }
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadDocuments = async () => {
      const hasProcessing = await fetchDocuments();

      if (!active) return;

      if (hasProcessing) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(async () => {
          const stillProcessing = await fetchDocuments(true);

          if (!stillProcessing && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }, 3000);
      }
    };

    loadDocuments();

    return () => {
      active = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [refreshKey, fetchDocuments]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return docs
      .filter((d) => (q ? d.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [docs, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pageItems.map((doc) => doc.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDocumentToDelete({ bulk: true, count: selectedIds.size });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    try {
      if (documentToDelete.bulk) {
        const deletePromises = Array.from(selectedIds).map((id) =>
          documentAPI.delete(id)
        );
        await Promise.all(deletePromises);
        toast.success(`Successfully deleted ${selectedIds.size} document(s)`);
        setDocs((prev) => prev.filter((d) => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
      } else {
        await documentAPI.delete(documentToDelete.id);
        toast.success("Document deleted successfully");
        setDocs((prev) => prev.filter((d) => d.id !== documentToDelete.id));
      }
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document(s)", {
        description: error.response?.data?.error || "Please try again later",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const hasProcessing = await fetchDocuments();

      if (hasProcessing) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(async () => {
          const stillProcessing = await fetchDocuments(true);

          if (!stillProcessing && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }, 3000);
      }

      toast.success("Documents refreshed");
    } catch (err) {
      toast.error("Failed to refresh documents");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="hidden md:block rounded-lg border min-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
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
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-9 w-9 ml-auto" />
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
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-3 w-28" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Skeleton className="h-9 w-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Error loading documents</EmptyTitle>
          <EmptyDescription>
            {error}. Please try refreshing the page.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!filtered.length) {
    if (searchQuery) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No documents found</EmptyTitle>
            <EmptyDescription>
              No documents match your search. Try adjusting your search query.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No documents yet</EmptyTitle>
          <EmptyDescription>
            Get started by uploading your first document.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isAllSelected =
    pageItems.length > 0 && selectedIds.size === pageItems.length;
  const isSomeSelected =
    selectedIds.size > 0 && selectedIds.size < pageItems.length;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {processingDocs.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{processingDocs.size} document(s) processing</span>
              </div>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh documents</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="text-sm font-medium">
              {selectedIds.size} document(s) selected
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="hidden md:block rounded-lg border min-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isSomeSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all documents"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select all on this page</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-[40%]">Document Name</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSort}
                    className="-ml-3 h-8"
                  >
                    Uploaded Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(doc.id, checked)
                        }
                        aria-label={`Select ${doc.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline transition-colors block truncate max-w-md"
                    >
                      {doc.name}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          {getStatusBadge(doc.status)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {doc.status === "READY" &&
                            "Document is ready for chat"}
                          {doc.status === "PROCESSING" &&
                            "Document is being processed"}
                          {doc.status === "FAILED" &&
                            "Document processing failed"}
                          {doc.status === "PENDING" &&
                            "Document is waiting to be processed"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSize(doc.size)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(doc)}
                            disabled={doc.status === "PROCESSING"}
                            aria-label={`Delete ${doc.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {doc.status === "PROCESSING"
                              ? "Cannot delete while processing"
                              : "Delete document"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 md:hidden">
          {pageItems.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center pt-0.5">
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={(checked) =>
                        toggleSelect(doc.id, checked)
                      }
                      aria-label={`Select ${doc.name}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium truncate block hover:text-primary hover:underline transition-colors"
                    >
                      {doc.name}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex ">
                            {getStatusBadge(doc.status)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {doc.status === "READY" &&
                              "Document is ready for chat"}
                            {doc.status === "PROCESSING" &&
                              "Document is being processed"}
                            {doc.status === "FAILED" &&
                              "Document processing failed"}
                            {doc.status === "PENDING" &&
                              "Document is waiting to be processed"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm text-muted-foreground">
                        {formatSize(doc.size)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(doc)}
                        disabled={doc.status === "PROCESSING"}
                        aria-label={`Delete ${doc.name}`}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {doc.status === "PROCESSING"
                          ? "Cannot delete while processing"
                          : "Delete document"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}{" "}
            of {filtered.length}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {documentToDelete?.bulk
                ? "Delete documents?"
                : "Delete document?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {documentToDelete?.bulk
                ? `Are you sure you want to delete ${documentToDelete.count} document(s)? This action cannot be undone.`
                : `Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

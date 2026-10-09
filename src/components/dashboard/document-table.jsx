"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUpDownIcon, CancelCircleIcon, Clock01Icon, Delete02Icon, FileAttachmentIcon, Loading02Icon, Refresh01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function removeExtension(filename) {
  return filename.replace(/\.pdf$/i, "");
}

function getStatusIcon(status) {
  switch (status) {
    case "READY":
      return <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3.5 w-3.5" />;
    case "PROCESSING":
      return <HugeiconsIcon icon={Loading02Icon} className="h-3.5 w-3.5 animate-spin" />;
    case "FAILED":
      return <HugeiconsIcon icon={CancelCircleIcon} className="h-3.5 w-3.5" />;
    default:
      return <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />;
  }
}

function getStatusBadge(status) {
  const configs = {
    READY: {
      variant: "default",
      className:
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20",
    },
    PROCESSING: {
      variant: "secondary",
      className:
        "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    FAILED: {
      variant: "destructive",
      className:
        "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    },
    PENDING: {
      variant: "outline",
      className:
        "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <Badge
      variant={config.variant}
      className={`text-xs font-medium ${config.className}`}
    >
      <span className="flex items-center gap-1.5">
        {getStatusIcon(status)}
        {status}
      </span>
    </Badge>
  );
}

export function DocumentTable({ searchQuery = "", refreshKey = 0 }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const pollIntervalRef = useRef(null);
  const previousDocsStatusRef = useRef(new Map());
  const initialLoadRef = useRef(true);

  const [urlState, setUrlState] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    sort: parseAsString.withDefault("desc"),
  });

  const fetchDocuments = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }

        const response = await documentAPI.getAll({
          page: urlState.page,
          limit: urlState.limit,
          search: searchQuery,
          sortOrder: urlState.sort,
        });

        if (response.documents && response.pagination) {
          const newDocs = response.documents;

          if (
            !initialLoadRef.current &&
            previousDocsStatusRef.current.size > 0
          ) {
            newDocs.forEach((doc) => {
              const prevStatus = previousDocsStatusRef.current.get(doc.id);

              if (prevStatus) {
                if (prevStatus === "PENDING" && doc.status === "PROCESSING") {
                  toast.info(`Processing "${removeExtension(doc.name)}"...`, {
                    description: "Extracting text and generating embeddings",
                  });
                } else if (
                  prevStatus === "PROCESSING" &&
                  doc.status === "READY"
                ) {
                  toast.success(
                    `"${removeExtension(doc.name)}" is ready for chat`,
                    {
                      description: "Document processing completed successfully",
                    }
                  );
                } else if (
                  prevStatus === "PROCESSING" &&
                  doc.status === "FAILED"
                ) {
                  toast.error(
                    `"${removeExtension(doc.name)}" processing failed`,
                    {
                      description:
                        doc.embeddingsError ||
                        "Please try uploading the document again",
                    }
                  );
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
          setPagination(response.pagination);

          const processing = new Set(
            newDocs
              .filter(
                (d) => d.status === "PROCESSING" || d.status === "PENDING"
              )
              .map((d) => d.id)
          );

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
    },
    [urlState.page, urlState.limit, urlState.sort, searchQuery]
  );

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
  }, [fetchDocuments, refreshKey]);

  useEffect(() => {
    if (urlState.page !== 1) {
      setUrlState({ page: 1 });
    }
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    setUrlState({ page: newPage });
    setSelectedIds(new Set());
  };

  const handleLimitChange = (newLimit) => {
    setUrlState({ page: 1, limit: newLimit });
    setSelectedIds(new Set());
  };

  const toggleSort = () => {
    setUrlState({ sort: urlState.sort === "desc" ? "asc" : "desc" });
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(docs.map((doc) => doc.id)));
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
        setSelectedIds(new Set());
      } else {
        await documentAPI.delete(documentToDelete.id);
        toast.success("Document deleted successfully");
      }
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      await fetchDocuments();
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
      await fetchDocuments();
      toast.success("Documents refreshed");
    } catch (err) {
      toast.error("Failed to refresh documents");
    } finally {
      setIsRefreshing(false);
    }
  };

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
                <TableHead>
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: urlState.limit }).map((_, i) => (
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
            <HugeiconsIcon icon={FileAttachmentIcon} className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Error loading documents</EmptyTitle>
          <EmptyDescription>
            {error}. Please try refreshing the page.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!docs.length) {
    if (searchQuery) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={FileAttachmentIcon} className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No documents found</EmptyTitle>
            <EmptyDescription>
              No documents match your search query &quot;{searchQuery}&quot;
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={FileAttachmentIcon} className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No documents yet</EmptyTitle>
          <EmptyDescription>
            Get started by uploading your first document.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isAllSelected = docs.length > 0 && selectedIds.size === docs.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < docs.length;

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-muted/50 p-3">
            <div className="text-sm font-medium">
              {selectedIds.size} document(s) selected
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDeleteClick}
              className="w-full sm:w-fit"
            >
              <HugeiconsIcon icon={Delete02Icon} className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="hidden lg:block rounded-lg border min-h-[500px]">
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
                    <span className="hidden md:inline">Uploaded Date</span>
                    <span className="md:hidden">Date</span>
                    <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-8 w-8"
                      >
                        <HugeiconsIcon icon={Refresh01Icon} className={`h-4 w-4 ${
                                                                          isRefreshing ? "animate-spin" : ""
                                                                        }`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh documents</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
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
                      href={`/dashboard/document?documentId=${doc.id}`}
                      className="hover:text-primary hover:underline transition-colors block truncate max-w-md"
                    >
                      {removeExtension(doc.name)}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
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
                  <TableCell className="text-muted-foreground text-sm">
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
                            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
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

        <div className="grid gap-3 lg:hidden">
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9"
                >
                  <HugeiconsIcon icon={Refresh01Icon} className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh documents</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {docs.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex items-center pt-0.5 shrink-0">
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={(checked) =>
                        toggleSelect(doc.id, checked)
                      }
                      aria-label={`Select ${doc.name}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Link
                      href={`/dashboard/document?documentId=${doc.id}`}
                      className="font-medium text-sm sm:text-base truncate block hover:text-primary hover:underline transition-colors"
                    >
                      {removeExtension(doc.name)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleString()}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
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
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {formatSize(doc.size)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(doc)}
                          disabled={doc.status === "PROCESSING"}
                          aria-label={`Delete ${doc.name}`}
                          className="h-8 w-8 p-0"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="text-sm text-muted-foreground">
              Showing {startItem}-{endItem} of {pagination.total}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-full sm:w-auto"
                >
                  {urlState.limit} per page
                  <HugeiconsIcon icon={ArrowDown01Icon} className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => handleLimitChange(size)}
                    className={urlState.limit === size ? "bg-accent" : ""}
                  >
                    {size} per page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(urlState.page - 1)}
              disabled={urlState.page === 1}
              aria-label="Previous page"
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(urlState.page + 1)}
              disabled={urlState.page === pagination.totalPages}
              aria-label="Next page"
              className="w-full sm:w-auto"
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
                : `Are you sure you want to delete "${removeExtension(
                    documentToDelete?.name || ""
                  )}"? This action cannot be undone.`}
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

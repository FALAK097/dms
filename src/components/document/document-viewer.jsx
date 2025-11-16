"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentAPI } from "@/lib/api";
import { toast } from "sonner";
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
import { PDFViewer } from "@/components/document/pdf-viewer";

export const DocumentViewer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    if (!documentId) {
      router.push("/dashboard");
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await documentAPI.getById(documentId);
        setDocument(response.document);

        const urlResponse = await documentAPI.getDownloadUrl(documentId);
        setDownloadUrl(urlResponse.downloadUrl);
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Failed to load document");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, router]);

  const handleDownload = async () => {
    if (!document || !downloadUrl) return;
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const handleDeleteConfirm = async () => {
    if (!document) return;
    setDeleting(true);
    try {
      await documentAPI.delete(document.id);
      toast.success("Document deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const removeExtension = (filename) => filename.replace(/\.[^/.]+$/, "");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold truncate">
                {document ? removeExtension(document.name) : "Loading..."}
              </h1>
              <span className="text-xs text-muted-foreground">
                {document
                  ? new Date(document.createdAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!document}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              disabled={!document || document.status === "PROCESSING"}
              className="gap-2 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : document && downloadUrl ? (
          <PDFViewer fileUrl={downloadUrl} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Document not found
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “
              {document ? removeExtension(document.name) : ""}”?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
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
    </div>
  );
};

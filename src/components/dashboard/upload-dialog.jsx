"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  File as FileIcon,
  Loader2,
  Check,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { documentAPI } from "@/lib/api";

function bytesToSize(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(1)} GB`;
}

const ACCEPT_MAP = {
  "application/pdf": [".pdf"],
};

const isAllowed = (f) =>
  f?.type === "application/pdf" || /\.pdf$/i.test(f?.name || "");

export function UploadDialog({ onComplete }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const folderInputRef = useRef(null);

  const addFiles = useCallback((incoming = []) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const filtered = incoming
        .filter(isAllowed)
        .filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...filtered];
    });
  }, []);

  const onDrop = useCallback(
    (accepted) => {
      if (!accepted?.length) return;
      addFiles(accepted);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: ACCEPT_MAP,
  });

  const onFolderChange = (e) => {
    const list = Array.from(e.target?.files || []);
    if (list.length) {
      const allowedFiles = list.filter(isAllowed);

      if (allowedFiles.length === 0) {
        toast.error("No valid files found", {
          description: "The selected folder contains no PDF files.",
        });
      } else {
        addFiles(allowedFiles);
        toast.success(`Added ${allowedFiles.length} file(s) from folder`);
      }
    }
    e.target.value = "";
  };

  const disabled = uploading || files.length === 0;

  const startUpload = async () => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await documentAPI.upload(files, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      });

      setFiles([]);
      setOpen(false);
      toast.success(`Successfully uploaded ${result.count} file(s)`);
      onComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error("Upload failed", {
        description: errorMessage || "Please try again later",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const zoneClasses = useMemo(
    () =>
      [
        "flex flex-col items-center justify-center gap-3",
        "rounded-md border-2 border-dashed",
        "p-8 text-center transition-colors",
        "bg-muted/40 w-full",
        isDragActive ? "border-primary" : "border-border",
      ].join(" "),
    [isDragActive]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="whitespace-nowrap">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[92vw] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            Select PDF files to upload or drag and drop them below.
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps({
            className: zoneClasses,
            role: "button",
            tabIndex: 0,
          })}
        >
          <input
            {...getInputProps({
              "aria-label": "Upload files",
              accept: ".pdf",
            })}
          />
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-sm">
            {isDragActive
              ? "Drop files here..."
              : "Drag and drop files here, or click to browse"}
          </div>
          <div className="text-xs text-muted-foreground">PDF only</div>
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              aria-label="Select a folder"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Select Folder
            </Button>
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              multiple
              webkitdirectory=""
              directory=""
              accept=".pdf"
              onChange={onFolderChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="space-y-3">
          {files.length > 0 ? (
            <>
              <div className="text-sm font-medium">
                Files to upload ({files.length})
              </div>
              <ScrollArea className="max-h-56 rounded-md border overflow-x-hidden">
                <ul className="divide-y">
                  {files.map((f, idx) => (
                    <li
                      key={f.name + f.size + idx}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="truncate text-sm">{f.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {bytesToSize(f.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        disabled={uploading}
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No files selected.
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="ghost" disabled={uploading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={startUpload} disabled={disabled}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

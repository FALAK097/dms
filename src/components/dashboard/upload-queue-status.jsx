"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { documentAPI } from "@/lib/api";

export function UploadQueueStatus() {
  const [queueStatus, setQueueStatus] = useState({
    queueLength: 0,
    processing: false,
  });

  useEffect(() => {
    const initAndSubscribe = async () => {
      const initialStatus = await documentAPI.getUploadQueueStatus();
      setQueueStatus(initialStatus);

      const unsubscribe = documentAPI.subscribeToQueue((status) => {
        setQueueStatus(status);
      });

      return unsubscribe;
    };

    let cleanup;
    initAndSubscribe().then((unsub) => (cleanup = unsub));

    return () => cleanup?.();
  }, []);

  if (queueStatus.queueLength === 0 && !queueStatus.processing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="rounded-lg border bg-card p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={Loading02Icon} className="h-5 w-5 animate-spin text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Background Upload in Progress</p>
            <p className="text-xs text-muted-foreground">
              {queueStatus.queueLength} file
              {queueStatus.queueLength !== 1 ? "s" : ""} remaining in queue
            </p>
          </div>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded">
          <div className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-200">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Safe to refresh!</strong>
              <span className="text-emerald-700 dark:text-emerald-300">
                Queue persists - uploads will resume automatically
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, Loading02Icon, Refresh01Icon, Unlink01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { DropboxSignInButton } from "@/components/auth/dropbox-sign-in-button";
import { getLinkedAccounts, unlinkDropboxAccount } from "@/lib/auth-client";
import { dropboxAPI } from "@/lib/api";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatLastSynced } from "@/lib/utils";

export const DropboxIntegration = ({ user }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(user?.dropboxCursorUpdatedAt);
  const [selectingFolder, setSelectingFolder] = useState(false);
  const [selectedFolderName, setSelectedFolderName] = useState(null);

  const dropboxAccount = accounts.find(
    (account) => account.providerId === "dropbox"
  );

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await getLinkedAccounts();
      if (error) {
        toast.error("Failed to load accounts");
      } else {
        setAccounts(data || []);
        const dbxAccount = data?.find(
          (account) => account.providerId === "dropbox"
        );
        if (dbxAccount?.syncFolderId) {
          const folderName = dbxAccount.syncFolderId.split("/").pop();
          setSelectedFolderName(folderName || dbxAccount.syncFolderId);
        } else {
          setSelectedFolderName(null);
        }
      }
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (!selectedFolderName) {
      toast.error("Please select a folder first");
      return;
    }

    try {
      setSyncing(true);
      const result = await dropboxAPI.syncNow();

      if (result.success) {
        toast.success(result.message || "Sync completed successfully");
        setLastSynced(new Date().toISOString());
      } else {
        toast.error("Sync failed");
      }
    } catch (error) {
      toast.error("Failed to sync with Dropbox");
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectFolder = () => {
    if (typeof window !== "undefined" && window.Dropbox) {
      setSelectingFolder(true);
      window.Dropbox.choose({
        success: async (files) => {
          try {
            const folderObj = files[0];

            if (!folderObj.isDir) {
              toast.error("Please select a folder, not a file");
              setSelectingFolder(false);
              return;
            }

            const folderName = folderObj.name;

            let folderPath = folderObj.path_lower || folderObj.path_display;

            if (!folderPath) {
              folderPath = folderName.startsWith("/")
                ? folderName
                : `/${folderName}`;
            }

            const result = await dropboxAPI.selectFolder(folderPath);

            if (result.success) {
              setSelectedFolderName(folderName);
              toast.success(`Folder "${folderName}" selected successfully`);
            } else {
              toast.error(result.error || "Failed to save folder selection");
            }
          } catch (error) {
            toast.error("Failed to save folder selection");
          } finally {
            setSelectingFolder(false);
          }
        },
        cancel: () => {
          setSelectingFolder(false);
          toast.info("Folder selection cancelled");
        },
        linkType: "preview",
        multiselect: false,
        folderselect: true,
      });
    } else {
      toast.error("Dropbox Chooser not loaded");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDisconnect = async () => {
    if (!dropboxAccount) return;

    try {
      setDisconnecting(true);
      await unlinkDropboxAccount();
      toast.success("Dropbox disconnected successfully");
      await fetchAccounts();
    } catch (error) {
      toast.error("Failed to disconnect Dropbox");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="20 28 88 76"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                fill="#0061FF"
                d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"
              />
            </svg>
            <CardTitle className="text-base">Dropbox</CardTitle>
          </div>
          {!loading && dropboxAccount && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-1 h-3 w-3" />
              Active
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Connect and sync documents from a Dropbox folder
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <HugeiconsIcon icon={Loading02Icon} className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !dropboxAccount ? (
          <div className="mt-1">
            <DropboxSignInButton
              callbackURL="/settings"
              onSuccess={fetchAccounts}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!selectedFolderName ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Please select a folder to sync
              </p>
            ) : (
              <div className="text-xs">
                <p className="truncate font-medium text-blue-600 dark:text-blue-400">
                  {selectedFolderName}
                </p>
                {lastSynced && (
                  <p className="mt-0.5 text-muted-foreground">
                    Last synced: {formatLastSynced(lastSynced)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedFolderName && (
                <Button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  variant="outline"
                  size="sm"
                >
                  {syncing ? (
                    <>
                      <HugeiconsIcon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Refresh01Icon} className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handleSelectFolder}
                disabled={selectingFolder || syncing}
                variant="outline"
                size="sm"
              >
                {selectingFolder ? (
                  <>
                    <HugeiconsIcon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                    Selecting...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Folder01Icon} className="mr-2 h-4 w-4" />
                    {selectedFolderName ? "Change Folder" : "Select Folder"}
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={disconnecting || syncing}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                {disconnecting ? (
                  <>
                    <HugeiconsIcon icon={Loading02Icon} className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Unlink01Icon} className="mr-2 h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

"use client";

import { useEffect, useState } from "react";
import { DropboxSignInButton } from "@/components/auth/dropbox-sign-in-button";
import { getLinkedAccounts, unlinkDropboxAccount } from "@/lib/auth-client";
import { dropboxAPI } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  MoreVertical,
  Folder,
  Unlink,
} from "lucide-react";
import { formatLastSynced } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

export const DropboxIntegration = ({ user }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(user?.dropboxCursorUpdatedAt);
  const [selectingFolder, setSelectingFolder] = useState(false);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const isMobile = useIsMobile();

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
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Dropbox</CardTitle>
            <CardDescription>
              Connect and sync documents from a Dropbox folder
            </CardDescription>
          </div>
          {!loading && dropboxAccount && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0061FF]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 128 128"
                        className="h-6 w-6"
                      >
                        <path fill="#0061FE" d="M0 0h128v128H0z" />
                        <path
                          fill="#F7F5F2"
                          d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      {!dropboxAccount ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          Connect to automatically import PDF files
                        </p>
                      ) : !selectedFolderName ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Please select a folder to sync
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                            {selectedFolderName}
                          </p>
                          {lastSynced && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Last synced: {formatLastSynced(lastSynced)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {selectedFolderName && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={handleSyncNow}
                          disabled={syncing}
                        >
                          {syncing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync Now
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleSelectFolder}
                          disabled={selectingFolder || syncing}
                        >
                          {selectingFolder ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Selecting...
                            </>
                          ) : (
                            <>
                              <Folder className="mr-2 h-4 w-4" />
                              Change Folder
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDisconnect}
                          disabled={disconnecting || syncing}
                          className="text-destructive focus:text-destructive"
                        >
                          {disconnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Disconnecting...
                            </>
                          ) : (
                            <>
                              <Unlink className="mr-2 h-4 w-4" />
                              Disconnect
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {(!dropboxAccount || !selectedFolderName) && (
                  <div className="flex flex-col gap-2">
                    {!dropboxAccount ? (
                      <DropboxSignInButton
                        callbackURL="/settings"
                        onSuccess={fetchAccounts}
                        className="w-full"
                      />
                    ) : (
                      <>
                        <Button
                          onClick={handleSelectFolder}
                          disabled={selectingFolder}
                          variant="default"
                          size="sm"
                          className="w-full"
                        >
                          {selectingFolder ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Selecting
                            </>
                          ) : (
                            "Select Folder"
                          )}
                        </Button>
                        <Button
                          onClick={handleDisconnect}
                          disabled={disconnecting}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {disconnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Disconnect
                            </>
                          ) : (
                            "Disconnect"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between -mt-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0061FF]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 128 128"
                      className="h-6 w-6"
                    >
                      <path fill="#0061FE" d="M0 0h128v128H0z" />
                      <path
                        fill="#F7F5F2"
                        d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {!dropboxAccount ? (
                      <p className="text-sm text-muted-foreground">
                        Connect to automatically import PDF files
                      </p>
                    ) : !selectedFolderName ? (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Please select a folder to sync
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate">
                          Selected folder: {selectedFolderName}
                        </p>
                        {lastSynced && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last synced: {formatLastSynced(lastSynced)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!dropboxAccount ? (
                    <DropboxSignInButton
                      callbackURL="/settings"
                      onSuccess={fetchAccounts}
                    />
                  ) : !selectedFolderName ? (
                    <>
                      <Button
                        onClick={handleSelectFolder}
                        disabled={selectingFolder}
                        variant="default"
                        size="sm"
                      >
                        {selectingFolder ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Selecting...
                          </>
                        ) : (
                          "Select Folder"
                        )}
                      </Button>
                      <Button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        variant="outline"
                        size="sm"
                      >
                        {disconnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSyncNow}
                        disabled={syncing}
                        variant="default"
                        size="sm"
                      >
                        {syncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Now
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleSelectFolder}
                        disabled={selectingFolder || syncing}
                        variant="outline"
                        size="sm"
                      >
                        {selectingFolder ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Selecting...
                          </>
                        ) : (
                          "Change"
                        )}
                      </Button>
                      <Button
                        onClick={handleDisconnect}
                        disabled={disconnecting || syncing}
                        variant="destructive"
                        size="sm"
                      >
                        {disconnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

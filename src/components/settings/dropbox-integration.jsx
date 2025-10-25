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
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { formatLastSynced } from "@/lib/utils";

export const DropboxIntegration = ({ user }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(user?.dropboxCursorUpdatedAt);

  const dropboxAccount = accounts.find(
    (account) => account.providerId === "dropbox"
  );

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await getLinkedAccounts();
      if (error) {
        console.error("Error fetching accounts:", error);
        toast.error("Failed to load accounts");
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
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
      console.error("Error syncing:", error);
      toast.error(error.response?.data?.error || "Failed to sync with Dropbox");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDisconnect = async () => {
    if (!dropboxAccount) return;

    try {
      setDisconnecting(true);
      const { error } = await unlinkDropboxAccount();

      if (error) {
        console.error("Error disconnecting:", error);
        toast.error(error.message || "Failed to disconnect Dropbox");
      } else {
        toast.success("Dropbox disconnected successfully");
        await fetchAccounts();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to disconnect Dropbox");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dropbox</CardTitle>
        <CardDescription>
          Connect your Dropbox account to automatically sync and import
          documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0061FF]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 128 128"
                  >
                    <path fill="#0061FE" d="M0 0h128v128H0z" />
                    <path
                      fill="#F7F5F2"
                      d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-none">
                      {dropboxAccount ? "Connected" : "Not Connected"}
                    </h3>
                    {dropboxAccount && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dropboxAccount
                      ? "Your Dropbox account is connected and syncing"
                      : "Connect to automatically import PDF files"}
                  </p>
                  {dropboxAccount && lastSynced && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {formatLastSynced(lastSynced)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {dropboxAccount && (
                  <Button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    variant="outline"
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
                )}
                {dropboxAccount ? (
                  <Button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
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
                ) : (
                  <DropboxSignInButton
                    callbackURL="/settings"
                    onSuccess={fetchAccounts}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

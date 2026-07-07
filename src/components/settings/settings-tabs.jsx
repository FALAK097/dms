"use client";

import { Separator } from "@/components/ui/separator";
import { DropboxIntegration } from "./dropbox-integration";
import { DriveIntegration } from "./drive-integration";

export const SettingsTabs = ({ user }) => {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your integrations
          </p>
        </div>
        <Separator />
      </div>

      <div className="space-y-6">
        <DropboxIntegration user={user} />
        <DriveIntegration />
      </div>
    </div>
  );
};


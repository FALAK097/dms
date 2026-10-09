"use client";

import { DropboxIntegration } from "./dropbox-integration";
import { DriveIntegration } from "./drive-integration";

export const SettingsTabs = ({ user }) => {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your integrations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-4xl">
        <DropboxIntegration user={user} />
        <DriveIntegration />
      </div>
    </div>
  );
};


"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { GeneralTab } from "./general-tab";
import { DropboxIntegration } from "./dropbox-integration";
import { DriveIntegration } from "./drive-integration";

export const SettingsTabs = ({ user }) => {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("general")
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and integrations
          </p>
        </div>
        <Separator />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="space-y-6">
            <DropboxIntegration user={user} />
            <DriveIntegration />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

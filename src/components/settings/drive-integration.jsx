"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const DriveIntegration = () => {
  return (
    <Card className="opacity-60">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
        <div className="space-y-1.5">
          <CardTitle>Google Drive</CardTitle>
          <CardDescription>
            Connect Google Drive to sync and import documents
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="w-fit bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        >
          Coming Soon
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 -mt-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 87.3 78"
              className="h-6 w-6"
            >
              <path
                fill="#0066DA"
                d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
              />
              <path
                fill="#00AC47"
                d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"
              />
              <path
                fill="#EA4335"
                d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
              />
              <path
                fill="#00832D"
                d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
              />
              <path
                fill="#2684FC"
                d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
              />
              <path
                fill="#FFBA00"
                d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
              />
            </svg>
          </div>
          <p className="flex-1 min-w-0 text-sm text-muted-foreground">
            Google Drive integration is currently under development
          </p>
        </div>
      </CardContent>
    </Card>
  );
};


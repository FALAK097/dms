"use client";

import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const DriveIntegration = () => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 opacity-70">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 87.3 78"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
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
            <CardTitle className="text-base">Google Drive</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="w-fit shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          >
            Coming Soon
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Connect Google Drive to sync and import documents
        </p>

        <div className="mt-1">
          <Button variant="outline" size="sm" disabled>
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

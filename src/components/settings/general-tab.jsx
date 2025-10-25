"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const GeneralTab = () => {
  const currentProvider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "do";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Provider</CardTitle>
          <CardDescription>
            Choose where your uploaded documents are stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div
              className={`flex items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                currentProvider === "do"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                  <svg
                    height="400"
                    width="400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -3.954 53.927 53.954"
                  >
                    <g fill="#0080ff" fill-rule="evenodd">
                      <path d="M24.915 50v-9.661c10.226 0 18.164-10.141 14.237-20.904a14.438 14.438 0 0 0-8.615-8.616C19.774 6.921 9.633 14.83 9.633 25.056H0C0 8.758 15.763-3.954 32.853 1.384 40.311 3.73 46.271 9.661 48.588 17.12 53.927 34.237 41.243 50 24.915 50" />
                      <path d="M15.339 40.367h9.604v-9.604H15.34zm-7.401 7.401h7.4v-7.4h-7.4zm-6.187-7.4h6.187V34.18H1.751z" />
                    </g>
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-none">
                      DigitalOcean Spaces
                    </h3>
                    {currentProvider === "do" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    S3-compatible object storage with predictable pricing
                  </p>
                </div>
              </div>
              <Button
                disabled={currentProvider === "do"}
                variant={currentProvider === "do" ? "secondary" : "outline"}
                size="sm"
              >
                {currentProvider === "do" ? "Current" : "Switch"}
              </Button>
            </div>

            <div
              className={`flex items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                currentProvider === "uploadthing"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                  <svg
                    viewBox="0 0 256 222"
                    width="256"
                    height="222"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid"
                  >
                    <path fill="#000" d="m128 0 128 221.705H0z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-none">
                      Vercel Blob Storage
                    </h3>
                    {currentProvider === "vercel" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    File uploads built for Next.js developers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                >
                  Coming Soon
                </Badge>
                <Button
                  disabled
                  variant={
                    currentProvider === "vercel" ? "secondary" : "outline"
                  }
                  size="sm"
                >
                  {currentProvider === "vercel" ? "Current" : "Switch"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

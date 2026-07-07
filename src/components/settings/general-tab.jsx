"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const GeneralTab = () => {
  const currentProvider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "do";

  const storageProviders = [
    {
      value: "do",
      label: "Cloudflare R2",
      description: "S3-compatible object storage with predictable pricing",
      logo: (
        <svg
          height="24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -3.954 53.927 53.954"
        >
          <g fill="#0080ff" fillRule="evenodd">
            <path d="M24.915 50v-9.661c10.226 0 18.164-10.141 14.237-20.904a14.438 14.438 0 0 0-8.615-8.616C19.774 6.921 9.633 14.83 9.633 25.056H0C0 8.758 15.763-3.954 32.853 1.384 40.311 3.73 46.271 9.661 48.588 17.12 53.927 34.237 41.243 50 24.915 50" />
            <path d="M15.339 40.367h9.604v-9.604H15.34zm-7.401 7.401h7.4v-7.4h-7.4zm-6.187-7.4h6.187V34.18H1.751z" />
          </g>
        </svg>
      ),
    },
    {
      value: "vercel",
      label: "Vercel Blob Storage",
      description: "File uploads built for Next.js developers",
      logo: (
        <svg
          viewBox="0 0 256 222"
          width="24"
          height="24"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
        >
          <path fill="#000" d="m128 0 128 221.705H0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4 sm:space-y-0 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Storage Provider</CardTitle>
              <CardDescription>
                Choose where your uploaded documents are stored
              </CardDescription>
            </div>
            <Select value={currentProvider}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue>
                  {storageProviders.find(
                    (p) => p.value === currentProvider
                  ) && (
                    <div className="flex items-center gap-2 min-w-0">
                      {
                        storageProviders.find(
                          (p) => p.value === currentProvider
                        )?.logo
                      }
                      <span className="truncate">
                        {
                          storageProviders.find(
                            (p) => p.value === currentProvider
                          )?.label
                        }
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {storageProviders.map((provider) => (
                  <SelectItem
                    key={provider.value}
                    value={provider.value}
                    disabled={provider.value !== currentProvider}
                  >
                    <div className="flex items-center gap-2">
                      {provider.logo}
                      <span>{provider.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

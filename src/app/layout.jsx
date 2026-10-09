import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "DMS | Document Management System",
    template: "%s | DMS",
  },
  description:
    "DMS is a powerful document management system that helps you organize, manage, and ask your documents with help of AI.",
  keywords:
    "DMS, Document Management System, Document Organization, Document Sharing, Document Collaboration, Document Workflow, Document Automation, Document Security, Document Storage, Document Retrieval, Document Indexing, Document Scanning, Document Archiving, Document Versioning, Document Control, Document Compliance, Document Management Software, Document Management Solutions, Document Management Tools, Document Management Best Practices",
  openGraph: {
    title: "DMS | Document Management System",
    description:
      "DMS is a powerful document management system that helps you organize, manage, and ask your documents with help of AI.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "DMS Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DMS | Document Management System",
    description:
      "DMS is a powerful document management system that helps you organize, manage, and ask your documents with help of AI.",
    images: ["/opengraph-image.png"],
  },
  metadataBase: new URL("https://dms.falakgala.dev"),
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="DMS" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NuqsAdapter>
            <AuthModalProvider>{children}</AuthModalProvider>
          </NuqsAdapter>
          <Toaster />
        </ThemeProvider>
        <Script
          type="text/javascript"
          src="https://www.dropbox.com/static/api/2/dropins.js"
          id="dropboxjs"
          data-app-key={process.env.DROPBOX_CLIENT_ID}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

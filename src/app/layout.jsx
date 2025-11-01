import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DMS",
  description: "Document Management System",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
        </ThemeProvider>
        <script
          type="text/javascript"
          src="https://www.dropbox.com/static/api/2/dropins.js"
          id="dropboxjs"
          data-app-key={process.env.DROPBOX_CLIENT_ID}
        ></script>
      </body>
    </html>
  );
}

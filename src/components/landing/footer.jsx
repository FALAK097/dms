"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 font-semibold"
            >
              <Image
                src="/images/logo.png"
                alt="DMS Logo"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <span className="text-xl">DMS</span>
            </Link>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              AI-powered document management made simple. Upload, organize, and
              chat with your documents effortlessly.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://github.com/Falak097"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://x.com/FalakGala097"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter/X</span>
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p suppressHydrationWarning>© {new Date().getFullYear()} DMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

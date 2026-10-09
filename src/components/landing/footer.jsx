"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, GithubIcon, TwitterIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Dashboard", href: "/dashboard" },
];

const resourceLinks = [
  { label: "FAQ", href: "#faq" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export function Footer() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();

  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="mb-5 flex items-center gap-2 font-semibold">
              <Image
                src="/images/logo.png"
                alt="DMS Logo"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <span className="text-xl">DMS</span>
            </Link>
            <p className="mb-6 max-w-xs font-display text-xl leading-snug tracking-tight">
              Ask your documents. Get answers you can cite.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://github.com/Falak097"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={GithubIcon} className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://x.com/FalakGala097"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={TwitterIcon} className="h-5 w-5" />
                <span className="sr-only">Twitter/X</span>
              </Link>
            </div>
          </div>

          <nav className="md:col-span-2" aria-label="Product">
            <ul className="space-y-4 text-[15px]">
              {productLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-2" aria-label="Resources">
            <ul className="space-y-4 text-[15px]">
              {resourceLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-medium tracking-tight">Start with your first PDF.</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Upload a deed or agreement and ask your first question.
              </p>
              {!isPending && session ? (
                <Button size="sm" asChild className="mt-4 w-full gap-1.5">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" onClick={openAuthModal} className="mt-4 w-full gap-1.5 cursor-pointer">
                  Try for Free
                  <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-7 sm:flex-row">
          <p suppressHydrationWarning className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DMS. All rights reserved.
          </p>
          {!isPending && session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-foreground"
            >
              Go to Dashboard
              <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:text-foreground"
            >
              Try for Free
              <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LandingThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/images/logo.png"
            alt="DMS Logo"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="text-xl">DMS</span>
        </Link>

        <div className="flex items-center gap-4">
          <LandingThemeToggle />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Try for Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

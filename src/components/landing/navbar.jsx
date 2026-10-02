"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LandingThemeToggle } from "./theme-toggle";

import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();

  return (
    <nav className="landing-navbar fixed top-0 left-0 right-0 z-50">
      <div className="landing-container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <Image
            src="/images/logo.png"
            alt="DMS Logo"
            width={36}
            height={36}
            className="h-8 w-8 rounded-md"
          />
          <span className="text-lg tracking-tight">DMS</span>
        </Link>

        <div className="flex items-center gap-3">
          <LandingThemeToggle />
          <div className="flex items-center gap-2">
            {!isPending && session ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button onClick={openAuthModal} className="landing-nav-cta cursor-pointer">
                Get started
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function Hero() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm">
              <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4 text-primary" />
              <span>AI-Powered Document Intelligence</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Your documents,{" "}
            <span className="bg-linear-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              organized and intelligent
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 text-lg text-muted-foreground sm:text-xl"
          >
            Upload, search, and chat with your documents using AI. Automatic
            OCR, smart search, and seamless cloud sync—all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            {!isPending && session ? (
              <Button size="lg" asChild className="gap-2">
                <Link href="/dashboard">
                  Go to Dashboard
                  <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" onClick={openAuthModal} className="gap-2 cursor-pointer">
                Try for Free
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 text-sm text-muted-foreground"
          >
            No credit card required • Free forever plan
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, FileAttachmentIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function Hero() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-5 font-display text-[clamp(2.1rem,3.8vw,3.1rem)] leading-[1.06] font-semibold tracking-tight text-balance"
            >
              Ask your documents. Get answers you can{" "}
              <span className="text-emerald-700 dark:text-emerald-300">cite.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              Upload deeds, contracts, and case files. Ask in plain English
              and trace every answer back to the exact source: clause,
              page, and PDF.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col gap-3 sm:flex-row"
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
          </motion.div>

          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="relative lg:col-span-7"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-[#FF5F57]" />
                  <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
                  <span className="size-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">DMS · Chat</span>
              </div>
              <Image
                src="/images/hero-chat-answer.png"
                alt="DMS answering a question about stamp duty, with citations linking to the source PDF"
                width={1270}
                height={850}
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="h-auto w-full"
              />
            </div>

            <div className="absolute -left-3 top-16 hidden items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 text-xs font-medium shadow-md sm:flex md:-left-6">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15">
                <HugeiconsIcon icon={Tick01Icon} className="size-3.5 text-emerald-700 dark:text-emerald-300" />
              </span>
              Every claim cites its source
            </div>
            <div className="absolute -right-3 bottom-24 hidden items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 text-xs font-medium shadow-md sm:flex md:-right-6">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/15">
                <HugeiconsIcon icon={FileAttachmentIcon} className="size-3.5 text-blue-700 dark:text-blue-300" />
              </span>
              Source PDF one click away
            </div>

          </motion.figure>
        </div>
      </div>
    </section>
  );
}

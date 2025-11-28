"use client";

import { motion } from "motion/react";
import {
  MessageSquareDashed,
  Sparkles,
  Search,
  ShieldCheck,
  Plus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="bg-linear-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              manage documents
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to make document management effortless
            for small businesses and teams
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5 auto-rows-[minmax(180px,auto)]">
          {/* Feature 1: AI Chat (Large Box) */}
          <Card
            className="group bento-card rounded-3xl p-8 md:col-span-6 lg:col-span-8 row-span-2 relative overflow-hidden flex flex-col justify-between animate-enter border-border gap-0"
            style={{ animationDelay: "400ms" }}
          >
            <div className="hover-reveal" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageSquareDashed className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-2xl font-medium text-foreground tracking-tight mb-2">
                AI Chat with Documents
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Ask questions and get instant, context-aware answers from your
                entire knowledge base.
              </p>
            </div>
            {/* UI Mockup */}
            <div className="mt-8 bg-card/40 border border-border/20 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group-hover:border-purple-500/20 transition-colors duration-500">
              {/* Chat Message 1 */}
              <div className="flex items-start gap-3 opacity-90">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0 border border-border/20" />
                <div className="bg-card rounded-2xl rounded-tl-none p-3.5 text-xs text-muted-foreground w-3/4 border border-border/20 shadow-sm">
                  Summarize the Q4 financial report highlights.
                </div>
              </div>
              {/* Chat Message 2 */}
              <div
                className="flex items-start gap-3 flex-row-reverse animate-float"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="bg-linear-to-br from-purple-900/20 to-card rounded-2xl rounded-tr-none p-3.5 text-xs text-purple-100 w-5/6 border border-purple-500/20 shadow-sm backdrop-blur-sm">
                  <span className="block mb-2 font-medium text-purple-200">
                    Processing...
                  </span>
                  Revenue increased by 22% YoY. Key drivers include the new
                  Enterprise plan and expansion into APAC markets.
                </div>
              </div>
              {/* Typing Indicator */}
              <div className="absolute bottom-4 left-4 flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "100ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "200ms" }}
                />
              </div>
              <div className="absolute bottom-0 left-0 w-full h-12 bg-linear-to-t from-card/60 to-transparent" />
            </div>
          </Card>
          {/* Feature 2: Semantic Search */}
          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-3 lg:col-span-4 row-span-1 relative overflow-hidden animate-enter border-border gap-0"
            style={{ animationDelay: "500ms" }}
          >
            <div className="hover-reveal" />
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-medium tracking-tight mb-1 text-foreground">
                Semantic Search
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Vector-based retrieval.
              </CardDescription>
              <CardAction>
                <Search className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
              </CardAction>
            </CardHeader>
            {/* Visual */}
            <CardContent className="p-0 mt-6">
              <div className="relative space-y-2">
                <div className="h-9 bg-card/80 rounded-lg border border-border/20 flex items-center px-3 gap-2 group-hover:border-border transition-colors">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Q4 earnings...
                  </span>
                  <div className="ml-auto w-1 h-4 bg-purple-500/50 animate-pulse" />
                </div>
                {/* Results */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-7 bg-card/30 rounded border border-border/20 flex items-center px-2 group-hover:translate-x-1 transition-transform duration-300 delay-75">
                    <div className="w-2 h-2 rounded-full bg-purple-500/50 mr-2" />
                    <div className="h-1.5 w-20 bg-neutral-700/50 rounded-full" />
                  </div>
                  <div className="h-7 bg-card/30 rounded border border-border/20 flex items-center px-2 group-hover:translate-x-1 transition-transform duration-300 delay-100 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-blue-500/50 mr-2" />
                    <div className="h-1.5 w-16 bg-neutral-700/50 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Feature 3: OCR */}
          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-3 lg:col-span-4 row-span-1 relative overflow-hidden flex flex-col animate-enter border-border gap-0"
            style={{ animationDelay: "600ms" }}
          >
            <div className="hover-reveal" />
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                Auto OCR
              </CardTitle>
              <CardAction>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  ACTIVE
                </div>
              </CardAction>
            </CardHeader>
            <CardDescription className="text-xs mb-4 text-muted-foreground">
              PDF text extraction.
            </CardDescription>
            {/* OCR Visual */}
            <CardContent className="p-0 flex-1">
              <div className="bg-card/50 rounded-lg border border-border/20 relative overflow-hidden p-4 group-hover:border-blue-500/20 transition-colors">
                <div className="space-y-2 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                  <div className="h-1.5 w-full bg-neutral-400 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-neutral-400 rounded-full" />
                  <div className="h-1.5 w-5/6 bg-neutral-400 rounded-full" />
                  <div className="h-1.5 w-full bg-neutral-400 rounded-full" />
                  <div className="h-1.5 w-2/3 bg-neutral-400 rounded-full" />
                </div>
                {/* Moving Scan Line */}
                <div className="absolute inset-0 scan-line h-12 blur-[1px]" />
              </div>
            </CardContent>
          </Card>
          {/* Feature 4: Cloud Sync */}
          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-3 lg:col-span-4 row-span-1 relative overflow-hidden animate-enter border-border gap-0"
            style={{ animationDelay: "700ms" }}
          >
            <div className="hover-reveal" />
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-medium tracking-tight mb-2 text-foreground">
                Cloud Sync
              </CardTitle>
              <CardDescription className="text-xs mb-8 text-muted-foreground">
                Real-time bi-directional sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center justify-center gap-4 relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-px bg-border overflow-hidden">
                  <div className="w-full h-full bg-primary/50 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </div>
                <div className="relative z-10 w-11 h-11 rounded-full bg-[#0061FF]/10 border border-[#0061FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,97,255,0.2)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 87.3 78"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#0066DA"
                      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                    />
                    <path
                      fill="#00AC47"
                      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"
                    />
                    <path
                      fill="#EA4335"
                      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                    />
                    <path
                      fill="#00832D"
                      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                    />
                    <path
                      fill="#2684FC"
                      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                    />
                    <path
                      fill="#FFBA00"
                      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
                    />
                  </svg>
                </div>
                <div className="relative z-10 w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                  <img
                    src="/images/logo.png"
                    alt="DMS"
                    className="w-5 h-5 rounded"
                  />
                </div>
                <div className="relative z-10 w-11 h-11 rounded-full bg-[#0F9D58]/10 border border-[#0F9D58]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(15,157,88,0.2)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 128 128"
                    className="h-5 w-5"
                  >
                    <path fill="#0061FE" d="M0 0h128v128H0z" />
                    <path
                      fill="#F7F5F2"
                      d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Feature 5: Lightning Fast */}
          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-3 lg:col-span-4 row-span-1 relative overflow-hidden animate-enter border-border gap-0"
            style={{ animationDelay: "800ms" }}
          >
            <div className="hover-reveal" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full group-hover:bg-yellow-500/20 transition-colors duration-500" />
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-medium tracking-tight mb-1 text-foreground">
                Lightning Fast
              </CardTitle>
              <CardDescription className="text-xs mb-6 text-muted-foreground">
                Edge network processing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full bg-card/50 h-1.5 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-yellow-500/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-linear" />
                <div className="bg-yellow-500 h-full w-2/3 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.6)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                <span>LATENCY</span>
                <span className="text-yellow-500">24ms</span>
              </div>
            </CardContent>
          </Card>
          {/* Feature 6: Secure Storage */}

          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-2 lg:col-span-4 row-span-1 relative overflow-hidden animate-enter border-border"
            style={{ animationDelay: "900ms" }}
          >
            <div className="hover-reveal" />
            <CardHeader className="p-0">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 shrink-0">
                  <div className="absolute inset-0 bg-green-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-full h-full rounded-xl bg-card border border-border/20 flex items-center justify-center group-hover:border-green-500/30 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-green-500 transition-all duration-300 group-hover:scale-110" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-base">Secure Storage</CardTitle>
                  <CardDescription className="text-xs">
                    AES-256 encryption.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Feature 7: Smart Org */}
          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-4 lg:col-span-8 row-span-1 relative overflow-hidden animate-enter border-border"
            style={{ animationDelay: "1000ms" }}
          >
            <div className="hover-reveal" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardHeader className="p-0 md:flex-1">
                <CardTitle className="text-xl font-medium tracking-tight mb-2 text-foreground">
                  Smart Tags
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Automatic metadata extraction and categorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex flex-wrap gap-3 md:items-center md:justify-end">
                <span className="px-3 py-1.5 rounded-md bg-secondary/20 border border-border/30 text-xs text-foreground font-medium hover:scale-105 hover:bg-secondary hover:border-primary/30 hover:text-primary transition-all cursor-default">
                  #finance
                </span>
                <span className="px-3 py-1.5 rounded-md bg-secondary/20 border border-border/30 text-xs text-foreground font-medium hover:scale-105 hover:bg-secondary hover:border-primary/30 hover:text-primary transition-all cursor-default">
                  #contracts
                </span>
                <span className="px-3 py-1.5 rounded-md bg-secondary/20 border border-border/30 text-xs text-foreground font-medium hover:scale-105 hover:bg-secondary hover:border-primary/30 hover:text-primary transition-all cursor-default">
                  #invoices
                </span>
                <span className="px-3 py-1.5 rounded-md bg-secondary/20 border border-border/30 text-xs text-foreground font-medium hover:scale-105 hover:bg-secondary hover:border-primary/30 hover:text-primary transition-all cursor-default">
                  #urgent
                </span>
              </CardContent>
            </div>
          </Card>
          {/* Feature 8: Collaboration */}
          <Card
            className="group bento-card rounded-3xl p-6 md:col-span-6 lg:col-span-4 row-span-1 relative overflow-hidden animate-enter border-border gap-0"
            style={{ animationDelay: "1100ms" }}
          >
            <div className="hover-reveal" />
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-medium tracking-tight text-foreground flex items-center justify-between">
                <span>Collaboration</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-500 uppercase font-bold tracking-wide">
                    Live
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3 overflow-hidden pl-1">
                  <div className="relative h-9 w-9 rounded-full ring-2 ring-border bg-muted flex items-center justify-center text-xs text-foreground font-medium hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                    JD
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                  </div>
                  <div className="relative h-9 w-9 rounded-full ring-2 ring-border bg-muted flex items-center justify-center text-xs text-foreground font-medium hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                    AS
                  </div>
                  <div className="relative h-9 w-9 rounded-full ring-2 ring-border bg-muted flex items-center justify-center text-xs text-foreground font-medium hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                    MR
                  </div>
                </div>
                <button className="h-9 w-9 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors hover:bg-foreground/5">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-muted-foreground text-xs mt-4 group-hover:text-muted-foreground transition-colors">
                Shared workspace for teams.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

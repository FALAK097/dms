"use client";

import {
  MessageSquare,
  Sparkles,
  Cloud,
  Lock,
  Zap,
  Search,
  FileText,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat with Documents",
    description:
      "Ask questions and get instant answers from your documents using advanced AI",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: Sparkles,
    title: "Automatic OCR",
    description:
      "Extract text from PDFs automatically with Google Gemini OCR technology",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Find exactly what you need with AI-powered vector search across all documents",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Automatically sync with Dropbox and Google Drive for seamless access",
    gradient: "from-orange-500/10 to-yellow-500/10",
    iconColor: "text-orange-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Background processing with QStash ensures your documents are ready in minutes",
    gradient: "from-cyan-500/10 to-blue-500/10",
    iconColor: "text-cyan-500",
  },
  {
    icon: Lock,
    title: "Secure Storage",
    description:
      "Enterprise-grade security with encrypted storage and signed URLs",
    gradient: "from-red-500/10 to-rose-500/10",
    iconColor: "text-red-500",
  },
  {
    icon: FileText,
    title: "Smart Organization",
    description:
      "Automatic tagging, categorization, and metadata extraction for easy management",
    gradient: "from-indigo-500/10 to-violet-500/10",
    iconColor: "text-indigo-500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Share documents, add comments, and collaborate with your team seamlessly",
    gradient: "from-teal-500/10 to-green-500/10",
    iconColor: "text-teal-500",
  },
];

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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group relative h-full overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-lg">
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                  />

                  <CardContent className="relative p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background/50">
                      <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>

                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

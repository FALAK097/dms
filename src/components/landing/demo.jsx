"use client";

import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { Play } from "lucide-react";

export function Demo() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              See DMS in Action
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch how easy it is to manage and chat with your documents
            </p>
          </div>

          <Card className="relative aspect-video overflow-hidden border-border/50 bg-muted">
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Demo video coming soon</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

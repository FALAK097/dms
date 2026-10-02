"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "motion/react";

const faqs = [
  {
    question: "Which documents can I add?",
    answer: "DMS currently supports PDF uploads. You can also bring PDF files in from a connected Dropbox folder.",
  },
  {
    question: "Can I connect cloud storage?",
    answer: "Dropbox folder sync is available. Google Drive integration is still in development.",
  },
  {
    question: "Can I ask questions about my files?",
    answer: "Yes. Ask questions in chat and follow the answer back to its cited document.",
  },
];

export function FAQ() {
  return (
    <section className="landing-faq py-14 md:py-20">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-8">
            <p className="landing-eyebrow"><span />GOOD TO KNOW</p>
            <h2 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              A few details.
            </h2>
            <p className="text-base text-muted-foreground">
              What DMS supports today.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: index * 0.025 }}
              >
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

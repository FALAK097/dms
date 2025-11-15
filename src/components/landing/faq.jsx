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
    question: "How does AI chat with documents work?",
    answer:
      "Our AI uses advanced natural language processing to understand your documents. When you ask a question, it searches through your documents using semantic search, finds relevant information, and provides accurate answers with source citations.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "Currently, we support PDF files with automatic OCR. Support for Word documents, Excel spreadsheets, and other formats is coming soon.",
  },
  {
    question: "How long does document processing take?",
    answer:
      "Most documents are processed within 2-3 minutes. Large documents may take up to 5 minutes. We use background processing with QStash to ensure your documents are ready quickly without blocking your workflow.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes! We use enterprise-grade security with encrypted storage, signed URLs, and secure authentication. Your documents are stored in DigitalOcean Spaces with industry-standard encryption.",
  },
  {
    question: "Can I sync documents from cloud storage?",
    answer:
      "Yes! We support automatic syncing with Dropbox, and Google Drive integration is coming soon. Your documents are automatically processed and ready to chat whenever they're added to your synced folders.",
  },
  {
    question: "What happens if document processing fails?",
    answer:
      "Our system automatically retries failed documents up to 3 times. If processing still fails, you'll receive a notification with details. You can manually retry processing from your dashboard.",
  },
  {
    question: "Do you offer team collaboration features?",
    answer:
      "Team collaboration features are currently in development. You'll soon be able to share documents, add comments, and manage team permissions.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes! We offer a free forever plan with generous limits. Perfect for individuals and small teams getting started with document management.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about DMS
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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

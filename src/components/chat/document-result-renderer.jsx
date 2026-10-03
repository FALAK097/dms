"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";
import { z } from "zod";
import { defineCatalog, validateSpec } from "@json-render/core";
import { defineRegistry, Renderer } from "@json-render/react";
import { schema } from "@json-render/react/schema";

const catalog = defineCatalog(schema, {
  components: {
    DocumentResults: {
      description: "A compact list of matching documents with secure app links.",
      props: z.object({
        title: z.string(),
        totalCount: z.number(),
        documents: z.array(z.object({
          id: z.string(),
          name: z.string(),
          status: z.string().optional(),
        })),
      }),
    },
  },
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  components: {
    DocumentResults: ({ props }) => (
      <section className="overflow-hidden rounded-xl border bg-background/80" aria-label="Document results">
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4">
          <h3 className="text-xs font-semibold text-foreground">{props.title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {props.totalCount}
          </span>
        </div>
        {props.documents.length > 0 ? (
          <ul className="divide-y">
            {props.documents.map((document) => (
              <li key={document.id}>
                <Link
                  href={`/dashboard/document?documentId=${encodeURIComponent(document.id)}`}
                  className="group flex min-h-12 items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{document.name}</span>
                    {document.status && <span className="mt-0.5 block text-xs text-muted-foreground">{document.status}</span>}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">No matching documents found.</p>
        )}
        {props.totalCount > props.documents.length && (
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5 text-xs text-muted-foreground sm:px-4">
            <span>Showing {props.documents.length} of {props.totalCount}</span>
            <Link href="/dashboard" className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              View library
            </Link>
          </div>
        )}
      </section>
    ),
  },
});

export function DocumentResultRenderer({ title, documents = [], totalCount }) {
  const spec = useMemo(() => {
    const safeDocuments = documents
      .filter((document) => typeof document?.id === "string" && typeof document?.name === "string")
      .map(({ id, name, status }) => ({
        id,
        name: name.replace(/\.[^/.]+$/, ""),
        ...(typeof status === "string" ? { status } : {}),
      }));
    const generatedSpec = {
      root: "results",
      elements: {
        results: {
          type: "DocumentResults",
          props: { title, totalCount: totalCount ?? safeDocuments.length, documents: safeDocuments.slice(0, 8) },
          children: [],
        },
      },
    };

    return validateSpec(generatedSpec).valid ? generatedSpec : null;
  }, [documents, title, totalCount]);

  if (!spec) return null;
  return <Renderer spec={spec} registry={registry} />;
}

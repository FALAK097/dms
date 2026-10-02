"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

const documents = [
  { title: "Policy handbook.pdf", detail: "24 pages", selected: true },
  { title: "Operations guide.pdf", detail: "18 pages" },
  { title: "Quarterly review.pdf", detail: "32 pages" },
];

function WorkspacePreview() {
  return (
    <div className="landing-preview" aria-label="Preview of the DMS document workspace">
      <div className="landing-preview-toolbar">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="landing-window-dot" />
          <span className="landing-window-dot" />
          <span className="landing-window-dot" />
        </div>
        <span className="landing-preview-title">Your workspace</span>
        <span className="landing-preview-live"><span />Workspace preview</span>
      </div>
      <div className="landing-preview-layout">
        <aside className="landing-preview-files" aria-label="Sample document list">
          <div className="landing-preview-section">DOCUMENTS <span>03</span></div>
          <div className="landing-preview-search"><Search className="size-3.5" /><span>Find a document</span><kbd>⌘ K</kbd></div>
          <div className="landing-preview-file-list">
            {documents.map((document) => (
              <div className={`landing-preview-file ${document.selected ? "is-selected" : ""}`} key={document.title}>
                <FileText className="size-4 shrink-0" />
                <span className="min-w-0"><strong>{document.title}</strong><small>{document.detail}</small></span>
              </div>
            ))}
          </div>
          <div className="landing-preview-storage"><span>Your library</span><span>3 sample PDFs</span></div>
        </aside>
        <section className="landing-preview-document" aria-label="Sample document preview">
          <div className="landing-preview-document-heading"><div><FileText className="size-4" /><strong>Policy handbook.pdf</strong></div><span>Page 4 of 24</span></div>
          <div className="landing-paper">
            <span className="landing-paper-kicker">EMPLOYEE HANDBOOK</span>
            <strong className="landing-paper-heading">Terms &amp; conditions</strong>
            <span className="landing-paper-line w-4/5" /><span className="landing-paper-line" /><span className="landing-paper-line w-11/12" />
            <strong className="landing-paper-subheading">Renewal and notice</strong>
            <span className="landing-paper-line" /><span className="landing-paper-line w-11/12" />
            <span className="landing-paper-highlight">Either party may end this agreement with 30 days’ written notice before renewal.</span>
            <span className="landing-paper-line" /><span className="landing-paper-line w-4/5" />
            <span className="landing-paper-line w-11/12" /><span className="landing-paper-line w-3/5" />
            <span className="landing-paper-page">04</span>
          </div>
        </section>
        <section className="landing-preview-assistant" aria-label="Sample document answer">
          <div className="landing-assistant-heading"><div><Sparkles className="size-4" /><strong>Ask your documents</strong></div><span>NEW CHAT</span></div>
          <div className="landing-chat-question">What does the renewal clause require?</div>
          <div className="landing-chat-answer"><span>From your documents</span><p>The agreement renews for one year unless either party gives 30 days’ written notice before renewal.</p><div className="landing-citation"><FileText className="size-3.5" /><span>Policy handbook.pdf</span><span>Page 4</span></div></div>
          <div className="landing-chat-input"><span>Ask a follow-up…</span><span className="landing-chat-send"><ArrowRight className="size-3.5" /></span></div>
        </section>
      </div>
    </div>
  );
}

export function Hero() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();

  return (
    <section className="landing-hero">
      <div className="landing-container">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span />DOCUMENTS, IN CONTEXT</p>
          <h1>Every document.<br /><span>One clear answer.</span></h1>
          <p className="landing-hero-description">Keep your files together, find the detail you need, and ask questions with answers grounded in your documents.</p>
          <div className="landing-hero-actions">
            {!isPending && session ? (
              <Button size="lg" asChild className="landing-cta"><Link href="/dashboard">Open your workspace<ArrowRight className="size-4" /></Link></Button>
            ) : (
              <Button size="lg" onClick={openAuthModal} className="landing-cta cursor-pointer">Get started<ArrowRight className="size-4" /></Button>
            )}
            <Link className="landing-secondary-link" href="#how-it-works">See how it works</Link>
          </div>
        </div>
        <WorkspacePreview />
      </div>
    </section>
  );
}

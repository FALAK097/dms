"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

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
        <figure className="landing-product-shot landing-document-shot">
          <picture className="landing-product-picture">
            <source media="(max-width: 600px)" srcSet="/images/showcase/documents-mobile.png" />
            <Image src="/images/showcase/documents-desktop.png" alt="DMS document library showing search, upload controls, and sample PDF files" width={1440} height={960} priority sizes="(max-width: 600px) 100vw, 1220px" />
          </picture>
          <figcaption>Document library · sample files</figcaption>
        </figure>
      </div>
    </section>
  );
}

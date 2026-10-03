"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function FinalCTA() {
  const { data: session, isPending } = useSession();
  const { openAuthModal } = useAuthModal();

  return (
    <section className="landing-final-cta">
      <div className="landing-container landing-final-cta-inner">
        <div>
          <p className="landing-eyebrow"><span />A CLEARER WAY THROUGH YOUR FILES</p>
          <h2>Bring a document.<br />Find your next answer.</h2>
        </div>
        {!isPending && session ? (
          <Button size="lg" asChild className="landing-cta"><Link href="/dashboard">Open your workspace<ArrowRight className="size-4" /></Link></Button>
        ) : (
          <Button size="lg" onClick={openAuthModal} className="landing-cta cursor-pointer">Get started<ArrowRight className="size-4" /></Button>
        )}
      </div>
    </section>
  );
}

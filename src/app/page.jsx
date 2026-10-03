import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { ChatShowcase } from "@/components/landing/chat-showcase";
import { Footer } from "@/components/landing/footer";
import { FinalCTA } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Integrations } from "@/components/landing/integrations";
import { Navbar } from "@/components/landing/navbar";

export const metadata = {
  title: "DMS | Documents, in context",
  description:
    "Organize PDF documents, connect Dropbox, and ask questions with answers linked to their sources.",
};

export default function Home() {
  return (
    <div className="landing-page min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ChatShowcase />
        <Integrations />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

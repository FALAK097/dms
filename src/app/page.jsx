import { Demo } from "@/components/landing/demo";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
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
        {/* <Demo /> */}
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

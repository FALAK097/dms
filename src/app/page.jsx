import { Demo } from "@/components/landing/demo";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";

export const metadata = {
  title: "DMS - AI-Powered Document Management",
  description:
    "Upload, organize, and chat with your documents using AI. Automatic OCR, smart search, and seamless cloud sync—all in one place.",
};

export default function Home() {
  return (
    <div className="min-h-screen">
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

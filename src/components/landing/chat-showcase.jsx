import Image from "next/image";
import { Check, FileText, MessageSquareText } from "lucide-react";

export function ChatShowcase() {
  return (
    <section className="landing-chat-showcase" aria-labelledby="landing-chat-title">
      <div className="landing-container landing-chat-showcase-grid">
        <div className="landing-chat-copy">
          <p className="landing-eyebrow"><span />ANSWERS WITH A WAY BACK</p>
          <h2 id="landing-chat-title">Ask in plain language.<br />Open the source.</h2>
          <p>Ask a question about your library, follow the response as it streams, and open the cited document when you want to check the detail for yourself.</p>
          <ul>
            <li><MessageSquareText aria-hidden="true" /><span>One conversation, focused on your documents</span></li>
            <li><FileText aria-hidden="true" /><span>Source links stay close to each answer</span></li>
            <li><Check aria-hidden="true" /><span>Review the original before you act</span></li>
          </ul>
        </div>
        <figure className="landing-product-shot landing-chat-shot">
          <picture className="landing-product-picture">
            <Image src="/images/showcase/chat-desktop.png" alt="DMS chat showing a document question, a grounded answer, and its source" width={1440} height={960} sizes="(max-width: 850px) 100vw, 720px" />
          </picture>
          <figcaption>Document chat · sample conversation</figcaption>
        </figure>
      </div>
    </section>
  );
}

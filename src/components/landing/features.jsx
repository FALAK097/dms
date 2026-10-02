import { FileUp, Search, MessageSquareText } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Bring your files together",
    description: "Upload documents or connect your Dropbox workspace.",
    Icon: FileUp,
  },
  {
    number: "02",
    title: "Find what matters",
    description: "Search across your library and open the document you need.",
    Icon: Search,
  },
  {
    number: "03",
    title: "Ask with confidence",
    description: "Get answers grounded in your files and return to the source.",
    Icon: MessageSquareText,
  },
];

export function Features() {
  return (
    <section id="how-it-works" className="landing-process">
      <div className="landing-container">
        <div className="landing-process-heading">
          <p className="landing-eyebrow"><span />A SIMPLE WORKFLOW</p>
          <h2>From a folder full of files<br className="hidden sm:block" /> to the detail you need.</h2>
        </div>
        <div className="landing-process-grid">
          {steps.map(({ number, title, description, Icon }) => (
            <article key={number} className="landing-step">
              <div className="landing-step-top"><span>{number}</span><Icon className="size-5" strokeWidth={1.7} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

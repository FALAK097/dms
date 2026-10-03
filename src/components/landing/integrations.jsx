import { Check, Clock3, FileUp } from "lucide-react";
import Link from "next/link";

const options = [
  { Icon: FileUp, name: "PDF upload", status: "Available", detail: "Add PDFs directly to your document library.", available: true },
  { Icon: Check, name: "Dropbox", status: "Available", detail: "Connect a Dropbox folder and bring files into DMS.", available: true },
  { Icon: Clock3, name: "Google Drive", status: "In development", detail: "Drive connection is being built.", available: false },
];

export function Integrations() {
  return (
    <section className="landing-integrations" id="connections" aria-labelledby="landing-integrations-title">
      <div className="landing-container">
        <div className="landing-integrations-heading">
          <div>
            <p className="landing-eyebrow"><span />FILES THAT FIT YOUR WORKFLOW</p>
            <h2 id="landing-integrations-title">Start with the files you have.</h2>
          </div>
          <p>Upload PDFs directly or connect a storage provider. Availability is shown clearly, so you know what works today.</p>
        </div>
        <div className="landing-integrations-grid">
          {options.map(({ Icon, name, status, detail, available }) => (
            <article className="landing-integration-card" key={name}>
              <div className="landing-integration-icon"><Icon aria-hidden="true" /></div>
              <div className="landing-integration-status" data-available={available}>{status}</div>
              <h3>{name}</h3>
              <p>{detail}</p>
              {name === "Dropbox" ? <Link className="landing-integration-link" href="/settings">Connect in settings →</Link> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

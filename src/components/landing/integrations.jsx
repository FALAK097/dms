import Link from "next/link";

const options = [
  { Icon: PdfMark, icon: "pdf", name: "PDF upload", status: "Available", detail: "Add PDFs directly to your document library.", available: true },
  { Icon: DropboxMark, icon: "dropbox", name: "Dropbox", status: "Available", detail: "Connect a Dropbox folder and bring files into DMS.", available: true },
  { Icon: DriveMark, icon: "drive", name: "Google Drive", status: "In development", detail: "Drive connection is being built.", available: false },
];

function PdfMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M10 3.5h10.5L28 11v19.5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-25a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M20 4v7h7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <text x="18" y="25" fill="currentColor" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="7" fontWeight="700" letterSpacing=".2" textAnchor="middle">PDF</text>
    </svg>
  );
}

function DropboxMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 36" fill="none" aria-hidden="true">
      <path d="m10 2 9 6-9 6-9-6 9-6Zm20 0 9 6-9 6-9-6 9-6ZM10 16l9 6-9 6-9-6 9-6Zm20 0 9 6-9 6-9-6 9-6Zm-10 7 9 6-9 6-9-6 9-6Z" fill="currentColor" />
    </svg>
  );
}

function DriveMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 36 32" fill="none" aria-hidden="true">
      <path d="M12.2 2h7.3l13 22.4h-7.3L12.2 2Z" fill="currentColor" />
      <path d="M12.2 2h7.3L6.6 24.4H.2L12.2 2Z" fill="currentColor" />
      <path d="M.2 24.4h24.9l-3.8 6.5H4L.2 24.4Z" fill="currentColor" />
    </svg>
  );
}

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
          {options.map(({ Icon, icon, name, status, detail, available }) => (
            <article className="landing-integration-card" key={name}>
              <Icon className={`landing-integration-icon landing-integration-icon-${icon}`} />
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

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
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 128 128" aria-hidden="true">
      <path fill="#0061FE" d="M0 0h128v128H0z" />
      <path fill="#F7F5F2" d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5 104.598 44.75 84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z" />
    </svg>
  );
}

function DriveMark({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78" aria-hidden="true">
      <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" />
      <path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" />
      <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z" />
      <path fill="#00832d" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" />
      <path fill="#2684fc" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" />
      <path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" />
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

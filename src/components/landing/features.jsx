import { HugeiconsIcon } from "@hugeicons/react";
import { Clock03Icon, FileAttachmentIcon, FolderLockedIcon, Message01Icon, Search01Icon, Tick01Icon, WorkflowCircle01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons";

const features = [
  {
    title: "AI chat with documents",
    description: "Ask questions and follow answers back to their source documents.",
    Icon: Message01Icon,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    visual: "chat",
  },
  {
    title: "Search your library",
    description: "Find a document by the information it contains, then open the source.",
    Icon: Search01Icon,
    iconClass: "text-blue-600 dark:text-blue-400",
    visual: "search",
  },
  {
    title: "PDF text extraction",
    description: "Make text-based and scanned PDFs easier to search and use.",
    Icon: FileAttachmentIcon,
    iconClass: "text-amber-600 dark:text-amber-400",
    visual: "pdf",
  },
  {
    title: "Cloud storage connections",
    description: "Sync a Dropbox folder. Google Drive connection is coming soon.",
    Icon: WorkflowCircle01Icon,
    iconClass: "text-violet-600 dark:text-violet-400",
    visual: "cloud",
  },
  {
    title: "Background processing",
    description: "Uploads are queued while document processing runs in the background.",
    Icon: Clock03Icon,
    iconClass: "text-sky-600 dark:text-sky-400",
    visual: "queue",
  },
  {
    title: "Secure storage",
    description: "Private user-scoped files with time-limited links for file access.",
    Icon: ShieldCheckIcon,
    iconClass: "text-rose-600 dark:text-rose-400",
    visual: "storage",
  },
];

function MiniPreview({ visual }) {
  if (visual === "chat") {
    return (
      <div className="flex h-full flex-col justify-center gap-3" aria-hidden="true">
        <div className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-primary/10 px-3 py-2 text-xs text-foreground">
          Ask a question about a file
        </div>
        <div className="flex max-w-[88%] items-start gap-2 rounded-xl rounded-tl-sm border border-border bg-background px-3 py-2.5">
          <HugeiconsIcon icon={Message01Icon} className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <div className="w-full space-y-1.5">
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-3/4 rounded bg-muted" />
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <HugeiconsIcon icon={FileAttachmentIcon} className="size-3" /> Source document
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (visual === "search") {
    return (
      <div className="flex h-full flex-col justify-center gap-2" aria-hidden="true">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Search01Icon} className="size-3.5" /> Search documents
        </div>
        {["Project overview.pdf", "Meeting notes.pdf"].map((name) => (
          <div key={name} className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2">
            <HugeiconsIcon icon={FileAttachmentIcon} className="size-3.5 text-primary" />
            <span className="text-xs text-foreground">{name}</span>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "pdf") {
    return (
      <div className="flex h-full items-center gap-3 rounded-lg border border-border bg-background p-3" aria-hidden="true">
        <HugeiconsIcon icon={FileAttachmentIcon} className="size-7 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
          <div className="h-1.5 w-5/6 rounded bg-muted-foreground/20" />
          <div className="h-1.5 w-2/3 rounded bg-muted-foreground/20" />
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
          <HugeiconsIcon icon={Tick01Icon} className="size-3" /> Text ready
        </span>
      </div>
    );
  }

  if (visual === "cloud") {
    return (
      <div className="flex h-full items-center justify-around rounded-lg border border-border bg-background px-3 py-4" aria-hidden="true">
        <div className="flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" className="size-8" aria-hidden="true">
            <path fill="#0061FE" d="M0 0h128v128H0z" />
            <path fill="#F7F5F2" d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z" />
          </svg>
          <span className="text-[10px] text-foreground">Dropbox</span>
        </div>
        <div className="h-px w-10 bg-border" />
        <div className="flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78" className="h-8 w-9" aria-hidden="true">
            <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" />
            <path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" />
            <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z" />
            <path fill="#00832d" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" />
            <path fill="#2684fc" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" />
            <path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" />
          </svg>
          <span className="text-[10px] text-foreground">Google Drive</span>
          <span className="text-[9px] text-muted-foreground">Coming soon</span>
        </div>
      </div>
    );
  }

  if (visual === "queue") {
    return (
      <div className="flex h-full flex-col justify-center gap-2" aria-hidden="true">
        {["Uploaded file.pdf", "Another document.pdf"].map((name, index) => (
          <div key={name} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <HugeiconsIcon icon={FileAttachmentIcon} className="size-3.5 text-primary" />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
            <span className="text-[10px] text-muted-foreground">{index === 0 ? "Processing" : "Queued"}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-lg border border-border bg-background p-3" aria-hidden="true">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={FolderLockedIcon} className="size-4 text-primary" />
        <span className="text-xs font-medium text-foreground">Private document storage</span>
        <HugeiconsIcon icon={Tick01Icon} className="ml-auto size-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-2">
        <HugeiconsIcon icon={Clock03Icon} className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Temporary links expire after 5 minutes</span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Made for your documents</p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to manage documents
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, Icon, iconClass, visual }) => (
            <article
              key={title}
              className="group flex min-h-[264px] flex-col rounded-2xl border border-border bg-card p-5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/35 hover:bg-accent/30 hover:shadow-sm focus-within:border-primary/35 focus-within:shadow-sm sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <HugeiconsIcon icon={Icon} className={`size-6 ${iconClass}`} aria-hidden="true" />
                <span className="mt-1 size-1.5 rounded-full bg-border transition-colors duration-200 group-hover:bg-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-base font-medium tracking-tight text-foreground sm:text-lg">{title}</h3>
              <p className="mt-1.5 min-h-10 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <div className="mt-auto h-[104px] overflow-hidden pt-4 [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:scale-[1.04] motion-reduce:transition-none">
                <MiniPreview visual={visual} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

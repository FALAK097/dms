import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentViewerWrapper } from "@/components/document/document-viewer-wrapper";

export default async function DocumentViewerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <DocumentViewerWrapper />;
}

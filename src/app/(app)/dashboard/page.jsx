import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = {
  title: "Dashboard",
  description:
    "View and manage all your documents in one place. Upload, organize, and access your files easily.",
};

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return <DashboardClient />;
}

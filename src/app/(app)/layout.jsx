import { cookies } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";

export const metadata = {
  title: "DMS",
  description: "Document Management System",
};

export default async function AppLayout({ children }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar>{children}</AppSidebar>
    </SidebarProvider>
  );
}

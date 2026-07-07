import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";

export const metadata = {
  title: "Chat",
  description:
    "Chat with your documents using AI. Ask questions and get instant answers from your uploaded files.",
};

export default async function ChatPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full p-8 text-muted-foreground">Loading chat...</div>}>
      <ChatWindow />
    </Suspense>
  );
}

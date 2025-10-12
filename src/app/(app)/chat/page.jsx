import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";
import { Skeleton } from "@/components/ui/skeleton";

function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b p-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={i % 2 === 0 ? "flex justify-end" : "flex"}>
            <Skeleton className="h-20 w-3/4 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ChatPage({ searchParams }) {
  const params = await searchParams;
  const docId = params?.docId || null;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatWindow docId={docId} />
    </Suspense>
  );
}

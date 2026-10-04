"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatStore } from "@/stores/chat-store";

export function NewChatButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentConvId = searchParams.get("conversationId");
  const { state, setOpenMobile } = useSidebar();
  const { startNewChat } = useChatStore();

  const handleNewChat = () => {
    startNewChat();
    setOpenMobile(false);

    router.push("/chat");
  };

  const isNewChat = pathname === "/chat" && !currentConvId;

  if (state === "collapsed") {
    return (
      <div className="px-2 py-2">
        <Button
          onClick={handleNewChat}
          variant={isNewChat ? "secondary" : "outline"}
          aria-label="New chat"
          size="icon"
          className="w-full"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Button
        onClick={handleNewChat}
        variant={isNewChat ? "secondary" : "outline"}
        className="w-full justify-start gap-2"
        size="sm"
      >
        <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
        New Chat
      </Button>
    </div>
  );
}

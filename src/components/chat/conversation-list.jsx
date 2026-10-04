"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Edit02Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Dialog } from "@base-ui/react/dialog";
import { conversationAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { BaseChatButton } from "./base-chat-button";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatStore } from "@/stores/chat-store";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function groupConversationsByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.createdAt);
    const convDateOnly = new Date(
      convDate.getFullYear(),
      convDate.getMonth(),
      convDate.getDate()
    );

    if (convDateOnly.getTime() === today.getTime()) {
      groups.Today.push(conv);
    } else if (convDateOnly.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(conv);
    } else if (convDate >= sevenDaysAgo) {
      groups["Last 7 days"].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return groups;
}

export function ConversationList() {
  const router = useRouter();
  const currentId = useSearchParams().get("conversationId");
  const { state, setOpenMobile } = useSidebar();
  const refreshTrigger = useChatStore((state) => state.refreshTrigger);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    let ignored = false;
    conversationAPI.getAll().then(({ conversations }) => {
      if (!ignored) { setConversations(conversations || []); setFailed(false); }
    }).catch(() => { if (!ignored) setFailed(true); })
      .finally(() => { if (!ignored) setLoading(false); });
    return () => { ignored = true; };
  }, [currentId, refreshTrigger, retry]);

  async function rename(event) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!renaming || !nextTitle || busy) return;
    setBusy(true);
    try {
      const { conversation } = await conversationAPI.updateTitle(renaming.id, nextTitle);
      setConversations((items) => items.map((item) => item.id === conversation.id ? { ...item, title: conversation.title } : item));
      setRenaming(null);
      toast.success("Conversation renamed");
    } catch { toast.error("Could not rename the conversation."); }
    finally { setBusy(false); }
  }

  async function remove(event) {
    event.preventDefault();
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await conversationAPI.delete(deleting.id);
      setConversations((items) => items.filter((item) => item.id !== deleting.id));
      if (currentId === deleting.id) { useChatStore.getState().startNewChat(); router.push("/chat"); }
      setDeleting(null);
      toast.success("Conversation deleted");
    } catch { toast.error("Could not delete the conversation."); }
    finally { setBusy(false); }
  }

  if (state === "collapsed") return null;
  const groups = groupConversationsByDate(conversations.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())));
  return (
    <>
      <div className="space-y-4 overflow-y-auto px-3 py-2">
        <Input aria-label="Search conversations" placeholder="Search chats" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 bg-sidebar text-xs" />
        {loading ? <div role="status" aria-label="Loading conversations" className="space-y-2">{[1, 2, 3].map((key) => <div key={key} className="h-9 animate-pulse rounded-md bg-muted" />)}</div> : failed ? <div role="alert" className="text-xs text-muted-foreground">Could not load chats. <button type="button" className="underline" onClick={() => setRetry((n) => n + 1)}>Try again</button></div> : !conversations.length ? <p className="px-2 text-xs text-muted-foreground">Your conversations will appear here.</p> : !Object.values(groups).some((items) => items.length) ? <p className="px-2 text-xs text-muted-foreground">No matching conversations.</p> : Object.entries(groups).map(([group, items]) => items.length > 0 && (
          <section key={group} aria-label={group}>
            <h4 className="mb-1 px-2 text-xs font-medium text-muted-foreground">{group}</h4>
            {items.map((conversation) => (
              <div key={conversation.id} className={cn("group flex items-center rounded-md", currentId === conversation.id && "bg-sidebar-accent")}>
                <Link href={`/chat?conversationId=${encodeURIComponent(conversation.id)}`} aria-current={currentId === conversation.id ? "page" : undefined} onClick={() => setOpenMobile(false)} className="min-w-0 flex-1 truncate rounded-md px-2 py-2.5 text-sm hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={conversation.title}>{conversation.title}</Link>
                <Menu.Root>
                  <Menu.Trigger render={<BaseChatButton variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${conversation.title}`} />}><HugeiconsIcon icon={MoreHorizontalIcon} size={16} /></Menu.Trigger>
                  <Menu.Portal><Menu.Positioner side="right" align="start" sideOffset={6} className="z-50"><Menu.Popup className="min-w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none">
                    <Menu.Item className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm data-highlighted:bg-accent" onClick={() => { setTitle(conversation.title); setRenaming(conversation); }}><HugeiconsIcon icon={Edit02Icon} size={16} />Rename</Menu.Item>
                    <Menu.Item className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive data-highlighted:bg-accent" onClick={() => setDeleting(conversation)}><HugeiconsIcon icon={Delete02Icon} size={16} />Delete</Menu.Item>
                  </Menu.Popup></Menu.Positioner></Menu.Portal>
                </Menu.Root>
              </div>
            ))}
          </section>
        ))}
      </div>
      <Dialog.Root open={Boolean(renaming)} onOpenChange={(open) => { if (!open && !busy) setRenaming(null); }}>
        <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" /><Dialog.Popup initialFocus={titleRef} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">Rename conversation</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">Choose a title you can find in your chat history.</Dialog.Description>
          <form onSubmit={rename} className="mt-4 space-y-4">
            <Input ref={titleRef} aria-label="Conversation title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} disabled={busy} />
            <div className="flex justify-end gap-2"><Dialog.Close render={<BaseChatButton variant="outline" disabled={busy} />}>Cancel</Dialog.Close><BaseChatButton type="submit" disabled={busy || !title.trim()}>{busy ? "Saving…" : "Save"}</BaseChatButton></div>
          </form>
        </Dialog.Popup></Dialog.Portal>
      </Dialog.Root>
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete conversation?</AlertDialogTitle><AlertDialogDescription>“{deleting?.title}” and its messages will be permanently deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{busy ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { conversationAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatStore } from "@/stores/chat-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentConvId = searchParams.get("conversationId");
  const { state } = useSidebar();
  const { setCurrentConversation, clearCurrentConversation, refreshTrigger } =
    useChatStore();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { conversations: convs } = await conversationAPI.getAll();
      setConversations(convs || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (pathname === "/chat" && currentConvId) {
      const exists = conversations.some((c) => c.id === currentConvId);
      if (!exists) {
        fetchConversations();
      }
    }
  }, [currentConvId, pathname, conversations, fetchConversations]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchConversations();
    }
  }, [refreshTrigger, fetchConversations]);

  const handleConversationClick = (id) => {
    setCurrentConversation(id);
    router.push(`/chat?conversationId=${id}`);
  };

  const handleEditStart = (conv, e) => {
    if (e) e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleDoubleClick = (conv, e) => {
    e.stopPropagation();
    handleEditStart(conv);
  };

  const handleEditSave = async (id, e) => {
    e.stopPropagation();
    try {
      await conversationAPI.updateTitle(id, editTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle } : c))
      );
      setEditingId(null);
      toast.success("Title updated");
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title");
    }
  };

  const handleEditCancel = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const handleDeleteClick = (conv, e) => {
    e.stopPropagation();
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      await conversationAPI.delete(conversationToDelete.id);
      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationToDelete.id)
      );
      toast.success("Conversation deleted");

      if (currentConvId === conversationToDelete.id) {
        clearCurrentConversation();
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };
  if (loading) {
    if (state === "collapsed") {
      return <div className="h-10" />;
    }

    return (
      <div className="space-y-4 px-3 py-2">
        <div>
          <div className="mb-2 px-2">
            <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse" />
          </div>
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md px-2 py-2"
              >
                <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse shrink-0" />
                <div className="flex-1 h-4 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return null;
  }

  const groupedConversations = groupConversationsByDate(conversations);

  if (state === "collapsed") {
    return <div className="h-10" />;
  }

  return (
    <>
      <div className="space-y-4 px-3 py-2 overflow-y-auto scrollbar-hide">
        {Object.entries(groupedConversations).map(([group, convs]) => {
          if (convs.length === 0) return null;

          return (
            <div key={group}>
              <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                {group}
              </h4>
              <div className="space-y-1">
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleConversationClick(conv.id)}
                    onDoubleClick={(e) => handleDoubleClick(conv, e)}
                    className={cn(
                      "group/item flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors",
                      currentConvId === conv.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    {editingId === conv.id ? (
                      <div className="flex flex-1 items-center gap-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 text-sm"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => handleEditSave(conv.id, e)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={handleEditCancel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{conv.title}</span>
                        <div className="hidden group-hover/item:flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => handleEditStart(conv, e)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => handleDeleteClick(conv, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “{conversationToDelete?.title}”?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

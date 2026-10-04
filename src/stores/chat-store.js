import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  currentConversationId: null,

  refreshTrigger: 0,
  draftVersion: 0,
  startNewChat: () => set((state) => ({ currentConversationId: null, draftVersion: state.draftVersion + 1 })),

  setCurrentConversation: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  clearCurrentConversation: () => {
    set({ currentConversationId: null });
  },

  getCurrentConversationId: () => {
    return get().currentConversationId;
  },

  triggerConversationRefresh: () => {
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
  },
}));

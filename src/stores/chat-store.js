import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  currentConversationId: null,

  refreshTrigger: 0,

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

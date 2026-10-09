import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useChatStore = create(
  persist(
    (set, get) => ({
      currentConversationId: null,

      refreshTrigger: 0,
      draftVersion: 0,
      scrollPositions: {},
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

      setScrollPosition: (conversationId, scrollTop) =>
        set((state) =>
          state.scrollPositions[conversationId] === scrollTop
            ? state
            : { scrollPositions: { ...state.scrollPositions, [conversationId]: scrollTop } }
        ),

      getScrollPosition: (conversationId) => get().scrollPositions[conversationId],
    }),
    {
      name: "dms-chat-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ scrollPositions: state.scrollPositions }),
    }
  )
);

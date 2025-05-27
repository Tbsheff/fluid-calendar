import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Modal states
  shortcutsModalOpen: boolean;
  taskModalOpen: boolean;
  
  // Global UI preferences
  sidebarOpen: boolean;
  isHydrated: boolean;
}

interface UIActions {
  // Modal actions
  setShortcutsModalOpen: (open: boolean) => void;
  setTaskModalOpen: (open: boolean) => void;
  
  // Global UI actions
  setSidebarOpen: (open: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Convenience methods
  toggleSidebar: () => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  openTaskModal: () => void;
  closeTaskModal: () => void;
}

interface UIStore extends UIState, UIActions {}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      shortcutsModalOpen: false,
      taskModalOpen: false,
      sidebarOpen: true,
      isHydrated: false,

      // Modal actions
      setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
      setTaskModalOpen: (open) => set({ taskModalOpen: open }),
      
      // Global UI actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      
      // Convenience methods
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      openShortcutsModal: () => set({ shortcutsModalOpen: true }),
      closeShortcutsModal: () => set({ shortcutsModalOpen: false }),
      openTaskModal: () => set({ taskModalOpen: true }),
      closeTaskModal: () => set({ taskModalOpen: false }),
    }),
    {
      name: "ui-store",
      // Only persist UI preferences, not modal states
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
); 
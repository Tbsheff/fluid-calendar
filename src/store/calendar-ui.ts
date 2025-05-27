import { create } from "zustand";
import { persist } from "zustand/middleware";

type CalendarView = "day" | "week" | "month" | "multiMonth";

interface CalendarUIState {
  // Calendar view state
  currentDate: Date;
  view: CalendarView;
  
  // Calendar UI preferences
  sidebarOpen: boolean;
  isHydrated: boolean;
}

interface CalendarUIActions {
  // Date navigation
  setDate: (date: Date) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  
  // View management
  setView: (view: CalendarView) => void;
  
  // UI state
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setHydrated: (hydrated: boolean) => void;
}

interface CalendarUIStore extends CalendarUIState, CalendarUIActions {}

export const useCalendarUIStore = create<CalendarUIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDate: new Date(),
      view: "week",
      sidebarOpen: true,
      isHydrated: false,

      // Date navigation
      setDate: (date) => set({ currentDate: date }),
      goToToday: () => set({ currentDate: new Date() }),
      goToPrevious: () => {
        const { currentDate, view } = get();
        const newDate = new Date(currentDate);
        
        if (view === "month" || view === "multiMonth") {
          newDate.setMonth(newDate.getMonth() - 1);
        } else {
          const days = view === "day" ? 1 : 7;
          newDate.setDate(newDate.getDate() - days);
        }
        
        set({ currentDate: newDate });
      },
      goToNext: () => {
        const { currentDate, view } = get();
        const newDate = new Date(currentDate);
        
        if (view === "month" || view === "multiMonth") {
          newDate.setMonth(newDate.getMonth() + 1);
        } else {
          const days = view === "day" ? 1 : 7;
          newDate.setDate(newDate.getDate() + days);
        }
        
        set({ currentDate: newDate });
      },
      
      // View management
      setView: (view) => set({ view }),
      
      // UI state
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "calendar-ui-store",
      // Persist view preferences but not current date or hydration state
      partialize: (state) => ({
        view: state.view,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
); 
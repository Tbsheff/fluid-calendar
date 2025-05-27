import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FocusUIState {
  // Current focused task ID
  currentTaskId: string | null;
  
  // Processing state for UI feedback
  isProcessing: boolean;
  actionType: "complete" | "postpone" | "delete" | null;
  actionMessage: string | null;
  
  // Task queue order (just IDs)
  queuedTaskIds: string[];
}

interface FocusUIActions {
  // Task focus management
  setCurrentTask: (taskId: string | null) => void;
  switchToTask: (taskId: string) => void;
  
  // Processing state management
  startProcessing: (type: "complete" | "postpone" | "delete", message?: string) => void;
  stopProcessing: () => void;
  
  // Queue management
  setQueuedTaskIds: (taskIds: string[]) => void;
  addToQueue: (taskId: string) => void;
  removeFromQueue: (taskId: string) => void;
  
  // Convenience methods
  completeCurrentTask: () => void;
  postponeCurrentTask: (duration: string) => void;
}

interface FocusUIStore extends FocusUIState, FocusUIActions {}

export const useFocusUIStore = create<FocusUIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTaskId: null,
      isProcessing: false,
      actionType: null,
      actionMessage: null,
      queuedTaskIds: [],

      // Task focus management
      setCurrentTask: (taskId) => set({ currentTaskId: taskId }),
      switchToTask: (taskId) => set({ currentTaskId: taskId }),
      
      // Processing state management
      startProcessing: (type, message) => set({ 
        isProcessing: true, 
        actionType: type, 
        actionMessage: message || null 
      }),
      stopProcessing: () => set({ 
        isProcessing: false, 
        actionType: null, 
        actionMessage: null 
      }),
      
      // Queue management
      setQueuedTaskIds: (taskIds) => set({ queuedTaskIds: taskIds }),
      addToQueue: (taskId) => set((state) => ({
        queuedTaskIds: [...state.queuedTaskIds.filter(id => id !== taskId), taskId]
      })),
      removeFromQueue: (taskId) => set((state) => ({
        queuedTaskIds: state.queuedTaskIds.filter(id => id !== taskId)
      })),
      
      // Convenience methods
      completeCurrentTask: () => {
        const { currentTaskId, startProcessing } = get();
        if (currentTaskId) {
          startProcessing("complete", "Completing task...");
          // The actual completion will be handled by the component using tRPC
        }
      },
      postponeCurrentTask: (duration) => {
        const { currentTaskId, startProcessing } = get();
        if (currentTaskId) {
          startProcessing("postpone", `Postponing task for ${duration}...`);
          // The actual postponing will be handled by the component using tRPC
        }
      },
    }),
    {
      name: "focus-ui-store",
      // Persist current task and queue, but not processing state
      partialize: (state) => ({
        currentTaskId: state.currentTaskId,
        queuedTaskIds: state.queuedTaskIds,
      }),
    }
  )
); 
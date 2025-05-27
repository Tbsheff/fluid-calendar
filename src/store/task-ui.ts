import { create } from "zustand";
import { persist } from "zustand/middleware";

type TaskViewMode = "list" | "board";

interface TaskUIState {
  // Task page state
  viewMode: TaskViewMode;
  activeProject: string | null; // Project ID or "no-project"
  
  // Task modal state
  taskModalOpen: boolean;
  selectedTaskId: string | null;
  initialProjectId: string | null | undefined;
}

interface TaskUIActions {
  // View mode
  setViewMode: (mode: TaskViewMode) => void;
  toggleViewMode: () => void;
  
  // Project filtering
  setActiveProject: (projectId: string | null) => void;
  clearActiveProject: () => void;
  
  // Task modal
  openTaskModal: (taskId?: string, projectId?: string | null) => void;
  closeTaskModal: () => void;
  setSelectedTaskId: (taskId: string | null) => void;
  setInitialProjectId: (projectId: string | null | undefined) => void;
}

interface TaskUIStore extends TaskUIState, TaskUIActions {}

export const useTaskUIStore = create<TaskUIStore>()(
  persist(
    (set) => ({
      // Initial state
      viewMode: "list",
      activeProject: null,
      taskModalOpen: false,
      selectedTaskId: null,
      initialProjectId: undefined,

      // View mode
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () => set((state) => ({ 
        viewMode: state.viewMode === "list" ? "board" : "list" 
      })),
      
      // Project filtering
      setActiveProject: (projectId) => set({ activeProject: projectId }),
      clearActiveProject: () => set({ activeProject: null }),
      
      // Task modal
      openTaskModal: (taskId, projectId) => set({ 
        taskModalOpen: true,
        selectedTaskId: taskId || null,
        initialProjectId: projectId
      }),
      closeTaskModal: () => set({ 
        taskModalOpen: false,
        selectedTaskId: null,
        initialProjectId: undefined
      }),
      setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
      setInitialProjectId: (projectId) => set({ initialProjectId: projectId }),
    }),
    {
      name: "task-ui-store",
      // Persist view preferences but not modal state
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeProject: state.activeProject,
      }),
    }
  )
); 
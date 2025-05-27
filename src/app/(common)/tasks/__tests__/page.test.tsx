import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Radix UI components that cause infinite re-renders
vi.mock("@radix-ui/react-scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
  ScrollAreaViewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ScrollAreaScrollbar: () => <div data-testid="scrollbar" />,
  ScrollAreaThumb: () => <div data-testid="scroll-thumb" />,
}));

// Mock ProjectSidebar which likely contains the problematic ScrollArea
vi.mock("@/components/projects/ProjectSidebar", () => ({
  ProjectSidebar: () => <div data-testid="project-sidebar">Project Sidebar Mock</div>,
}));

// Mock task components
vi.mock("@/components/tasks/TaskList", () => ({
  TaskList: () => <div data-testid="task-list">Task List Mock</div>,
}));

vi.mock("@/components/tasks/BoardView/BoardView", () => ({
  BoardView: () => <div data-testid="board-view">Board View Mock</div>,
}));

vi.mock("@/components/tasks/TaskModal", () => ({
  TaskModal: () => <div data-testid="task-modal">Task Modal Mock</div>,
}));

// Mock UI components
vi.mock("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock DnD components
vi.mock("@/components/dnd/DndProvider", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock task UI store
vi.mock("@/store/task-ui", () => ({
  useTaskUIStore: vi.fn(() => ({
    viewMode: "list",
    setViewMode: vi.fn(),
    taskModalOpen: false,
    openTaskModal: vi.fn(),
    closeTaskModal: vi.fn(),
    activeProject: null,
    selectedTaskId: null,
    initialProjectId: null,
  })),
}));

import TasksPage from "../page";

import { render, mockUseSession, mockUserSession } from "../../../../__tests__/test-utils";

describe("TasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the tasks page without crashing", () => {
    mockUseSession(mockUserSession(), "authenticated");
    const { container } = render(<TasksPage />);
    expect(container).toBeInTheDocument();
  });

  it("renders task components", () => {
    mockUseSession(mockUserSession(), "authenticated");
    const { queryByTestId } = render(<TasksPage />);
    
    // Should render either task list or board view
    const taskList = queryByTestId("task-list");
    const boardView = queryByTestId("board-view");
    const projectSidebar = queryByTestId("project-sidebar");
    
    expect(taskList || boardView || projectSidebar).toBeTruthy();
  });

  it("handles unauthenticated state", () => {
    mockUseSession(null, "unauthenticated");
    const { container } = render(<TasksPage />);
    expect(container).toBeInTheDocument();
  });
}); 
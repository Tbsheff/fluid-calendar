"use client";

import { useEffect, useState } from "react";

import { ActionOverlay, ActionType } from "@/components/ui/action-overlay";

import { trpc } from "@/lib/trpc/client";

import { useFocusUIStore } from "@/store/focus-ui";

import { Task } from "@/types/task";

import { FocusedTask } from "./FocusedTask";
import { QuickActions } from "./QuickActions";
import { TaskQueue } from "./TaskQueue";

export function FocusMode() {
  const [mounted, setMounted] = useState(false);

  // Use focus UI store for UI state
  const {
    currentTaskId,
    isProcessing,
    actionType,
    actionMessage,
    stopProcessing,
  } = useFocusUIStore();

  // Get tasks data via tRPC
  const { data: tasksData = [] } = trpc.tasks.getAll.useQuery({});
  
  // Cast tRPC data to Task type (tRPC returns data with string enums)
  const tasks = tasksData as Task[];
  
  // Get current task from tasks data and cast to Task type
  const currentTaskData = tasks.find(task => task.id === currentTaskId);
  const currentTask = currentTaskData ? (currentTaskData as Task) : null;

  // Map focus action types to ActionOverlay types
  const mapActionType = (focusActionType: typeof actionType): ActionType | null => {
    if (!focusActionType) return null;
    
    switch (focusActionType) {
      case "complete":
        return "celebration";
      case "postpone":
      case "delete":
        return "loading";
      default:
        return "loading";
    }
  };

  // This effect will only run on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render a simple loading state
  if (!mounted) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading focus mode...</p>
      </div>
    );
  }

  const overlayActionType = mapActionType(actionType);

  return (
    <div className="flex h-full flex-col">
      {isProcessing && overlayActionType && (
        <ActionOverlay
          type={overlayActionType}
          message={actionMessage || undefined}
          onComplete={stopProcessing}
        />
      )}

      <div className="flex flex-1">
        {/* Left sidebar with queued tasks */}
        <aside className="h-full w-80 border-r border-border">
          <TaskQueue />
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-8">
          <FocusedTask task={currentTask} />
        </main>

        {/* Right sidebar with quick actions */}
        <aside className="h-full w-64 border-l border-border">
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}

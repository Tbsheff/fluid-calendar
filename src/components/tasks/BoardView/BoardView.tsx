"use client";

import { useMemo } from "react";

import { DndContext, DragEndEvent } from "@dnd-kit/core";

import { useTaskUIStore } from "@/store/task-ui";

import { Task, TaskStatus } from "@/types/task";

import { Column } from "./Column";

interface BoardViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export function BoardView({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}: BoardViewProps) {
  const { activeProject } = useTaskUIStore();

  // Filter by project - activeProject is a string (project ID) or null
  const filteredTasks = useMemo(() => {
    if (!activeProject) {
      return tasks; // Show all tasks if no project filter
    }
    
    if (activeProject === "no-project") {
      return tasks.filter((task) => !task.projectId);
    }
    
    return tasks.filter((task) => task.projectId === activeProject);
  }, [tasks, activeProject]);

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped = Object.values(TaskStatus).reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status);
        return acc;
      },
      {} as Record<TaskStatus, Task[]>
    );
    return grouped;
  }, [filteredTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (Object.values(TaskStatus).includes(newStatus)) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background p-4">
      <div className="flex flex-1 gap-4 overflow-auto">
        <DndContext onDragEnd={handleDragEnd}>
          {Object.values(TaskStatus).map((status) => (
            <Column
              key={status}
              status={status}
              tasks={columns[status]}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}

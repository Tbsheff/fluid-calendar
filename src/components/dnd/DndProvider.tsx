"use client";

import { type ReactNode } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";

const LOG_SOURCE = "DndProvider";

interface DndProviderProps {
  children: ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const utils = trpc.useUtils();

  // tRPC mutation for updating tasks
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch related queries
      await Promise.all([
        utils.tasks.getAll.invalidate(),
        utils.projects.getAll.invalidate(),
      ]);

      logger.info(
        "Task project assignment updated successfully via drag and drop",
        {},
        LOG_SOURCE
      );
    },
    onError: (error) => {
      logger.error(
        "Failed to update task project via drag and drop",
        {
          error: error.message,
        },
        LOG_SOURCE
      );
      toast.error("Failed to update task project", {
        description: error.message,
      });
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    // Handle dropping a task onto a project
    if (
      active.data.current?.type === "task" &&
      over.data.current?.type === "project"
    ) {
      const taskId = active.id as string;
      const projectId =
        over.id === "remove-project" ? null : (over.id as string);

      logger.info(
        "Drag and drop operation initiated",
        {
          taskId,
          projectId: projectId || "none",
          operation: projectId ? "assign-to-project" : "remove-from-project",
        },
        LOG_SOURCE
      );

      try {
        // Update the task with the new project assignment
        await updateTaskMutation.mutateAsync({
          taskId,
          data: {
            projectId,
          },
        });
      } catch (error) {
        // Error handling is done in the mutation onError callback
        logger.error(
          "Error in drag and drop operation",
          {
            error: error instanceof Error ? error.message : String(error),
            taskId,
            projectId: projectId || "none",
          },
          LOG_SOURCE
        );
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay />
    </DndContext>
  );
}

"use client";

import { useState } from "react";

import { HiClock, HiPencil, HiTrash } from "react-icons/hi";
import { toast } from "sonner";

import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/button";

import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";

import { useFocusModeStore } from "@/store/focusMode";

import { NewTask, Tag } from "@/types/task";

export function QuickActions() {
  const { completeCurrentTask, postponeTask, getCurrentTask } =
    useFocusModeStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const currentTask = getCurrentTask();

  // Use tRPC queries and mutations
  const { data: tags = [] } = trpc.tags.getAll.useQuery({});

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update task", {
        description: error.message,
      });
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete task", {
        description: error.message,
      });
    },
  });

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create tag", {
        description: error.message,
      });
    },
  });

  const handleEditTask = async (taskData: NewTask) => {
    if (!currentTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        taskId: currentTask.id,
        data: {
          title: taskData.title,
          description: taskData.description,
          dueDate: taskData.dueDate?.toISOString(),
          duration: taskData.duration,
          priority: taskData.priority,
          status: taskData.status as unknown as
            | "COMPLETED"
            | "TODO"
            | "IN_PROGRESS"
            | "CANCELLED",
          projectId: taskData.projectId,
          tagIds: taskData.tagIds,
          isAutoScheduled: taskData.isAutoScheduled,
          startDate: taskData.startDate?.toISOString(),
          isRecurring: taskData.isRecurring,
          recurrenceRule: taskData.recurrenceRule,
        },
      });
    } catch (error) {
      logger.error("Failed to update task in focus mode", {
        error: error instanceof Error ? error.message : String(error),
        taskId: currentTask.id,
      });
      // Error is already handled in the mutation onError callback
    }
  };

  const handleDeleteTask = async () => {
    if (!currentTask) return;

    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTaskMutation.mutateAsync({ taskId: currentTask.id });
      } catch (error) {
        logger.error("Failed to delete task in focus mode", {
          error: error instanceof Error ? error.message : String(error),
          taskId: currentTask.id,
        });
        // Error is already handled in the mutation onError callback
      }
    }
  };

  const handleCreateTag = async (name: string, color?: string): Promise<Tag> => {
    try {
      const result = await createTagMutation.mutateAsync({
        name,
        color: color || "",
      });
      return result as Tag;
    } catch (error) {
      logger.error("Failed to create tag in focus mode", {
        error: error instanceof Error ? error.message : String(error),
        name,
        color: color || null,
      });
      // Error is already handled in the mutation onError callback
      throw error;
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="text-lg font-semibold">Quick Actions</h2>

      <div className="flex flex-col space-y-2">
        {/* Complete Task */}
        <Button
          variant="outline"
          onClick={() => completeCurrentTask()}
          className="justify-start"
          disabled={!currentTask}
        >
          <span className="flex items-center">
            <span className="mr-2">✅</span>
            Complete Task
          </span>
        </Button>

        {/* Edit Task */}
        <Button
          variant="outline"
          onClick={() => setIsEditModalOpen(true)}
          className="justify-start"
          disabled={!currentTask}
        >
          <span className="flex items-center">
            <HiPencil className="mr-2 h-4 w-4" />
            Edit Task
          </span>
        </Button>

        {/* Delete Task */}
        <Button
          variant="outline"
          onClick={handleDeleteTask}
          className="justify-start text-destructive hover:text-destructive"
          disabled={!currentTask || deleteTaskMutation.isPending}
        >
          <span className="flex items-center">
            <HiTrash className="mr-2 h-4 w-4" />
            {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
          </span>
        </Button>

        <div className="my-2 h-px bg-border" />
        <h3 className="text-sm font-medium">Postpone Task</h3>

        {/* Postpone Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => postponeTask("1h")}
            className="flex items-center"
            disabled={!currentTask}
          >
            <HiClock className="mr-1 h-3 w-3" /> 1 hour
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => postponeTask("3h")}
            className="flex items-center"
            disabled={!currentTask}
          >
            <HiClock className="mr-1 h-3 w-3" /> 3 hours
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => postponeTask("1d")}
            className="flex items-center"
            disabled={!currentTask}
          >
            <HiClock className="mr-1 h-3 w-3" /> 1 day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => postponeTask("1w")}
            className="flex items-center"
            disabled={!currentTask}
          >
            <HiClock className="mr-1 h-3 w-3" /> 1 week
          </Button>
        </div>
      </div>

      {/* Task Edit Modal */}
      {currentTask && (
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditTask}
          task={currentTask}
          tags={tags.map(tag => ({ ...tag, color: tag.color || undefined }))}
          onCreateTag={handleCreateTag}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { BsKanban, BsListTask } from "react-icons/bs";
import { toast } from "sonner";

import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { BoardView } from "@/components/tasks/BoardView/BoardView";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";
import { useTaskModalStore } from "@/store/taskModal";
import { useTaskPageSettings } from "@/store/taskPageSettings";

import { ProjectStatus } from "@/types/project";
import {
  EnergyLevel,
  NewTask,
  Priority,
  Task,
  TaskStatus,
  TimePreference,
} from "@/types/task";

export default function TasksPage() {
  const { fetchProjects, activeProject } = useProjectStore();
  const { viewMode, setViewMode } = useTaskPageSettings();
  const { isOpen, setOpen } = useTaskModalStore();
  const utils = trpc.useUtils();

  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(undefined);

  // tRPC queries
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = trpc.tasks.getAll.useQuery({});

  const {
    data: tags = [],
    isLoading: tagsLoading,
    error: tagsError,
  } = trpc.tags.getAll.useQuery();

  // tRPC mutations
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.projects.getAll.invalidate();
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create task", {
        description: error.message,
      });
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.projects.getAll.invalidate();
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update task", {
        description: error.message,
      });
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.projects.getAll.invalidate();
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
      utils.tags.getAll.invalidate();
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create tag", {
        description: error.message,
      });
    },
  });

  const scheduleAllTasksMutation = trpc.tasks.scheduleAll.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      toast.success("Tasks scheduled successfully");
    },
    onError: (error) => {
      toast.error("Failed to schedule tasks", {
        description: error.message,
      });
    },
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateTask = async (task: NewTask) => {
    // Convert NewTask to the format expected by tRPC
    const taskData = {
      title: task.title,
      description: task.description || null,
      status: task.status.toUpperCase() as
        | "TODO"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED",
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      startDate: task.startDate ? task.startDate.toISOString() : null,
      duration: task.duration || null,
      priority: task.priority || null,
      energyLevel: task.energyLevel?.toUpperCase() as
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | null,
      preferredTime: task.preferredTime?.toUpperCase() as
        | "MORNING"
        | "AFTERNOON"
        | "EVENING"
        | "ANYTIME"
        | null,
      isAutoScheduled: task.isAutoScheduled || false,
      scheduleLocked: task.scheduleLocked || false,
      isRecurring: task.isRecurring || false,
      recurrenceRule: task.recurrenceRule || null,
      projectId: task.projectId || null,
      tagIds: task.tagIds || [],
    };
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTask = async (task: NewTask) => {
    if (selectedTask) {
      // Convert NewTask to the format expected by tRPC
      const taskData = {
        title: task.title,
        description: task.description || null,
        status: task.status.toUpperCase() as
          | "TODO"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED",
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        startDate: task.startDate ? task.startDate.toISOString() : null,
        duration: task.duration || null,
        priority: task.priority || null,
        energyLevel: task.energyLevel?.toUpperCase() as
          | "LOW"
          | "MEDIUM"
          | "HIGH"
          | null,
        preferredTime: task.preferredTime?.toUpperCase() as
          | "MORNING"
          | "AFTERNOON"
          | "EVENING"
          | "ANYTIME"
          | null,
        isAutoScheduled: task.isAutoScheduled || false,
        scheduleLocked: task.scheduleLocked || false,
        isRecurring: task.isRecurring || false,
        recurrenceRule: task.recurrenceRule || null,
        projectId: task.projectId || null,
        tagIds: task.tagIds || [],
      };
      updateTaskMutation.mutate({
        taskId: selectedTask.id,
        data: taskData,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate({ taskId });
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    updateTaskMutation.mutate({
      taskId,
      data: {
        status: status.toUpperCase() as
          | "TODO"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED",
      },
    });
  };

  const handleCreateTag = async (name: string, color?: string) => {
    try {
      const result = await createTagMutation.mutateAsync({
        name,
        color: color || null,
      });
      // Convert the result to match the expected Tag interface
      return {
        ...result,
        color: result.color || undefined,
      };
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  };

  const handleInlineEdit = async (task: Task) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, tags, createdAt, updatedAt, project, ...updates } = task;
    console.log("Updating task:", { id, updates });
    try {
      // Convert the updates to the format expected by tRPC
      const taskData = {
        title: updates.title,
        description: updates.description,
        status: updates.status?.toUpperCase() as
          | "TODO"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED"
          | undefined,
        dueDate: updates.dueDate
          ? new Date(updates.dueDate).toISOString()
          : null,
        startDate: updates.startDate
          ? new Date(updates.startDate).toISOString()
          : null,
        duration: updates.duration,
        priority: updates.priority,
        energyLevel: updates.energyLevel?.toUpperCase() as
          | "LOW"
          | "MEDIUM"
          | "HIGH"
          | null
          | undefined,
        preferredTime: updates.preferredTime?.toUpperCase() as
          | "MORNING"
          | "AFTERNOON"
          | "EVENING"
          | "ANYTIME"
          | null
          | undefined,
        isAutoScheduled: updates.isAutoScheduled,
        scheduleLocked: updates.scheduleLocked,
        scheduledStart: updates.scheduledStart
          ? new Date(updates.scheduledStart).toISOString()
          : null,
        scheduledEnd: updates.scheduledEnd
          ? new Date(updates.scheduledEnd).toISOString()
          : null,
        postponedUntil: updates.postponedUntil
          ? new Date(updates.postponedUntil).toISOString()
          : null,
        completedAt: updates.completedAt
          ? new Date(updates.completedAt).toISOString()
          : null,
        isRecurring: updates.isRecurring,
        recurrenceRule: updates.recurrenceRule,
        projectId: updates.projectId,
        externalTaskId: updates.externalTaskId,
        source: updates.source,
        externalListId: updates.externalListId,
        lastSyncedAt: updates.lastSyncedAt
          ? new Date(updates.lastSyncedAt).toISOString()
          : null,
      };
      updateTaskMutation.mutate({
        taskId: id,
        data: taskData,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task", {
        description: "Please try again later.",
      });
    }
  };

  const loading = tasksLoading || tagsLoading;
  const error = tasksError || tagsError;

  // Convert tRPC response types to component-expected types
  const convertedTasks: Task[] = tasks.map((task) => ({
    ...task,
    status: task.status.toLowerCase() as TaskStatus,
    priority: task.priority?.toLowerCase() as Priority | null,
    energyLevel: task.energyLevel?.toLowerCase() as EnergyLevel | null,
    preferredTime: task.preferredTime?.toLowerCase() as TimePreference | null,
    project: task.project
      ? {
          ...task.project,
          status: task.project.status.toLowerCase() as ProjectStatus,
        }
      : null,
    tags:
      task.tags?.map((tag) => ({
        ...tag,
        color: tag.color || undefined,
      })) || [],
  }));

  const convertedTags = tags.map((tag) => ({
    ...tag,
    color: tag.color || undefined,
  }));

  return (
    <div className="flex h-full">
      <ProjectSidebar />
      <div className="flex min-w-0 flex-1 flex-col" data-task-page>
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2 text-sm font-medium",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BsListTask className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("board")}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2 text-sm font-medium",
                    viewMode === "board"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BsKanban className="h-4 w-4" />
                  Board
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  scheduleAllTasksMutation.mutate({});
                }}
                disabled={scheduleAllTasksMutation.isPending}
              >
                {scheduleAllTasksMutation.isPending
                  ? "Scheduling..."
                  : "Auto Schedule"}
              </Button>
              <Button
                data-create-task-button
                onClick={() => {
                  setSelectedTask(undefined);
                  // Set initial project ID based on active project
                  // If viewing "No Project", set to null
                  // If viewing a specific project, set to that project's ID
                  // Otherwise, don't set an initial project (undefined)
                  const projectId = activeProject
                    ? activeProject.id === "no-project"
                      ? null
                      : activeProject.id
                    : undefined;
                  setInitialProjectId(projectId);
                  setOpen(true);
                }}
              >
                Create Task
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          {viewMode === "list" ? (
            <TaskList
              tasks={convertedTasks}
              onEdit={(task) => {
                setSelectedTask(task);
                setOpen(true);
              }}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onInlineEdit={handleInlineEdit}
            />
          ) : (
            <BoardView
              tasks={convertedTasks}
              onEdit={(task) => {
                setSelectedTask(task);
                setOpen(true);
              }}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>

        <TaskModal
          isOpen={isOpen}
          onClose={() => {
            setOpen(false);
            setSelectedTask(undefined);
            setInitialProjectId(undefined);
          }}
          onSave={selectedTask ? handleUpdateTask : handleCreateTask}
          task={selectedTask}
          tags={convertedTags}
          onCreateTag={handleCreateTag}
          initialProjectId={initialProjectId}
        />

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-lg border bg-background p-4 shadow-lg">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

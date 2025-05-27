"use client";

import { useCallback, useEffect, useState } from "react";

import { BsArrowRepeat } from "react-icons/bs";
import { HiFolderOpen, HiPencil, HiPlus } from "react-icons/hi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { isSaasEnabled } from "@/lib/config";
import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { useTaskUIStore } from "@/store/task-ui";

import { Project, ProjectStatus } from "@/types/project";
import { TaskStatus } from "@/types/task";

import { useDroppableProject } from "../dnd/useDragAndDrop";
import { ProjectModal } from "./ProjectModal";

// Logging source
const LOG_SOURCE = "ProjectSidebar";

// Interface for task list mappings
interface TaskListMapping {
  id: string;
  providerId: string;
  projectId: string;
  externalListId: string;
  externalListName: string;
}

export function ProjectSidebar() {
  // Use tRPC for data fetching
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
  } = trpc.projects.getAll.useQuery();
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = trpc.tasks.getAll.useQuery({});

  // Keep active project state in store for UI state management
  const { setActiveProject, activeProject } = useTaskUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [projectMappings, setProjectMappings] = useState<
    Record<string, TaskListMapping[]>
  >({});
  const [syncingProjects, setSyncingProjects] = useState<Set<string>>(
    new Set()
  );

  const { droppableProps: removeProjectProps, isOver: isOverRemove } =
    useDroppableProject(null);

  // tRPC query for fetching task list mappings
  const { data: mappingsData, error: mappingsError } =
    trpc.taskSync.mappings.getAll.useQuery(
      {
        includeProvider: true,
        includeProject: true,
      },
      {
        enabled: projects.length > 0,
      }
    );

  // tRPC mutation for triggering sync
  const triggerSyncMutation = trpc.taskSync.sync.trigger.useMutation({
    onSuccess: () => {
      if (isSaasEnabled) {
        toast.success("Task sync initiated for project");
      } else {
        toast.success("Sync Completed");
      }
    },
    onError: (error) => {
      logger.error(
        "Failed to sync project tasks via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error("Failed to sync tasks for project");
    },
  });

  // Handle errors
  useEffect(() => {
    if (projectsError) {
      logger.error(
        "Failed to fetch projects via tRPC",
        { error: projectsError.message },
        LOG_SOURCE
      );
      toast.error("Failed to load projects");
    }
  }, [projectsError]);

  useEffect(() => {
    if (tasksError) {
      logger.error(
        "Failed to fetch tasks via tRPC",
        { error: tasksError.message },
        LOG_SOURCE
      );
      toast.error("Failed to load tasks");
    }
  }, [tasksError]);

  // Process mappings data when it changes
  useEffect(() => {
    if (mappingsData) {
      // Group mappings by project ID
      const mappingsByProject: Record<string, TaskListMapping[]> = {};

      mappingsData.forEach((mapping) => {
        if (!mappingsByProject[mapping.projectId]) {
          mappingsByProject[mapping.projectId] = [];
        }
        mappingsByProject[mapping.projectId].push({
          id: mapping.id,
          providerId: mapping.providerId,
          projectId: mapping.projectId,
          externalListId: mapping.externalListId,
          externalListName: mapping.externalListName,
        });
      });

      setProjectMappings(mappingsByProject);
    }
  }, [mappingsData]);

  // Handle mappings error
  useEffect(() => {
    if (mappingsError) {
      logger.error(
        "Failed to fetch task list mappings via tRPC",
        { error: mappingsError.message },
        LOG_SOURCE
      );
    }
  }, [mappingsError]);

  const handleSyncProject = useCallback(
    async (projectId: string, mappingId: string) => {
      if (syncingProjects.has(projectId)) return;

      setSyncingProjects((prev) => new Set(prev).add(projectId));

      triggerSyncMutation.mutate(
        {
          mappingId,
          forceSync: false,
        },
        {
          onSettled: () => {
            setSyncingProjects((prev) => {
              const next = new Set(prev);
              next.delete(projectId);
              return next;
            });
          },
        }
      );
    },
    [syncingProjects, triggerSyncMutation]
  );

  const activeProjects = projects.filter(
    (project) => project.status === ProjectStatus.ACTIVE
  );
  const archivedProjects = projects.filter(
    (project) => project.status === ProjectStatus.ARCHIVED
  );

  // Count non-completed tasks with no project
  const unassignedTasksCount = tasks.filter(
    (task) => !task.projectId && task.status !== TaskStatus.COMPLETED
  ).length;

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const loading = projectsLoading || tasksLoading;
  const error = projectsError || tasksError;

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-background">
        <div className="border-b p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button
              size="icon"
              onClick={() => {
                setSelectedProject(undefined);
                setIsModalOpen(true);
              }}
            >
              <HiPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Button
              variant={!activeProject ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveProject(null)}
            >
              <HiFolderOpen className="mr-2 h-4 w-4" />
              <span className="truncate">No Project</span>
              {unassignedTasksCount > 0 && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">
                  {unassignedTasksCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading && (
              <div className="text-center text-sm text-muted-foreground">
                Loading projects...
              </div>
            )}

            {error && (
              <div className="text-center text-sm text-destructive">
                Error loading projects
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Active Projects */}
                {activeProjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Active Projects
                    </h3>
                    <div className="space-y-1">
                      {activeProjects.map((project) => (
                        <ProjectItem
                          key={project.id}
                          project={project as Project}
                          isActive={activeProject === project.id}
                          onEdit={handleEditProject}
                          mappings={projectMappings[project.id] || []}
                          isSyncing={syncingProjects.has(project.id)}
                          onSync={handleSyncProject}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived Projects */}
                {archivedProjects.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Archived Projects
                    </h3>
                    <div className="space-y-1">
                      {archivedProjects.map((project) => (
                        <ProjectItem
                          key={project.id}
                          project={project as Project}
                          isActive={activeProject === project.id}
                          onEdit={handleEditProject}
                          mappings={projectMappings[project.id] || []}
                          isSyncing={syncingProjects.has(project.id)}
                          onSync={handleSyncProject}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Projects */}
                {activeProjects.length === 0 &&
                  archivedProjects.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      No projects yet. Create your first project!
                    </div>
                  )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Remove Project Drop Zone */}
        <div
          {...removeProjectProps}
          className={cn(
            "border-t p-4 text-center text-sm transition-colors",
            isOverRemove
              ? "bg-destructive/10 text-destructive"
              : "text-muted-foreground"
          )}
        >
          {isOverRemove ? "Drop to remove from project" : "Remove from project"}
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(undefined);
        }}
        project={selectedProject}
      />
    </>
  );
}

interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  onEdit: (project: Project) => void;
  mappings: TaskListMapping[];
  isSyncing: boolean;
  onSync: (projectId: string, mappingId: string) => void;
}

function ProjectItem({
  project,
  isActive,
  onEdit,
  mappings,
  isSyncing,
  onSync,
}: ProjectItemProps) {
  const { setActiveProject } = useTaskUIStore();
  const { droppableProps, isOver } = useDroppableProject(project);

  // Get task count from project data
  const taskCount = project._count?.tasks || 0;

  return (
    <div
      {...droppableProps}
      className={cn(
        "group relative rounded-md transition-colors",
        isActive && "bg-accent",
        isOver && "bg-accent/50"
      )}
    >
      <Button
        variant="ghost"
        className={cn(
          "h-auto w-full justify-start p-2 text-left",
          isActive && "bg-accent font-medium"
        )}
        onClick={() => setActiveProject(project.id)}
      >
        <div
          className="mr-2 h-3 w-3 rounded-full border-2"
          style={{
            backgroundColor: project.color || "#E5E7EB",
            borderColor: project.color || "#E5E7EB",
          }}
        />
        <span className="flex-1 truncate">{project.name}</span>
        {taskCount > 0 && (
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
            {taskCount}
          </span>
        )}
      </Button>

      {/* Project Actions */}
      <div className="absolute right-1 top-1 flex opacity-0 transition-opacity group-hover:opacity-100">
        {/* Sync Button */}
        {mappings.length > 0 && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (!isSyncing && mappings[0]) {
                onSync(project.id, mappings[0].id);
              }
            }}
            disabled={isSyncing}
            title={
              isSyncing
                ? "Syncing..."
                : `Sync with ${mappings[0]?.externalListName || "external list"}`
            }
          >
            <BsArrowRepeat
              className={cn("h-3 w-3", isSyncing && "animate-spin")}
            />
          </Button>
        )}

        {/* Edit Button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
        >
          <HiPencil className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

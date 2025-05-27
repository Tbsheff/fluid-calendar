import { ChangeType } from "@/lib/task-sync/task-change-tracker";

import { Project } from "./project";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum EnergyLevel {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum Priority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  NONE = "NONE",
}

export enum TimePreference {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  EVENING = "EVENING",
  ANYTIME = "ANYTIME",
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: Date | null;
  startDate?: Date | null;
  duration?: number | null;
  priority?: Priority | null;
  energyLevel?: EnergyLevel | null;
  preferredTime?: TimePreference | null;
  tags: Tag[];
  projectId?: string | null;
  project?: Project | null;
  createdAt: Date;
  updatedAt: Date;
  recurrenceRule?: string | null;
  lastCompletedDate?: Date | null;
  completedAt?: Date | null;
  isRecurring: boolean;
  // Auto-scheduling fields
  isAutoScheduled: boolean;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  scheduleScore?: number | null;
  lastScheduled?: Date | null;
  scheduleLocked: boolean;
  postponedUntil?: Date | null;
  // External sync fields
  externalTaskId?: string | null;
  source?: string | null;
  externalListId?: string | null;
  lastSyncedAt?: Date | null;
}

export interface NewTask
  extends Omit<Task, "id" | "createdAt" | "updatedAt" | "tags" | "project"> {
  tagIds?: string[];
  isAutoScheduled: boolean;
  scheduleLocked: boolean;
}

export interface UpdateTask
  extends Partial<
    Omit<Task, "id" | "createdAt" | "updatedAt" | "tags" | "project">
  > {
  tagIds?: string[];
}

export type NewTag = Omit<Tag, "id">;

export interface TaskFilters {
  status?: TaskStatus[];
  tagIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  startDate?: Date | null;
  hideUpcomingTasks?: boolean;
  priority?: Priority[];
  energyLevel?: EnergyLevel[];
  timePreference?: TimePreference[];
  search?: string;
  projectId?: string;
}

/**
 * Task with its related entities
 */
export interface TaskWithRelations extends Task {
  tags: Tag[];
  project: Project | null;
}

export interface TaskChange {
  id: string;
  taskId: string;
  changeType: ChangeType;
  changeData: Record<string, unknown>;
}

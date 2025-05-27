"use client";

import { useCallback, useEffect } from "react";

import { HiMenu } from "react-icons/hi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { toast } from "sonner";

import { DayView } from "@/components/calendar/DayView";
import { FeedManager } from "@/components/calendar/FeedManager";
import { MonthView } from "@/components/calendar/MonthView";
import { MultiMonthView } from "@/components/calendar/MultiMonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { SponsorshipBanner } from "@/components/ui/sponsorship-banner";

import { formatDate } from "@/lib/date-utils";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { useCalendarUIStore } from "@/store/calendar-ui";

import { CalendarEvent, CalendarFeed } from "@/types/calendar";
import { CalendarSettings, UserSettings } from "@/types/settings";
import { Tag, Task } from "@/types/task";

// Dynamically import the appropriate version of the LifetimeAccessBanner

interface CalendarProps {
  initialFeeds?: CalendarFeed[];
  initialEvents?: CalendarEvent[];
}

export function Calendar({
  initialFeeds = [],
  initialEvents = [],
}: CalendarProps) {
  // Use calendar UI store for state management
  const {
    currentDate,
    setDate,
    view,
    setView,
    sidebarOpen: isSidebarOpen,
    setSidebarOpen,
    isHydrated,
    setHydrated,
    goToToday,
    goToPrevious,
    goToNext,
  } = useCalendarUIStore();

  // Set hydrated state on mount
  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  // Use tRPC queries for data fetching
  const { data: feeds = initialFeeds } = trpc.feeds.getAll.useQuery(
    {},
    {
      refetchOnMount: initialFeeds.length === 0,
    }
  );

  const { data: events = initialEvents } = trpc.events.getAll.useQuery(
    {},
    {
      refetchOnMount: initialEvents.length === 0,
    }
  );

  const { data: tasks = [] } = trpc.tasks.getAll.useQuery({});
  const { data: tags = [] } = trpc.tags.getAll.useQuery({});
  const { data: userSettingsData } = trpc.settings.get.useQuery({
    type: "user",
  });
  const { data: calendarSettingsData } = trpc.settings.get.useQuery({
    type: "calendar",
  });

  const { refetch: refetchTasks } = trpc.tasks.getAll.useQuery({});

  // Use tRPC mutations for CRUD operations
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      refetchTasks();
    },
    onError: (error) => {
      toast.error("Failed to update task", {
        description: error.message,
      });
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      refetchTasks();
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete task", {
        description: error.message,
      });
    },
  });

  const createTagMutation = trpc.tags.create.useMutation({
    onError: (error) => {
      toast.error("Failed to create tag", {
        description: error.message,
      });
    },
  });

  const removeEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete event", {
        description: error.message,
      });
    },
  });

  // Use tRPC mutation for auto-scheduling
  const scheduleAllTasksMutation = trpc.tasks.scheduleAll.useMutation({
    onSuccess: () => {
      toast.success("Tasks scheduled successfully");
      refetchTasks();
    },
    onError: (error) => {
      toast.error("Failed to schedule tasks", {
        description: error.message,
      });
    },
  });

  // Create a function to get calendar items for the calendar views
  const getAllCalendarItems = useCallback((start: Date, end: Date) => {
    // Filter events within the date range
    const filteredEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= end && eventEnd >= start;
    });

    // Convert tasks to calendar events if they have scheduled times
    const taskEvents = tasks
      .filter((task) => task.scheduledStart && task.scheduledEnd)
      .map((task) => ({
        id: `task-${task.id}`,
        feedId: "tasks",
        title: task.title,
        description: task.description,
        start: new Date(task.scheduledStart!),
        end: new Date(task.scheduledEnd!),
        allDay: false,
        isRecurring: false,
        status: task.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        isMaster: false,
        externalEventId: null,
        location: null,
        recurrenceRule: null,
        sequence: null,
        created: null,
        lastModified: null,
        organizer: null,
        attendees: null,
        masterEventId: null,
        recurringEventId: null,
      }))
      .filter((taskEvent) => {
        return taskEvent.start <= end && taskEvent.end >= start;
      });

    return [...filteredEvents, ...taskEvents] as CalendarEvent[];
  }, [events, tasks]);

  // Extract user and calendar settings with defaults
  const userSettings: UserSettings = (userSettingsData as UserSettings) || {
    theme: "system",
    defaultView: "week",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekStartDay: "sunday",
    timeFormat: "12h",
  };

  const calendarSettings: CalendarSettings =
    (calendarSettingsData as unknown as CalendarSettings) || {
      defaultCalendarId: undefined,
      workingHours: {
        enabled: true,
        start: "09:00",
        end: "17:00",
        days: [1, 2, 3, 4, 5],
      },
      eventDefaults: {
        defaultDuration: 60,
        defaultColor: "#3b82f6",
        defaultReminder: 30,
      },
      refreshInterval: 5,
    };

  // Mutation handlers for calendar view components
  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      await updateTaskMutation.mutateAsync({
        taskId,
        data: {
          title: updates.title,
          description: updates.description,
          status: updates.status as unknown as
            | "COMPLETED"
            | "TODO"
            | "IN_PROGRESS"
            | "CANCELLED",
          dueDate: updates.dueDate?.toISOString(),
          startDate: updates.startDate?.toISOString(),
          duration: updates.duration,
          priority: updates.priority as unknown as "LOW" | "MEDIUM" | "HIGH",
          energyLevel: updates.energyLevel as unknown as
            | "LOW"
            | "MEDIUM"
            | "HIGH",
          projectId: updates.projectId,
          tagIds: updates.tags?.map((tag) => tag.id),
        },
      });
    },
    [updateTaskMutation]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await deleteTaskMutation.mutateAsync({ taskId });
    },
    [deleteTaskMutation]
  );

  const handleCreateTag = useCallback(
    async (name: string, color?: string) => {
      const result = await createTagMutation.mutateAsync({ name, color });
      return result as Tag;
    },
    [createTagMutation]
  );

  const handleRemoveEvent = useCallback(
    async (eventId: string) => {
      await removeEventMutation.mutateAsync({ eventId });
    },
    [removeEventMutation]
  );

  // Navigation handlers moved to calendar UI store

  const handleAutoSchedule = async () => {
    try {
      await scheduleAllTasksMutation.mutateAsync({});
    } catch (error) {
      // Error is already handled in the mutation onError callback
      console.error("Failed to schedule tasks:", error);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full w-80 flex-none border-r border-gray-200 bg-white",
          "transform transition-transform duration-300 ease-in-out",
          !isHydrated && "opacity-0 duration-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ marginLeft: isSidebarOpen ? 0 : "-20rem" }}
      >
        <div className="flex h-full flex-col">
          {/* Feed Manager */}
          <div className="flex-1 overflow-y-auto">
            <FeedManager />
          </div>

          {/* Sponsorship Banner */}
          <SponsorshipBanner />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col bg-background">
        {/* Lifetime Access Banner */}

        {/* Header */}
        <header className="flex h-16 flex-none items-center border-b border-border px-4">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 text-foreground hover:bg-muted"
            title="Toggle Sidebar (b)"
          >
            <HiMenu className="h-5 w-5" />
          </button>

          <div className="ml-4 flex items-center gap-4">
            <button
              onClick={goToToday}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              title="Go to Today (t)"
            >
              Today
            </button>

            <button
              onClick={handleAutoSchedule}
              disabled={scheduleAllTasksMutation.isPending}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {scheduleAllTasksMutation.isPending
                ? "Scheduling..."
                : "Auto Schedule"}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="rounded-lg p-1.5 text-foreground hover:bg-muted"
                data-testid="calendar-prev-week"
                title="Previous Week (←)"
              >
                <IoChevronBack className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="rounded-lg p-1.5 text-foreground hover:bg-muted"
                data-testid="calendar-next-week"
                title="Next Week (→)"
              >
                <IoChevronForward className="h-5 w-5" />
              </button>
            </div>

            <h1 className="text-xl font-semibold text-foreground">
              {formatDate(currentDate)}
            </h1>
          </div>

          {/* View Switching Buttons */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setView("day")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                view === "day"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                view === "week"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                view === "month"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("multiMonth")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                view === "multiMonth"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Year
            </button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          {view === "day" ? (
            <DayView
              currentDate={currentDate}
              onDateClick={setDate}
              tasks={tasks as Task[]}
              tags={tags as Tag[]}
              feeds={feeds as CalendarFeed[]}
              events={events as CalendarEvent[]}
              userSettings={userSettings}
              calendarSettings={calendarSettings}
              getAllCalendarItems={getAllCalendarItems}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateTag={handleCreateTag}
              onRemoveEvent={handleRemoveEvent}
            />
          ) : view === "week" ? (
            <WeekView
              currentDate={currentDate}
              onDateClick={setDate}
              tasks={tasks as Task[]}
              tags={tags as Tag[]}
              feeds={feeds as CalendarFeed[]}
              events={events as CalendarEvent[]}
              userSettings={userSettings}
              calendarSettings={calendarSettings}
              getAllCalendarItems={getAllCalendarItems}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateTag={handleCreateTag}
              onRemoveEvent={handleRemoveEvent}
            />
          ) : view === "month" ? (
            <MonthView
              currentDate={currentDate}
              onDateClick={setDate}
              tasks={tasks as Task[]}
              tags={tags as Tag[]}
              feeds={feeds as CalendarFeed[]}
              events={events as CalendarEvent[]}
              userSettings={userSettings}
              getAllCalendarItems={getAllCalendarItems}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateTag={handleCreateTag}
              onRemoveEvent={handleRemoveEvent}
            />
          ) : (
            <MultiMonthView
              currentDate={currentDate}
              onDateClick={setDate}
              tasks={tasks as Task[]}
              tags={tags as Tag[]}
              feeds={feeds as CalendarFeed[]}
              events={events as CalendarEvent[]}
              userSettings={userSettings}
              getAllCalendarItems={getAllCalendarItems}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateTag={handleCreateTag}
              onRemoveEvent={handleRemoveEvent}
            />
          )}
        </div>
      </main>
    </div>
  );
}

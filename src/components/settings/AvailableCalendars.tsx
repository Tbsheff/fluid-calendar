import { useCallback, useState } from "react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { trpc } from "@/lib/trpc/client";

interface AvailableCalendar {
  id: string;
  name: string;
  color: string;
  accessRole?: string;
  canEdit?: boolean;
  alreadyAdded?: boolean;
}

interface Props {
  accountId: string;
  provider: "GOOGLE" | "OUTLOOK" | "CALDAV";
}

export function AvailableCalendars({ accountId, provider }: Props) {
  const [addingCalendars, setAddingCalendars] = useState<Set<string>>(
    new Set()
  );

  // Use conditional tRPC queries based on provider
  const googleQuery = trpc.calendar.google.getAvailableCalendars.useQuery(
    { accountId },
    { enabled: provider === "GOOGLE" }
  );

  const outlookQuery = trpc.calendar.outlook.getAvailableCalendars.useQuery(
    { accountId },
    { enabled: provider === "OUTLOOK" }
  );

  const caldavQuery = trpc.calendar.caldav.getAvailableCalendars.useQuery(
    { accountId },
    { enabled: provider === "CALDAV" }
  );

  // Get the appropriate query based on provider
  const currentQuery =
    provider === "GOOGLE"
      ? googleQuery
      : provider === "OUTLOOK"
        ? outlookQuery
        : caldavQuery;

  const calendars = (currentQuery.data as AvailableCalendar[]) || [];
  const isLoading = currentQuery.isLoading;

  // Use tRPC mutations for adding calendars
  const addGoogleCalendarMutation =
    trpc.calendar.google.addCalendar.useMutation({
      onSuccess: () => {
        toast.success("Google Calendar added successfully");
        googleQuery.refetch();
      },
      onError: (error) => {
        toast.error("Failed to add Google Calendar", {
          description: error.message,
        });
      },
    });

  const addOutlookCalendarMutation =
    trpc.calendar.outlook.addCalendar.useMutation({
      onSuccess: () => {
        toast.success("Outlook Calendar added successfully");
        outlookQuery.refetch();
      },
      onError: (error) => {
        toast.error("Failed to add Outlook Calendar", {
          description: error.message,
        });
      },
    });

  const addCalDAVCalendarMutation =
    trpc.calendar.caldav.addCalendar.useMutation({
      onSuccess: () => {
        toast.success("CalDAV Calendar added successfully");
        caldavQuery.refetch();
      },
      onError: (error) => {
        toast.error("Failed to add CalDAV Calendar", {
          description: error.message,
        });
      },
    });

  const handleAddCalendar = useCallback(
    async (calendar: AvailableCalendar) => {
      try {
        setAddingCalendars((prev) => new Set(prev).add(calendar.id));

        const calendarData = {
          accountId,
          calendarId: calendar.id,
          name: calendar.name,
          color: calendar.color,
        };

        switch (provider) {
          case "GOOGLE":
            await addGoogleCalendarMutation.mutateAsync(calendarData);
            break;
          case "OUTLOOK":
            await addOutlookCalendarMutation.mutateAsync(calendarData);
            break;
          case "CALDAV":
            await addCalDAVCalendarMutation.mutateAsync(calendarData);
            break;
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
      } catch (error) {
        // Error is already handled in the mutation onError callback
        console.error("Failed to add calendar:", error);
      } finally {
        setAddingCalendars((prev) => {
          const next = new Set(prev);
          next.delete(calendar.id);
          return next;
        });
      }
    },
    [
      accountId,
      provider,
      addGoogleCalendarMutation,
      addOutlookCalendarMutation,
      addCalDAVCalendarMutation,
    ]
  );

  const handleRefresh = useCallback(() => {
    currentQuery.refetch();
  }, [currentQuery]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (currentQuery.error) {
    return (
      <div className="py-4 text-center text-destructive">
        Failed to load calendars: {currentQuery.error.message}
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No available calendars found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {calendars.map((calendar) => (
          <div
            key={calendar.id}
            className="flex items-center justify-between rounded-md border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {calendar.accessRole?.toLowerCase() ||
                  (calendar.canEdit ? "owner" : "reader")}
              </Badge>
              <span className="text-sm">{calendar.name}</span>
            </div>
            <Button
              size="sm"
              onClick={() => handleAddCalendar(calendar)}
              disabled={addingCalendars.has(calendar.id)}
            >
              {addingCalendars.has(calendar.id) ? "Adding..." : "Add"}
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

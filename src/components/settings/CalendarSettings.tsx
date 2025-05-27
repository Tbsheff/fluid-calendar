import { useEffect } from "react";

import {
  CalendarSettings as PrismaCalendarSettings,
  UserSettings as PrismaUserSettings,
} from "@prisma/client";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { trpc } from "@/lib/trpc/client";

import { useCalendarStore } from "@/store/calendar";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function CalendarSettings() {
  const { feeds, loadFromDatabase } = useCalendarStore();

  // Use tRPC to fetch and update calendar and user settings
  const { data: calendarSettingsData, isLoading: isLoadingCalendar } =
    trpc.settings.get.useQuery({
      type: "calendar",
    });

  const { data: userSettingsData, isLoading: isLoadingUser } =
    trpc.settings.get.useQuery({
      type: "user",
    });

  // Cast to the correct types since we know what we're fetching
  const calendarSettings = calendarSettingsData as
    | PrismaCalendarSettings
    | undefined;
  const userSettings = userSettingsData as PrismaUserSettings | undefined;

  const updateCalendarSettingsMutation = trpc.settings.update.useMutation();
  const updateUserSettingsMutation = trpc.settings.update.useMutation();

  // Load feeds when component mounts
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  const handleUpdateCalendarSettings = async (
    updates: Partial<{
      defaultCalendarId: string;
      workingHoursEnabled: boolean;
      workingHoursStart: string;
      workingHoursEnd: string;
      workingHoursDays: number[];
    }>
  ) => {
    try {
      await updateCalendarSettingsMutation.mutateAsync({
        type: "calendar",
        data: updates,
      });

      toast.success("Calendar settings updated successfully");
    } catch (error) {
      toast.error("Failed to update calendar settings", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleUpdateUserSettings = async (
    updates: Partial<{
      weekStartDay: "monday" | "sunday";
    }>
  ) => {
    try {
      await updateUserSettingsMutation.mutateAsync({
        type: "user",
        data: updates,
      });

      toast.success("User settings updated successfully");
    } catch (error) {
      toast.error("Failed to update user settings", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const workingDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  // Show loading state while fetching settings
  if (isLoadingCalendar || isLoadingUser) {
    return (
      <SettingsSection
        title="Calendar Settings"
        description="Configure your calendar display and event defaults."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Loading calendar settings...
          </div>
        </div>
      </SettingsSection>
    );
  }

  // Handle case where settings are not loaded
  if (!calendarSettings || !userSettings) {
    return (
      <SettingsSection
        title="Calendar Settings"
        description="Configure your calendar display and event defaults."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Failed to load calendar settings
          </div>
        </div>
      </SettingsSection>
    );
  }

  // Parse working hours days from JSON string
  const workingHoursDays = JSON.parse(
    calendarSettings.workingHoursDays
  ) as number[];

  return (
    <SettingsSection
      title="Calendar Settings"
      description="Configure your calendar display and event defaults."
    >
      <SettingRow
        label="Default Calendar"
        description="Choose which calendar new events are added to by default"
      >
        <Select
          value={calendarSettings.defaultCalendarId || "none"}
          onValueChange={(value) =>
            handleUpdateCalendarSettings({
              defaultCalendarId: value === "none" ? "" : value,
            })
          }
          disabled={updateCalendarSettingsMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a default calendar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select a default calendar</SelectItem>
            {feeds
              .filter((feed) => feed.enabled)
              .map((feed) => (
                <SelectItem key={feed.id} value={feed.id}>
                  {feed.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Week Start Day"
        description="Set which day of the week your calendar should start on"
      >
        <Select
          value={userSettings.weekStartDay}
          onValueChange={(value) =>
            handleUpdateUserSettings({
              weekStartDay: value as "monday" | "sunday",
            })
          }
          disabled={updateUserSettingsMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select start day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sunday">Sunday</SelectItem>
            <SelectItem value="monday">Monday</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Working Hours"
        description="Set your working hours for better calendar visualization"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-working-hours"
              checked={calendarSettings.workingHoursEnabled}
              onCheckedChange={(checked) =>
                handleUpdateCalendarSettings({
                  workingHoursEnabled: checked as boolean,
                })
              }
              disabled={updateCalendarSettingsMutation.isPending}
            />
            <Label htmlFor="show-working-hours">Show working hours</Label>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={calendarSettings.workingHoursStart}
                onChange={(e) =>
                  handleUpdateCalendarSettings({
                    workingHoursStart: e.target.value,
                  })
                }
                disabled={updateCalendarSettingsMutation.isPending}
              />
            </div>
            <div className="flex-1">
              <Label>End Time</Label>
              <Input
                type="time"
                value={calendarSettings.workingHoursEnd}
                onChange={(e) =>
                  handleUpdateCalendarSettings({
                    workingHoursEnd: e.target.value,
                  })
                }
                disabled={updateCalendarSettingsMutation.isPending}
              />
            </div>
          </div>

          <div>
            <Label>Working Days</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {workingDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={workingHoursDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      const days = checked
                        ? [...workingHoursDays, day.value]
                        : workingHoursDays.filter((d) => d !== day.value);
                      handleUpdateCalendarSettings({
                        workingHoursDays: days,
                      });
                    }}
                    disabled={updateCalendarSettingsMutation.isPending}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingRow>
    </SettingsSection>
  );
}

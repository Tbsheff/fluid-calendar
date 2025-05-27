import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import {
  formatTime,
  parseSelectedCalendars,
  parseWorkDays,
} from "@/lib/autoSchedule";
import { trpc } from "@/lib/trpc/client";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function AutoScheduleSettings() {
  // Get autoSchedule settings with tRPC instead of deprecated store
  const { data: autoScheduleData, isLoading: isLoadingSettings } = trpc.settings.get.useQuery(
    { type: "autoSchedule" },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Update autoSchedule settings with tRPC
  const updateAutoScheduleSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Auto-schedule settings updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update auto-schedule settings: ${error.message}`);
    },
  });

  // Get feeds data with tRPC instead of deprecated calendar store
  const { data: feeds = [] } = trpc.feeds.getAll.useQuery(
    {},
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Cast the settings data to the expected type (tRPC returns union type)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autoSchedule = autoScheduleData as any; // AutoScheduleSettings type from Prisma

  // Show loading state
  if (isLoadingSettings || !autoSchedule) {
    return (
      <SettingsSection
        title="Auto-Schedule Settings"
        description="Configure how tasks are automatically scheduled in your calendar."
      >
        <div className="text-sm text-muted-foreground">Loading settings...</div>
      </SettingsSection>
    );
  }

  const workingDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: formatTime(i),
  }));

  const selectedCalendars = parseSelectedCalendars(
    autoSchedule.selectedCalendars
  );
  const workDays = parseWorkDays(autoSchedule.workDays);

  // Helper function to update settings via tRPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateSettings = (updates: any) => {
    updateAutoScheduleSettings.mutate({
      type: "autoSchedule",
      data: updates,
    });
  };

  return (
    <SettingsSection
      title="Auto-Schedule Settings"
      description="Configure how tasks are automatically scheduled in your calendar."
    >
      <SettingRow
        label="Calendars to Consider"
        description="Select which calendars to check for conflicts when auto-scheduling"
      >
        <div className="space-y-2">
          {feeds.map(
            (feed: { id: string; name: string; color?: string | null }) => (
              <div key={feed.id} className="flex items-center space-x-2">
                <Switch
                  checked={selectedCalendars.includes(feed.id)}
                  onCheckedChange={(checked) => {
                    const calendars = checked
                      ? [...selectedCalendars, feed.id]
                      : selectedCalendars.filter((id) => id !== feed.id);
                    handleUpdateSettings({
                      selectedCalendars: calendars,
                    });
                  }}
                />
                <Label className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: feed.color || "var(--muted)" }}
                  />
                  {feed.name}
                </Label>
              </div>
            )
          )}
          {feeds.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No calendars found. Please add calendars in the Calendar Settings.
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Working Hours"
        description="Set your preferred working hours for task scheduling"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Select
                value={autoSchedule.workHourStart.toString()}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    workHourStart: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Time</Label>
              <Select
                value={autoSchedule.workHourEnd.toString()}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    workHourEnd: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Working Days</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {workingDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Switch
                    checked={workDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      const days = checked
                        ? [...workDays, day.value]
                        : workDays.filter((d) => d !== day.value);
                      handleUpdateSettings({
                        workDays: days,
                      });
                    }}
                  />
                  <Label className="text-sm">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingRow>

      <SettingRow
        label="Energy Level Time Preferences"
        description="Map your energy levels to specific time ranges"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>High Energy Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={autoSchedule.highEnergyStart?.toString() || "none"}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    highEnergyStart: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={autoSchedule.highEnergyEnd?.toString() || "none"}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    highEnergyEnd: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Medium Energy Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={autoSchedule.mediumEnergyStart?.toString() || "none"}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    mediumEnergyStart:
                      value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={autoSchedule.mediumEnergyEnd?.toString() || "none"}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    mediumEnergyEnd: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Low Energy Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={autoSchedule.lowEnergyStart?.toString() || "none"}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    lowEnergyStart: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={autoSchedule.lowEnergyEnd?.toString() || "none"}
                onValueChange={(value) =>
                  handleUpdateSettings({
                    lowEnergyEnd: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SettingRow>

      <SettingRow
        label="Buffer Time"
        description="Minutes to leave between scheduled tasks"
      >
        <div className="space-y-4">
          <Slider
            value={[autoSchedule.bufferMinutes]}
            onValueChange={([value]) =>
              handleUpdateSettings({ bufferMinutes: value })
            }
            min={0}
            max={60}
            step={5}
          />
          <div className="text-sm text-muted-foreground">
            Current buffer: {autoSchedule.bufferMinutes} minutes
          </div>
        </div>
      </SettingRow>

      <SettingRow
        label="Project Grouping"
        description="Try to schedule tasks from the same project together"
      >
        <Switch
          checked={autoSchedule.groupByProject}
          onCheckedChange={(checked) =>
            handleUpdateSettings({ groupByProject: checked })
          }
        />
      </SettingRow>
    </SettingsSection>
  );
}

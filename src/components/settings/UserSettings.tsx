import { useSession } from "next-auth/react";
import Image from "next/image";

import { UserSettings as PrismaUserSettings } from "@prisma/client";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { trpc } from "@/lib/trpc/client";

import { TimeFormat, WeekStartDay } from "@/types/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function UserSettings() {
  const { data: session } = useSession();

  // Use tRPC to fetch and update user settings
  const { data: userSettingsData, isLoading } = trpc.settings.get.useQuery({
    type: "user",
  });

  // Cast to the correct type since we know we're fetching user settings
  const userSettings = userSettingsData as PrismaUserSettings | undefined;

  const updateUserSettingsMutation = trpc.settings.update.useMutation();

  const handleUpdateUserSettings = async (
    updates: Partial<{
      timeFormat: TimeFormat;
      weekStartDay: WeekStartDay;
      timeZone: string;
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

  const timeFormats: { value: TimeFormat; label: string }[] = [
    { value: "12h", label: "12-hour" },
    { value: "24h", label: "24-hour" },
  ];

  const weekStarts: { value: WeekStartDay; label: string }[] = [
    { value: "sunday", label: "Sunday" },
    { value: "monday", label: "Monday" },
  ];

  // Comprehensive list of common timezones
  const timeZones = [
    // UTC
    "UTC",
    // North America
    "America/Anchorage",
    "America/Chicago",
    "America/Denver",
    "America/Edmonton",
    "America/Halifax",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Montreal",
    "America/New_York",
    "America/Phoenix",
    "America/Toronto",
    "America/Vancouver",
    "America/Winnipeg",
    // South America
    "America/Bogota",
    "America/Buenos_Aires",
    "America/Caracas",
    "America/Lima",
    "America/Santiago",
    "America/Sao_Paulo",
    // Europe
    "Europe/Amsterdam",
    "Europe/Athens",
    "Europe/Berlin",
    "Europe/Brussels",
    "Europe/Budapest",
    "Europe/Copenhagen",
    "Europe/Dublin",
    "Europe/Helsinki",
    "Europe/Istanbul",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Oslo",
    "Europe/Paris",
    "Europe/Prague",
    "Europe/Rome",
    "Europe/Stockholm",
    "Europe/Vienna",
    "Europe/Warsaw",
    "Europe/Zurich",
    // Asia
    "Asia/Bangkok",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Jerusalem",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Kuala_Lumpur",
    "Asia/Manila",
    "Asia/Riyadh",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Taipei",
    "Asia/Tokyo",
    // Africa
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    // Oceania
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Darwin",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Pacific/Fiji",
    "Pacific/Honolulu",
  ];

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <SettingsSection
        title="User Settings"
        description="Manage your personal preferences for the calendar application."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading user settings...</div>
        </div>
      </SettingsSection>
    );
  }

  // Handle case where settings are not loaded
  if (!userSettings) {
    return (
      <SettingsSection
        title="User Settings"
        description="Manage your personal preferences for the calendar application."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Failed to load user settings
          </div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="User Settings"
      description="Manage your personal preferences for the calendar application."
    >
      {session?.user && (
        <SettingRow label="Profile" description="Your account information">
          <div className="flex items-center space-x-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || ""}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <div className="font-medium">{session.user.name}</div>
              <div className="text-sm text-muted-foreground">
                {session.user.email}
              </div>
            </div>
          </div>
        </SettingRow>
      )}

      <SettingRow
        label="Time Format"
        description="Choose how times are displayed"
      >
        <Select
          value={(userSettings as PrismaUserSettings)?.timeFormat}
          onValueChange={(value) =>
            handleUpdateUserSettings({ timeFormat: value as TimeFormat })
          }
          disabled={updateUserSettingsMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeFormats.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Week Starts On"
        description="Choose which day your week starts on"
      >
        <Select
          value={(userSettings as PrismaUserSettings)?.weekStartDay}
          onValueChange={(value) =>
            handleUpdateUserSettings({ weekStartDay: value as WeekStartDay })
          }
          disabled={updateUserSettingsMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekStarts.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Time Zone"
        description="Your current time zone setting"
      >
        <Select
          value={(userSettings as PrismaUserSettings)?.timeZone}
          onValueChange={(value) =>
            handleUpdateUserSettings({ timeZone: value })
          }
          disabled={updateUserSettingsMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {timeZones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </SettingsSection>
  );
}

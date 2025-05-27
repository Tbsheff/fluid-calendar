import { NotificationSettings as PrismaNotificationSettings } from "@prisma/client";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function NotificationSettings() {
  // Use tRPC to fetch and update notification settings
  const { data: notificationSettingsData, isLoading } =
    trpc.settings.get.useQuery({
      type: "notification",
    });

  // Cast to the correct type since we know we're fetching notification settings
  const notificationSettings = notificationSettingsData as
    | PrismaNotificationSettings
    | undefined;

  const updateNotificationSettingsMutation = trpc.settings.update.useMutation();

  const handleUpdateNotificationSettings = async (
    updates: Partial<{
      dailyEmailEnabled: boolean;
    }>
  ) => {
    try {
      await updateNotificationSettingsMutation.mutateAsync({
        type: "notification",
        data: updates,
      });

      toast.success("Notification settings updated successfully");
    } catch (error) {
      toast.error("Failed to update notification settings", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <SettingsSection
        title="Notification Settings"
        description="Configure your notification preferences."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Loading notification settings...
          </div>
        </div>
      </SettingsSection>
    );
  }

  // Handle case where settings are not loaded
  if (!notificationSettings) {
    return (
      <SettingsSection
        title="Notification Settings"
        description="Configure your notification preferences."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Failed to load notification settings
          </div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Notification Settings"
      description="Configure your notification preferences."
    >
      <SettingRow
        label="Daily Email Updates"
        description="Receive a daily email with your upcoming meetings and tasks"
      >
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notificationSettings.dailyEmailEnabled}
              onChange={(e) =>
                handleUpdateNotificationSettings({
                  dailyEmailEnabled: e.target.checked,
                })
              }
              disabled={updateNotificationSettingsMutation.isPending}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm">Enable daily email updates</span>
          </label>
        </div>
      </SettingRow>

      <div className="mt-4 text-sm text-muted-foreground">
        More notification settings coming soon! You&apos;ll be able to customize
        event reminders, updates, and more.
      </div>
    </SettingsSection>
  );
}

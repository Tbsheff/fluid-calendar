import { useSession } from "next-auth/react";

import { IntegrationSettings as PrismaIntegrationSettings } from "@prisma/client";
import { BsGoogle } from "react-icons/bs";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function IntegrationSettings() {
  const { data: session } = useSession();

  // Use tRPC to fetch and update integration settings
  const { data: integrationSettingsData, isLoading } =
    trpc.settings.get.useQuery({
      type: "integration",
    });

  // Cast to the correct type since we know we're fetching integration settings
  const integrationSettings = integrationSettingsData as
    | PrismaIntegrationSettings
    | undefined;

  const updateIntegrationSettingsMutation = trpc.settings.update.useMutation();

  const handleUpdateIntegrationSettings = async (
    updates: Partial<{
      googleCalendarEnabled: boolean;
      googleCalendarAutoSync: boolean;
      googleCalendarInterval: number;
    }>
  ) => {
    try {
      await updateIntegrationSettingsMutation.mutateAsync({
        type: "integration",
        data: updates,
      });

      toast.success("Integration settings updated successfully");
    } catch (error) {
      toast.error("Failed to update integration settings", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <SettingsSection
        title="Integration Settings"
        description="Manage your calendar integrations and synchronization settings."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Loading integration settings...
          </div>
        </div>
      </SettingsSection>
    );
  }

  // Handle case where settings are not loaded
  if (!integrationSettings) {
    return (
      <SettingsSection
        title="Integration Settings"
        description="Manage your calendar integrations and synchronization settings."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Failed to load integration settings
          </div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Integration Settings"
      description="Manage your calendar integrations and synchronization settings."
    >
      <SettingRow
        label="Google Calendar"
        description="Configure your Google Calendar integration"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BsGoogle className="h-6 w-6 text-gray-500" />
              <div>
                <div className="font-medium">Google Calendar</div>
                <div className="text-sm text-gray-500">
                  {session?.user?.email || "Not connected"}
                </div>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={integrationSettings.googleCalendarEnabled}
                onChange={(e) =>
                  handleUpdateIntegrationSettings({
                    googleCalendarEnabled: e.target.checked,
                  })
                }
                disabled={updateIntegrationSettingsMutation.isPending}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
            </label>
          </div>

          {integrationSettings.googleCalendarEnabled && (
            <>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={integrationSettings.googleCalendarAutoSync}
                  onChange={(e) =>
                    handleUpdateIntegrationSettings({
                      googleCalendarAutoSync: e.target.checked,
                    })
                  }
                  disabled={updateIntegrationSettingsMutation.isPending}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Enable auto-sync</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={integrationSettings.googleCalendarInterval}
                  onChange={(e) =>
                    handleUpdateIntegrationSettings({
                      googleCalendarInterval: Number(e.target.value),
                    })
                  }
                  disabled={updateIntegrationSettingsMutation.isPending}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </>
          )}
        </div>
      </SettingRow>
    </SettingsSection>
  );
}

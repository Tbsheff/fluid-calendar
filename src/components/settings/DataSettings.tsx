import { DataSettings as PrismaDataSettings } from "@prisma/client";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function DataSettings() {
  // Use tRPC to fetch and update data settings
  const { data: dataSettingsData, isLoading } = trpc.settings.get.useQuery({
    type: "data",
  });

  // Cast to the correct type since we know we're fetching data settings
  const dataSettings = dataSettingsData as PrismaDataSettings | undefined;

  const updateDataSettingsMutation = trpc.settings.update.useMutation();

  const handleUpdateDataSettings = async (
    updates: Partial<{
      autoBackup: boolean;
      backupInterval: number;
      retainDataFor: number;
    }>
  ) => {
    try {
      await updateDataSettingsMutation.mutateAsync({
        type: "data",
        data: updates,
      });

      toast.success("Data settings updated successfully");
    } catch (error) {
      toast.error("Failed to update data settings", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <SettingsSection
        title="Data Settings"
        description="Manage your calendar data and backup preferences."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading data settings...</div>
        </div>
      </SettingsSection>
    );
  }

  // Handle case where settings are not loaded
  if (!dataSettings) {
    return (
      <SettingsSection
        title="Data Settings"
        description="Manage your calendar data and backup preferences."
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Failed to load data settings
          </div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Data Settings"
      description="Manage your calendar data and backup preferences."
    >
      <SettingRow
        label="Automatic Backup"
        description="Regularly backup your calendar data"
      >
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dataSettings.autoBackup}
              onChange={(e) =>
                handleUpdateDataSettings({
                  autoBackup: e.target.checked,
                })
              }
              disabled={updateDataSettingsMutation.isPending}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm">Enable automatic backups</span>
          </label>

          {dataSettings.autoBackup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Backup Interval (days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={dataSettings.backupInterval}
                onChange={(e) =>
                  handleUpdateDataSettings({
                    backupInterval: Number(e.target.value),
                  })
                }
                disabled={updateDataSettingsMutation.isPending}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Data Retention"
        description="Configure how long to keep your calendar data"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Retain data for (days)
          </label>
          <input
            type="number"
            min="30"
            max="3650"
            value={dataSettings.retainDataFor}
            onChange={(e) =>
              handleUpdateDataSettings({
                retainDataFor: Number(e.target.value),
              })
            }
            disabled={updateDataSettingsMutation.isPending}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Events older than this will be automatically archived
          </p>
        </div>
      </SettingRow>

      <SettingRow label="Export Data" description="Download your calendar data">
        <div className="space-y-3">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Export as iCal
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Export as JSON
          </button>
        </div>
      </SettingRow>

      <SettingRow label="Clear Data" description="Remove all calendar data">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to clear all calendar data? This action cannot be undone."
              )
            ) {
              // TODO: Implement clear data functionality
            }
          }}
        >
          Clear All Data
        </button>
      </SettingRow>
    </SettingsSection>
  );
}

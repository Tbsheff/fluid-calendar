import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { logger } from "@/lib/logger";
import { LogSettings as LogSettingsType } from "@/lib/logger/types";
import { trpc } from "@/lib/trpc/client";

const LOG_SOURCE = "LogSettings";

export function LogSettings() {
  const [settings, setSettings] = useState<LogSettingsType>({
    logLevel: "none",
    logDestination: "db",
    logRetention: {
      error: 30,
      warn: 14,
      info: 7,
      debug: 3,
    },
  });
  const [saved, setSaved] = useState(false);
  const utils = trpc.useUtils();

  logger.info("LogSettings component mounted", undefined, LOG_SOURCE);

  // Use tRPC query for log settings
  const {
    data: logSettingsData,
    isLoading: loading,
    error: queryError,
  } = trpc.logs.getSettings.useQuery();

  // Use tRPC mutation for updating log settings
  const updateLogSettingsMutation = trpc.logs.updateSettings.useMutation({
    onSuccess: () => {
      logger.info(
        "Log settings updated successfully",
        {
          settings: JSON.stringify(settings),
        },
        LOG_SOURCE
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Clear saved message after 3 seconds
      utils.logs.getSettings.invalidate();
    },
    onError: (error) => {
      logger.error(
        "Failed to update log settings",
        {
          error: error.message,
          settings: JSON.stringify(settings),
        },
        LOG_SOURCE
      );
    },
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (logSettingsData) {
      setSettings({
        logLevel: logSettingsData.logLevel as LogSettingsType["logLevel"],
        logDestination:
          logSettingsData.logDestination as LogSettingsType["logDestination"],
        logRetention: logSettingsData.logRetention,
      });
      logger.debug(
        "Log settings fetched successfully",
        {
          settings: JSON.stringify(logSettingsData),
        },
        LOG_SOURCE
      );
    }
  }, [logSettingsData]);

  // Handle loading error
  useEffect(() => {
    if (queryError) {
      logger.error(
        "Failed to fetch log settings",
        {
          error: queryError.message,
        },
        LOG_SOURCE
      );
    }
  }, [queryError]);

  const handleSave = async () => {
    try {
      await updateLogSettingsMutation.mutateAsync(settings);
    } catch (error) {
      // Error is already handled in the mutation onError callback
      console.error("Save failed:", error);
    }
  };

  const error = queryError?.message || updateLogSettingsMutation.error?.message;

  if (loading) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Settings</CardTitle>
        <CardDescription>
          Configure how logs are stored and managed in the system.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saved && (
          <Alert>
            <AlertDescription>Settings saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logLevel">Log Level</Label>
            <Select
              value={settings.logLevel}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  logLevel: value as LogSettingsType["logLevel"],
                })
              }
            >
              <SelectTrigger id="logLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logDestination">Log Destination</Label>
            <Select
              value={settings.logDestination}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  logDestination: value as LogSettingsType["logDestination"],
                })
              }
            >
              <SelectTrigger id="logDestination">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="db">Database Only</SelectItem>
                <SelectItem value="file">File Only</SelectItem>
                <SelectItem value="both">Both Database and File</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Retention Periods (Days)</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(settings.logRetention).map(([level, days]) => (
              <div key={level} className="space-y-2">
                <Label htmlFor={`retention-${level}`} className="capitalize">
                  {level}
                </Label>
                <Input
                  type="number"
                  id={`retention-${level}`}
                  value={days}
                  min={1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      logRetention: {
                        ...settings.logRetention,
                        [level]: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

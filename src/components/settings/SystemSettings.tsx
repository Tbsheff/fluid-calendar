import { useEffect } from "react";
import { toast } from "sonner";

import AccessDeniedMessage from "@/components/auth/AccessDeniedMessage";
import AdminOnly from "@/components/auth/AdminOnly";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { clearResendInstance } from "@/lib/email/resend";
import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";

import { SettingRow, SettingsSection } from "./SettingsSection";

const LOG_SOURCE = "SystemSettings";

/**
 * System settings component
 * Allows admins to configure system-wide settings
 * Only accessible by admin users
 */
export function SystemSettings() {
  const utils = trpc.useUtils();

  // Use tRPC query for system settings
  const { data: systemSettingsData, error, isLoading } =
    trpc.systemSettings.get.useQuery();

  // Use tRPC mutation for updating system settings
  const updateSystemSettingsMutation = trpc.systemSettings.update.useMutation({
    onSuccess: () => {
      toast.success("System settings updated successfully");
      utils.systemSettings.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update system settings: ${error.message}`);
      logger.error(
        "Failed to update system settings",
        { error: error.message },
        LOG_SOURCE
      );
    },
  });

  // Handle loading and error states
  useEffect(() => {
    if (error) {
      toast.error(`Failed to load system settings: ${error.message}`);
      logger.error(
        "Failed to load system settings",
        { error: error.message },
        LOG_SOURCE
      );
    }
  }, [error]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (updates: any) => {
    try {
      await updateSystemSettingsMutation.mutateAsync(updates);

      // Clear Resend instance if the API key was updated
      if ("resendApiKey" in updates) {
        clearResendInstance();
      }
    } catch (error) {
      // Error is already handled in the mutation onError callback
      console.error("Update failed:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <AdminOnly
        fallback={
          <AccessDeniedMessage message="You do not have permission to access system settings." />
        }
      >
        <SettingsSection
          title="System Settings"
          description="Configure system-wide settings for the application."
        >
          <div className="text-sm text-muted-foreground">Loading settings...</div>
        </SettingsSection>
      </AdminOnly>
    );
  }

  // Use systemSettingsData directly instead of store
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const system = (systemSettingsData || {}) as any;

  return (
    <AdminOnly
      fallback={
        <AccessDeniedMessage message="You do not have permission to access system settings." />
      }
    >
      <SettingsSection
        title="System Settings"
        description="Configure system-wide settings for the application."
      >
        <SettingRow
          label="Google Calendar Integration"
          description={
            <div className="space-y-2">
              <div>
                Configure Google OAuth credentials for calendar integration.
              </div>
              <div>
                To get these credentials:
                <ol className="ml-4 mt-1 list-decimal space-y-1 text-muted-foreground">
                  <li>
                    Go to the{" "}
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Create a new project or select an existing one</li>
                  <li>Enable the Google Calendar API</li>
                  <li>Go to Credentials</li>
                  <li>Create OAuth 2.0 Client ID credentials</li>
                  <li>
                    Add authorized redirect URI: {window.location.origin}
                    /api/calendar/google
                  </li>
                  <li>Copy the Client ID and Client Secret</li>
                </ol>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Google Client ID</Label>
              <Input
                type="text"
                value={system.googleClientId || ""}
                onChange={(e) =>
                  handleUpdate({ googleClientId: e.target.value })
                }
                placeholder="your-client-id.apps.googleusercontent.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Google Client Secret</Label>
              <Input
                type="password"
                value={system.googleClientSecret || ""}
                onChange={(e) =>
                  handleUpdate({ googleClientSecret: e.target.value })
                }
                placeholder="Enter your client secret"
              />
            </div>
          </div>
        </SettingRow>

        <SettingRow
          label="Outlook Calendar Integration"
          description={
            <div className="space-y-2">
              <div>
                Configure Microsoft Azure AD credentials for Outlook calendar
                integration.
              </div>
              <div>
                To get these credentials:
                <ol className="ml-4 mt-1 list-decimal space-y-1 text-muted-foreground">
                  <li>
                    Go to the{" "}
                    <a
                      href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Azure Portal
                    </a>
                  </li>
                  <li>Register a new application or select an existing one</li>
                  <li>Add Microsoft Graph Calendar permissions</li>
                  <li>Go to Authentication</li>
                  <li>Add platform and configure OAuth settings</li>
                  <li>
                    Add redirect URI: {window.location.origin}
                    /api/auth/callback/azure-ad
                  </li>
                  <li>
                    Copy the Application (client) ID and create a client secret
                  </li>
                </ol>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Outlook Client ID</Label>
              <Input
                type="text"
                value={system.outlookClientId || ""}
                onChange={(e) =>
                  handleUpdate({ outlookClientId: e.target.value })
                }
                placeholder="your-client-id"
              />
            </div>

            <div className="space-y-2">
              <Label>Outlook Client Secret</Label>
              <Input
                type="password"
                value={system.outlookClientSecret || ""}
                onChange={(e) =>
                  handleUpdate({ outlookClientSecret: e.target.value })
                }
                placeholder="Enter your client secret"
              />
            </div>

            <div className="space-y-2">
              <Label>Outlook Tenant ID</Label>
              <Input
                type="text"
                value={system.outlookTenantId || ""}
                onChange={(e) =>
                  handleUpdate({ outlookTenantId: e.target.value })
                }
                placeholder="your-tenant-id"
              />
            </div>
          </div>
        </SettingRow>

        <SettingRow
          label="Email Service"
          description="Configure Resend API key for sending emails"
        >
          <div className="space-y-2">
            <Label>Resend API Key</Label>
            <Input
              type="password"
              value={system.resendApiKey || ""}
              onChange={(e) => handleUpdate({ resendApiKey: e.target.value })}
              placeholder="Enter your Resend API key"
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Logging Level"
          description="Set the minimum level for logging"
        >
          <Select
            value={system.logLevel || "info"}
            onValueChange={(value) => handleUpdate({ logLevel: value })}
          >
            <SelectTrigger>
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
        </SettingRow>
      </SettingsSection>
    </AdminOnly>
  );
}

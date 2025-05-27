"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { trpc } from "@/lib/trpc/client";

export default function PublicSignupSettings() {
  const [publicSignup, setPublicSignup] = useState(false);
  const utils = trpc.useUtils();

  // Use tRPC query for system settings
  const {
    data: systemSettingsData,
    isLoading,
    error,
  } = trpc.systemSettings.get.useQuery();

  // Use tRPC mutation for updating system settings
  const updateSystemSettingsMutation = trpc.systemSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      utils.systemSettings.get.invalidate();
    },
    onError: (error) => {
      console.error("Failed to save system settings:", error);
      toast.error("Failed to save settings");
    },
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (systemSettingsData) {
      setPublicSignup(systemSettingsData.publicSignup || false);
    }
  }, [systemSettingsData]);

  // Handle loading error
  useEffect(() => {
    if (error) {
      console.error("Failed to fetch system settings:", error);
      toast.error("Failed to load settings");
    }
  }, [error]);

  const handleSave = async () => {
    try {
      await updateSystemSettingsMutation.mutateAsync({
        publicSignup,
      });
    } catch (error) {
      // Error is already handled in the mutation onError callback
      console.error("Save failed:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Signup</CardTitle>
        <CardDescription>
          Control whether new users can sign up for an account without admin
          approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading settings...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Switch
              id="public-signup"
              checked={publicSignup}
              onCheckedChange={setPublicSignup}
            />
            <Label htmlFor="public-signup">
              {publicSignup
                ? "Public signup is enabled"
                : "Public signup is disabled"}
            </Label>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={isLoading || updateSystemSettingsMutation.isPending}
        >
          {updateSystemSettingsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

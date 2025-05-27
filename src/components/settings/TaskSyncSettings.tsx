import { useEffect, useState } from "react";

import {
  Calendar,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { format } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";

import { SettingRow, SettingsSection } from "./SettingsSection";

// Logging source
const LOG_SOURCE = "TaskSyncSettings";

// Types for providers and mappings
interface TaskProvider {
  id: string;
  type: "OUTLOOK" | "CALDAV";
  name: string;
  accountId?: string;
  accountEmail?: string; // This will be populated from the account for UI display
  enabled: boolean;
  syncEnabled: boolean;
  syncInterval: string;
  lastSyncedAt?: string | Date;
  defaultProjectId?: string;
  error?: string;
  settings?: {
    [key: string]: string | number | boolean | undefined;
  };
}

interface TaskList {
  id: string;
  name: string;
  isDefaultFolder?: boolean;
  isMapped: boolean;
  mappingId?: string;
  projectId?: string;
  projectName?: string;
  lastSyncedAt?: string;
  mappingDirection?: "incoming" | "outgoing" | "bidirectional";
}

export function TaskSyncSettings() {
  // Get accounts with tRPC instead of deprecated store
  const { data: accounts = [], isLoading: isLoadingAccounts } = trpc.accounts.getAll.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  // Get projects with tRPC instead of deprecated store
  const { data: projects = [] } = trpc.projects.getAll.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  const utils = trpc.useUtils();

  // State
  const [selectedProvider, setSelectedProvider] = useState<TaskProvider | null>(
    null
  );
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [activeTab, setActiveTab] = useState("task-lists");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  // Get accounts that can be used as task providers
  const compatibleAccounts = accounts.filter(
    (acc) => acc.provider === "OUTLOOK" || acc.provider === "GOOGLE"
  );

  // tRPC query for fetching providers
  const {
    data: providers,
    isLoading: isLoadingProviders,
    error: providersError,
    refetch: refetchProviders,
  } = trpc.taskSync.providers.getAll.useQuery({
    includeAccount: true,
    includeMappings: false,
  });

  // Handle provider data changes
  useEffect(() => {
    if (providers) {
      // Enrich providers with account emails - This might be better done on the backend
      const enrichedData = providers?.map((provider) => {
        const account = accounts.find((acc) => acc.id === provider.accountId);
        return {
          ...provider,
          accountEmail: account?.email || "Unknown Account",
        };
      }) as TaskProvider[] | undefined; // Type assertion

      if (enrichedData && enrichedData.length > 0 && !selectedProvider) {
        setSelectedProvider(enrichedData[0]);
      }
      // If selectedProvider is no longer in the list, reset it
      if (
        selectedProvider &&
        !enrichedData?.find((p) => p.id === selectedProvider.id)
      ) {
        setSelectedProvider(
          enrichedData && enrichedData.length > 0 ? enrichedData[0] : null
        );
      }
    }
  }, [providers, accounts, selectedProvider]);

  // Handle provider error
  useEffect(() => {
    if (providersError) {
      logger.error(
        "Failed to fetch task providers via tRPC",
        { error: providersError.message },
        LOG_SOURCE
      );
      toast.error("Failed to load task providers.");
    }
  }, [providersError]);

  // tRPC mutation for creating a provider
  const createProviderMutation = trpc.taskSync.providers.create.useMutation({
    onSuccess: () => {
      utils.taskSync.providers.getAll.invalidate(); // Refetch providers list
      toast.success("Task provider created successfully!");
      setIsDialogOpen(false);
      setNewProviderName("");
      setSelectedAccount("");
    },
    onError: (error) => {
      logger.error(
        "Failed to create task provider via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error(`Failed to create task provider: ${error.message}`);
    },
  });

  // tRPC mutation for deleting a provider
  const deleteProviderMutation = trpc.taskSync.providers.delete.useMutation({
    onSuccess: () => {
      utils.taskSync.providers.getAll.invalidate();
      toast.success("Task provider deleted successfully");
      setSelectedProvider(null);
    },
    onError: (error) => {
      logger.error(
        "Failed to delete task provider via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error("Failed to delete task provider");
    },
  });

  // tRPC mutation for creating a mapping
  const createMappingMutation = trpc.taskSync.mappings.create.useMutation({
    onSuccess: () => {
      utils.taskSync.providers.getLists.invalidate();
      utils.taskSync.mappings.getAll.invalidate();
      toast.success("Task list mapped successfully");
    },
    onError: (error) => {
      logger.error(
        "Failed to create task list mapping via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error("Failed to create task list mapping");
    },
  });

  // tRPC mutation for deleting a mapping
  const deleteMappingMutation = trpc.taskSync.mappings.delete.useMutation({
    onSuccess: () => {
      utils.taskSync.providers.getLists.invalidate();
      utils.taskSync.mappings.getAll.invalidate();
      toast.success("Task list mapping removed successfully");
    },
    onError: (error) => {
      logger.error(
        "Failed to remove task list mapping via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error("Failed to remove task list mapping");
    },
  });

  // tRPC mutation for triggering sync
  const triggerSyncMutation = trpc.taskSync.sync.trigger.useMutation({
    onSuccess: () => {
      toast.success("Sync job scheduled");
    },
    onError: (error) => {
      logger.error(
        "Failed to trigger sync via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error("Failed to trigger sync");
    },
  });

  // tRPC mutation for creating a project
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.getAll.invalidate(); // Refresh projects via tRPC
    },
    onError: (error) => {
      logger.error(
        "Failed to create project via tRPC",
        { error: error.message },
        LOG_SOURCE
      );
      toast.error("Failed to create new project");
    },
  });

  // tRPC query for fetching task lists
  const {
    data: taskListsData,
    isLoading: isLoadingTaskLists,
    error: taskListsError,
  } = trpc.taskSync.providers.getLists.useQuery(
    {
      providerId: selectedProvider?.id || "",
    },
    {
      enabled: !!selectedProvider?.id,
    }
  );

  // Update task lists when data changes
  useEffect(() => {
    if (taskListsData?.lists) {
      // Transform the API response to match TaskList interface
      const transformedLists: TaskList[] = taskListsData.lists.map((list) => ({
        id: list.id,
        name: list.name,
        isMapped: false, // Will be updated when mappings are loaded
        isDefaultFolder: false, // This would need to come from the API if needed
      }));
      setTaskLists(transformedLists);
    }
  }, [taskListsData]);

  // Handle task lists error
  useEffect(() => {
    if (taskListsError) {
      logger.error(
        "Failed to fetch task lists via tRPC",
        { error: taskListsError.message },
        LOG_SOURCE
      );
    }
  }, [taskListsError]);

  // Create a new provider
  const createProvider = async () => {
    if (!newProviderName || !selectedAccount) {
      toast.error("Provider name and account are required.");
      return;
    }

    const selectedAccountDetails = accounts.find(
      (acc) => acc.id === selectedAccount
    );
    if (!selectedAccountDetails) {
      toast.error("Selected account not found.");
      return;
    }

    createProviderMutation.mutate({
      name: newProviderName,
      type: selectedAccountDetails.provider as "OUTLOOK" | "GOOGLE", // Ensure type compatibility
      accountId: selectedAccount,
      syncEnabled: true, // Default to enabled
      // settings: {}, // Add any default settings if needed
    });
  };

  // Delete a provider
  const deleteProvider = async (providerId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this provider? All task list mappings associated with this provider will also be deleted."
      )
    ) {
      return;
    }

    deleteProviderMutation.mutate({ providerId });
  };

  // Create a mapping for a task list
  const createMapping = async (
    externalListId: string,
    projectId: string,
    createNewProject: boolean = false
  ) => {
    if (!selectedProvider) return;

    const list = taskLists.find((l) => l.id === externalListId);

    // If creating a new project
    if (createNewProject && list) {
      createProjectMutation.mutate(
        {
          name: list.name,
          description: `Project created for syncing with ${selectedProvider.name} task list`,
        },
        {
          onSuccess: (newProject) => {
            // Create mapping with the new project
            createMappingMutation.mutate({
              providerId: selectedProvider.id,
              externalListId,
              externalListName: list.name,
              projectId: newProject.id,
              direction: "bidirectional",
            });
          },
        }
      );
    } else {
      // Create mapping with existing project
      createMappingMutation.mutate({
        providerId: selectedProvider.id,
        externalListId,
        externalListName: list?.name || "Unknown List",
        projectId,
        direction: "bidirectional",
      });
    }
  };

  // Delete a mapping
  const deleteMapping = async (mappingId: string) => {
    if (!window.confirm("Are you sure you want to remove this mapping?")) {
      return;
    }

    deleteMappingMutation.mutate({ mappingId });
  };

  // Trigger sync for the selected provider
  const triggerSync = async (providerId: string) => {
    triggerSyncMutation.mutate({
      providerId,
      forceSync: false,
    });
  };

  // Find unused accounts (accounts that are not already task providers)
  const unusedAccounts = compatibleAccounts.filter(
    (account) =>
      !providers?.some((provider) => {
        const enrichedProvider = {
          ...provider,
          accountEmail:
            accounts.find((acc) => acc.id === provider.accountId)?.email ||
            "Unknown Account",
        };
        return (
          enrichedProvider.accountEmail === account.email &&
          provider.type === account.provider
        );
      })
  );

  // Trigger sync for a specific mapping
  const triggerMappingSync = async (mappingId: string) => {
    triggerSyncMutation.mutate({
      mappingId,
      forceSync: false,
    });
  };

  // Render the provider selection and creation UI
  const renderProviderSelection = () => {
    if (isLoadingProviders) {
      return (
        <SettingsSection
          title="Task Sync Providers"
          description="Loading task sync providers..."
        >
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2">Loading providers...</p>
          </div>
        </SettingsSection>
      );
    }

    if (providersError) {
      return (
        <SettingsSection
          title="Task Sync Providers"
          description="Error loading task sync providers"
        >
          <Alert variant="destructive">
            <AlertTitle>Error Loading Providers</AlertTitle>
            <AlertDescription>
              There was an issue fetching your task sync providers. Please try
              again later.
              <br />
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => refetchProviders()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </SettingsSection>
      );
    }

    const displayableProviders =
      (providers?.map((provider) => {
        const account = accounts.find((acc) => acc.id === provider.accountId);
        return {
          ...provider,
          accountEmail: account?.email || "Unknown Account",
        };
      }) as TaskProvider[]) || [];

    return (
      <SettingRow
        label="Task Provider"
        description="Select or create a task provider"
      >
        <div className="space-y-4">
          {displayableProviders.length > 0 ? (
            <Select
              value={selectedProvider?.id || ""}
              onValueChange={(value) => {
                const provider = displayableProviders.find(
                  (p) => p.id === value
                );
                setSelectedProvider(provider || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {displayableProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} ({provider.accountEmail})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Alert>
              <AlertTitle>No Task Providers</AlertTitle>
              <AlertDescription>
                You need to create a task provider to sync tasks from external
                services.
              </AlertDescription>
            </Alert>
          )}

          {unusedAccounts.length > 0 && (
            <div className="pt-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Task Provider</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Provider Name</Label>
                      <Input
                        id="name"
                        value={newProviderName}
                        onChange={(e) => setNewProviderName(e.target.value)}
                        placeholder="e.g., Work Outlook Tasks"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="account">Account</Label>
                      <Select
                        value={selectedAccount}
                        onValueChange={setSelectedAccount}
                      >
                        <SelectTrigger id="account">
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                          {unusedAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.email} ({account.provider})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createProvider}
                      disabled={
                        createProviderMutation.isPending ||
                        !newProviderName ||
                        !selectedAccount
                      }
                    >
                      {createProviderMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Provider
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </SettingRow>
    );
  };

  // Render provider details and actions
  const renderProviderDetails = () => {
    if (!selectedProvider) return null;

    return (
      <SettingRow
        label="Provider Details"
        description="View and manage provider settings"
      >
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Provider Type
                </div>
                <div className="font-medium capitalize">
                  {selectedProvider.type}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Account</div>
                <div className="font-medium">
                  {selectedProvider.accountEmail}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Synced</div>
                <div className="font-medium">
                  {selectedProvider.lastSyncedAt
                    ? format(
                        typeof selectedProvider.lastSyncedAt === "string"
                          ? new Date(selectedProvider.lastSyncedAt)
                          : selectedProvider.lastSyncedAt,
                        "PPp"
                      )
                    : "Never"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Sync Interval
                </div>
                <div className="font-medium">
                  {selectedProvider.syncInterval === "0"
                    ? "Manual only"
                    : `${selectedProvider.syncInterval} minutes`}
                </div>
              </div>
            </div>

            {selectedProvider.error && (
              <Alert variant="destructive">
                <AlertTitle>Sync Error</AlertTitle>
                <AlertDescription>{selectedProvider.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteProvider(selectedProvider.id)}
              disabled={isLoadingTaskLists}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Provider
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSync(selectedProvider.id)}
              disabled={isLoadingTaskLists}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </Button>
          </CardFooter>
        </Card>
      </SettingRow>
    );
  };

  // Render task lists and mappings
  const renderTaskLists = () => {
    if (!selectedProvider) return null;

    // Project options are created directly from the projects prop
    const projectOptions = projects.map((p) => ({
      value: p.id,
      label: p.name,
    }));

    return (
      <SettingRow
        label="Task Lists"
        description="Map external task lists to FluidCalendar projects"
      >
        <div className="space-y-4">
          {taskListsError && (
            <Alert variant="destructive">
              <AlertDescription>
                {taskListsError.message || "Failed to load task lists"}
              </AlertDescription>
            </Alert>
          )}

          {isLoadingTaskLists ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading task lists...
              </span>
            </div>
          ) : taskLists.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No task lists found for this provider.
            </div>
          ) : (
            <div className="space-y-3">
              {taskLists.map((list) => (
                <Card key={list.id}>
                  <CardContent className="flex items-start justify-between pt-6">
                    <div>
                      <div className="text-sm font-medium">
                        {list.name}
                        {list.isDefaultFolder && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Default)
                          </span>
                        )}
                      </div>
                      {list.isMapped ? (
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">
                            Mapped to project:
                          </span>{" "}
                          <span>{list.projectName}</span>
                          {list.lastSyncedAt && (
                            <div className="text-xs text-muted-foreground">
                              Last synced:{" "}
                              {format(new Date(list.lastSyncedAt), "PPp")}
                            </div>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                list.mappingId &&
                                triggerMappingSync(list.mappingId)
                              }
                              disabled={isLoadingTaskLists || !list.mappingId}
                            >
                              <RefreshCw className="mr-1 h-4 w-4" />
                              Sync
                            </Button>
                          </div>
                          <div className="mt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                list.mappingId && deleteMapping(list.mappingId)
                              }
                              disabled={isLoadingTaskLists}
                            >
                              Remove Mapping
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <div className="mb-2 text-sm text-muted-foreground">
                            Not mapped to any project
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Select
                              disabled={
                                isLoadingTaskLists ||
                                projectOptions.length === 0
                              }
                              onValueChange={(projectId) =>
                                createMapping(list.id, projectId)
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Map to existing project" />
                              </SelectTrigger>
                              <SelectContent>
                                {projectOptions.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No projects available
                                  </SelectItem>
                                ) : (
                                  projectOptions.map((project) => (
                                    <SelectItem
                                      key={project.value}
                                      value={project.value}
                                    >
                                      {project.label}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createMapping(list.id, "", true)}
                              disabled={isLoadingTaskLists}
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Create New Project
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge variant={list.isMapped ? "default" : "outline"}>
                      {list.isMapped ? "Mapped" : "Not Mapped"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SettingRow>
    );
  };

  // Render sync history
  const renderSyncHistory = () => {
    if (!selectedProvider) return null;

    return (
      <SettingRow
        label="Sync History"
        description="View recent sync activities and results"
      >
        <div className="p-4 text-center text-muted-foreground">
          <p>Sync history will be available in a future update.</p>
        </div>
      </SettingRow>
    );
  };

  // Show loading state for accounts
  if (isLoadingAccounts) {
    return (
      <SettingsSection
        title="Task Synchronization"
        description="Manage task synchronization with external services such as Outlook or Google Tasks."
      >
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Task Synchronization"
      description="Manage task synchronization with external services such as Outlook or Google Tasks."
    >
      {compatibleAccounts.length === 0 ? (
        <SettingRow
          label="No Compatible Accounts"
          description="Connect an Outlook account to sync tasks"
        >
          <div className="text-sm text-muted-foreground">
            Go to the Accounts tab to connect a compatible account.
          </div>
        </SettingRow>
      ) : (
        <>
          {renderProviderSelection()}

          {selectedProvider && (
            <>
              {renderProviderDetails()}

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="task-lists" className="flex-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    Task Lists
                  </TabsTrigger>
                  <TabsTrigger value="sync-history" className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Sync History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="task-lists" className="mt-0">
                  {renderTaskLists()}
                </TabsContent>
                <TabsContent value="sync-history" className="mt-0">
                  {renderSyncHistory()}
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
    </SettingsSection>
  );
}

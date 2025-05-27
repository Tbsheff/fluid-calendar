import { useState } from "react";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import AccessDeniedMessage from "@/components/auth/AccessDeniedMessage";
import AdminOnly from "@/components/auth/AdminOnly";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { logger } from "@/lib/logger";
import { LogLevel } from "@/lib/logger/types";
import { trpc } from "@/lib/trpc/client";

import { LogMetadata } from "@/types/logging";

import { LogFilters } from "./LogFilters";
import { LogSettings } from "./LogSettings";
import { LogTable } from "./LogTable";

const LOG_SOURCE = "LogViewer";

interface LogViewFilters {
  level: LogLevel | "";
  source: string;
  from: string;
  to: string;
  search: string;
}

interface LogViewPagination {
  current: number;
  limit: number;
}

const DEFAULT_FILTERS: LogViewFilters = {
  level: "",
  source: "",
  from: "",
  to: "",
  search: "",
};

const DEFAULT_PAGINATION: LogViewPagination = {
  current: 1,
  limit: 50,
};

/**
 * Log viewer component
 * Allows admins to view and filter application logs
 * Only accessible by admin users
 */
export function LogViewer() {
  const [filters, setFilters] = useState<LogViewFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] =
    useState<LogViewPagination>(DEFAULT_PAGINATION);

  // Use tRPC to fetch log sources
  const { data: sourcesData } = trpc.logs.getSources.useQuery();

  // Use tRPC to fetch logs with current filters and pagination
  const {
    data: logsData,
    isLoading: loading,
    error: queryError,
  } = trpc.logs.get.useQuery({
    page: pagination.current,
    limit: pagination.limit,
    ...(filters.level && { level: filters.level }),
    ...(filters.source && { source: filters.source }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to }),
    ...(filters.search && { search: filters.search }),
  });

  // Use tRPC mutation for cleanup
  const cleanupMutation = trpc.logs.cleanup.useMutation({
    onSuccess: (data) => {
      logger.info(
        "Log cleanup completed",
        {
          deletedCount: String(data.count),
          timestamp: new Date().toISOString(),
        },
        LOG_SOURCE
      );
      toast.success(`Successfully cleaned up ${data.count} expired logs`);
    },
    onError: (error) => {
      logger.error(
        "Failed to cleanup logs",
        {
          error: error.message,
        },
        LOG_SOURCE
      );
      toast.error("Failed to cleanup logs", {
        description: error.message,
      });
    },
  });

  const handleFilterChange = (newFilters: LogViewFilters) => {
    logger.debug(
      "Log filters changed",
      {
        oldFilters: JSON.stringify(filters),
        newFilters: JSON.stringify(newFilters),
      },
      LOG_SOURCE
    );
    setFilters(newFilters);
    setPagination({ ...pagination, current: 1 }); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    logger.debug(
      "Log page changed",
      {
        oldPage: String(pagination.current),
        newPage: String(page),
      },
      LOG_SOURCE
    );
    setPagination({ ...pagination, current: page });
  };

  const handleCleanup = async () => {
    try {
      logger.info("Starting log cleanup", undefined, LOG_SOURCE);
      await cleanupMutation.mutateAsync();
    } catch (error) {
      // Error is already handled in the mutation onError callback
      console.error("Cleanup failed:", error);
    }
  };

  const error = queryError?.message;
  // Transform logs to match the expected Log type (convert Date objects to strings)
  const logs =
    logsData?.logs?.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
      expiresAt: log.expiresAt.toISOString(),
      level: log.level as LogLevel,
      source: log.source || undefined,
      metadata: (log.metadata || {}) as LogMetadata,
    })) || [];
  const sources = sourcesData?.sources || [];
  const totalLogs = logsData?.pagination?.total || 0;
  const totalPages = logsData?.pagination?.pages || 0;

  return (
    <AdminOnly
      fallback={
        <AccessDeniedMessage message="You do not have permission to access application logs." />
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">System Logs</h2>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={loading || cleanupMutation.isPending}
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Cleanup Expired Logs
          </Button>
        </div>

        <LogSettings />

        <LogFilters
          filters={filters}
          sources={sources}
          onChange={handleFilterChange}
          disabled={loading}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <LogTable
          logs={logs}
          loading={loading}
          pagination={{
            current: pagination.current,
            limit: pagination.limit,
            total: totalLogs,
            pages: totalPages,
          }}
          onPageChange={handlePageChange}
        />
      </div>
    </AdminOnly>
  );
}

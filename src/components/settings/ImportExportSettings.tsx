"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";

import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { trpc } from "@/lib/trpc/client";

export function ImportExportSettings() {
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations and queries
  const [shouldExport, setShouldExport] = useState(false);

  const {
    data: exportData,
    isLoading: isExporting,
    error: exportError,
  } = trpc.importExport.exportTasks.useQuery(
    { includeCompleted },
    {
      enabled: shouldExport,
    }
  );

  // Handle export data when it's available
  useEffect(() => {
    if (exportData && shouldExport) {
      // Create a blob from the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fluid-calendar-tasks-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Tasks exported successfully");
      setShouldExport(false);
    }
  }, [exportData, shouldExport]);

  // Handle export error
  useEffect(() => {
    if (exportError && shouldExport) {
      console.error("Export error:", exportError);
      toast.error("Failed to export tasks");
      setShouldExport(false);
    }
  }, [exportError, shouldExport]);

  const importTasksMutation = trpc.importExport.importTasks.useMutation({
    onSuccess: (result) => {
      toast.success(`Import successful: ${result.imported} tasks imported`);
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      console.error("Import processing error:", error);
      toast.error(`Import failed: ${error.message || "Unknown error"}`);
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const handleExport = async () => {
    setShouldExport(true);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      // Read the file
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          // Send the data to the import API via tRPC
          // The data should already be in the correct format from export
          importTasksMutation.mutate(data);
        } catch (error) {
          console.error("Import processing error:", error);
          toast.error(
            `Import failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setIsImporting(false);
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read the file");
        setIsImporting(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import tasks");
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import/Export Tasks</CardTitle>
          <CardDescription>
            Export your tasks to a file or import tasks from a file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCompleted"
                checked={includeCompleted}
                onCheckedChange={(checked) =>
                  setIncludeCompleted(checked as boolean)
                }
              />
              <Label htmlFor="includeCompleted">Include completed tasks</Label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export Tasks
              </Button>

              <Button
                onClick={handleImportClick}
                disabled={isImporting || importTasksMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isImporting || importTasksMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import Tasks
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Export:</strong> Creates a JSON file containing all your
              tasks, projects, and tags.
            </p>
            <p>
              <strong>Import:</strong> Imports tasks, projects, and tags from a
              JSON file. Tasks will be associated with your account.
            </p>
            <p className="text-yellow-600 dark:text-yellow-400">
              Note: Importing will not delete or modify your existing tasks, but
              may create duplicates if tasks with similar titles exist.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

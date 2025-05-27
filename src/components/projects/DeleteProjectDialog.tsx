"use client";

import { useState } from "react";

import * as Dialog from "@radix-ui/react-dialog";
import { IoClose } from "react-icons/io5";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";

import { Project } from "@/types/project";

const LOG_SOURCE = "DeleteProjectDialog";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  taskCount: number;
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  project,
  taskCount,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // tRPC mutation for deleting project
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      onClose();
      project.onClose?.();
    },
    onError: (error) => {
      logger.error(
        "Failed to delete project",
        {
          error: error.message,
          projectId: project.id,
          projectName: project.name,
        },
        LOG_SOURCE
      );
      toast.error("Failed to delete project", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProjectMutation.mutateAsync({ id: project.id });
    } catch (error) {
      // Error handling is done in the mutation onError callback
      logger.error(
        "Error in project deletion",
        {
          error: error instanceof Error ? error.message : String(error),
          projectId: project.id,
        },
        LOG_SOURCE
      );
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-[50%] top-[50%] z-[61] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
          <Dialog.Title className="m-0 text-[17px] font-medium">
            Delete Project
          </Dialog.Title>
          <Dialog.Description className="mb-5 mt-4 text-[15px] leading-normal">
            <p className="mb-3">
              Are you sure you want to delete <strong>{project.name}</strong>?
            </p>
            <p className="mb-3 font-bold text-red-600">
              ⚠️ This action cannot be undone. The project will be permanently
              deleted.
            </p>
            {taskCount > 0 && (
              <p className="text-red-600">
                This will also delete {taskCount} task
                {taskCount === 1 ? "" : "s"} associated with this project.
              </p>
            )}
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-4">
            <button
              className="inline-flex h-[35px] items-center justify-center rounded-[4px] bg-gray-200 px-[15px] text-[15px] leading-none outline-none hover:bg-gray-300 focus:shadow-[0_0_0_2px] focus:shadow-black"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-[35px] items-center justify-center rounded-[4px] bg-red-600 px-[15px] text-[15px] leading-none text-white outline-none hover:bg-red-700 focus:shadow-[0_0_0_2px] focus:shadow-red-700 disabled:opacity-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-[10px] top-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full hover:bg-gray-100 focus:shadow-[0_0_0_2px] focus:shadow-black"
              aria-label="Close"
              disabled={isDeleting}
            >
              <IoClose />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

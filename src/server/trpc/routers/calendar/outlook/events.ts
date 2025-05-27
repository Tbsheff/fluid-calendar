/**
 * Outlook Calendar Events tRPC router
 */
import { TRPCError } from "@trpc/server";

import {
  CalendarError,
  createOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
  updateOutlookCalendarEvent,
} from "@/lib/api/calendar";
import { logger } from "@/lib/logger";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import {
  CreateOutlookEventInputSchema,
  DeleteOutlookEventInputSchema,
  UpdateOutlookEventInputSchema,
} from "./schemas";

const LOG_SOURCE = "OutlookEventsTRPC";

/**
 * Helper function to convert calendar errors to tRPC errors
 */
function handleCalendarError(error: unknown, operation: string): never {
  logger.error(
    `Outlook Events ${operation} failed`,
    { error: error instanceof Error ? error.message : "Unknown error" },
    LOG_SOURCE
  );

  if (error instanceof CalendarError) {
    const code =
      error.statusCode === 404
        ? "NOT_FOUND"
        : error.statusCode === 403
          ? "FORBIDDEN"
          : error.statusCode === 400
            ? "BAD_REQUEST"
            : "INTERNAL_SERVER_ERROR";

    throw new TRPCError({
      code,
      message: error.message,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message:
      error instanceof Error ? error.message : "An unexpected error occurred",
  });
}

export const outlookEventsRouter = createTRPCRouter({
  /**
   * Create a new Outlook Calendar event
   */
  create: protectedProcedure
    .input(CreateOutlookEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Creating Outlook calendar event via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await createOutlookCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "create");
      }
    }),

  /**
   * Update an Outlook Calendar event
   */
  update: protectedProcedure
    .input(UpdateOutlookEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Updating Outlook calendar event via tRPC",
          { eventId: input.eventId, feedId: input.feedId },
          LOG_SOURCE
        );
        return await updateOutlookCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "update");
      }
    }),

  /**
   * Delete an Outlook Calendar event
   */
  delete: protectedProcedure
    .input(DeleteOutlookEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Deleting Outlook calendar event via tRPC",
          { eventId: input.eventId, feedId: input.feedId },
          LOG_SOURCE
        );
        return await deleteOutlookCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "delete");
      }
    }),
});

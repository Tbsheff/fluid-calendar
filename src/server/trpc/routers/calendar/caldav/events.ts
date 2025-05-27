/**
 * CalDAV Calendar Events tRPC router
 */
import { TRPCError } from "@trpc/server";

import {
  CalendarError,
  createCalDAVCalendarEvent,
  deleteCalDAVCalendarEvent,
  updateCalDAVCalendarEvent,
} from "@/lib/api/calendar";
import { logger } from "@/lib/logger";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import {
  CreateCalDAVEventInputSchema,
  DeleteCalDAVEventInputSchema,
  UpdateCalDAVEventInputSchema,
} from "./schemas";

const LOG_SOURCE = "CalDAVEventsTRPC";

/**
 * Helper function to convert calendar errors to tRPC errors
 */
function handleCalendarError(error: unknown, operation: string): never {
  logger.error(
    `CalDAV Events ${operation} failed`,
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

export const caldavEventsRouter = createTRPCRouter({
  /**
   * Create a new CalDAV Calendar event
   */
  create: protectedProcedure
    .input(CreateCalDAVEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Creating CalDAV calendar event via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await createCalDAVCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "create");
      }
    }),

  /**
   * Update a CalDAV Calendar event
   */
  update: protectedProcedure
    .input(UpdateCalDAVEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Updating CalDAV calendar event via tRPC",
          { eventId: input.eventId, feedId: input.feedId },
          LOG_SOURCE
        );
        return await updateCalDAVCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "update");
      }
    }),

  /**
   * Delete a CalDAV Calendar event
   */
  delete: protectedProcedure
    .input(DeleteCalDAVEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Deleting CalDAV calendar event via tRPC",
          { eventId: input.eventId, feedId: input.feedId },
          LOG_SOURCE
        );
        return await deleteCalDAVCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "delete");
      }
    }),
});

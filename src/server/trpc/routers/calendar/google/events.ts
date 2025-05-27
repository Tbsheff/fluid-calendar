/**
 * Google Calendar Events tRPC router
 */
import { TRPCError } from "@trpc/server";

import {
  CalendarAuthError,
  CalendarError,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "@/lib/api/calendar";
import { logger } from "@/lib/logger";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import {
  CreateGoogleEventInputSchema,
  DeleteGoogleEventInputSchema,
  UpdateGoogleEventInputSchema,
} from "./schemas";

const LOG_SOURCE = "GoogleEventsTRPC";

/**
 * Helper function to convert calendar errors to tRPC errors
 */
function handleCalendarError(error: unknown, operation: string): never {
  logger.error(
    `Google Events ${operation} failed`,
    { error: error instanceof Error ? error.message : "Unknown error" },
    LOG_SOURCE
  );

  if (error instanceof CalendarAuthError) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: error.message,
    });
  }

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

export const googleEventsRouter = createTRPCRouter({
  /**
   * Create a new Google Calendar event
   */
  create: protectedProcedure
    .input(CreateGoogleEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Creating Google calendar event via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await createGoogleCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "create");
      }
    }),

  /**
   * Update a Google Calendar event
   */
  update: protectedProcedure
    .input(UpdateGoogleEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Updating Google calendar event via tRPC",
          { eventId: input.eventId, feedId: input.feedId },
          LOG_SOURCE
        );
        return await updateGoogleCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "update");
      }
    }),

  /**
   * Delete a Google Calendar event
   */
  delete: protectedProcedure
    .input(DeleteGoogleEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Deleting Google calendar event via tRPC",
          { eventId: input.eventId, feedId: input.feedId },
          LOG_SOURCE
        );
        return await deleteGoogleCalendarEvent({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "delete");
      }
    }),
});

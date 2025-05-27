/**
 * Google Calendar tRPC router
 */
import { TRPCError } from "@trpc/server";

import {
  CalendarAuthError,
  CalendarError,
  addGoogleCalendar,
  deleteGoogleCalendarFeed,
  getAvailableGoogleCalendars,
  getGoogleAuthUrl,
  syncGoogleCalendars,
  updateGoogleCalendarFeed,
} from "@/lib/api/calendar";
import { logger } from "@/lib/logger";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";
import {
  AddGoogleCalendarInputSchema,
  DeleteGoogleCalendarFeedInputSchema,
  GetAvailableGoogleCalendarsInputSchema,
  GetGoogleAuthUrlInputSchema,
  SyncGoogleCalendarsInputSchema,
  UpdateGoogleCalendarFeedInputSchema,
} from "./schemas";

const LOG_SOURCE = "GoogleCalendarTRPC";

/**
 * Helper function to convert calendar errors to tRPC errors
 */
function handleCalendarError(error: unknown, operation: string): never {
  logger.error(
    `Google Calendar ${operation} failed`,
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

export const googleCalendarRouter = createTRPCRouter({
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl: publicProcedure
    .input(GetGoogleAuthUrlInputSchema)
    .query(async () => {
      try {
        logger.info("Getting Google OAuth URL via tRPC", {}, LOG_SOURCE);
        return await getGoogleAuthUrl({ userId: "temp" }); // userId not needed for OAuth URL
      } catch (error) {
        handleCalendarError(error, "getAuthUrl");
      }
    }),

  /**
   * Get available Google calendars for an account
   */
  getAvailableCalendars: protectedProcedure
    .input(GetAvailableGoogleCalendarsInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        logger.info(
          "Getting available Google calendars via tRPC",
          { accountId: input.accountId },
          LOG_SOURCE
        );
        return await getAvailableGoogleCalendars({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "getAvailableCalendars");
      }
    }),

  /**
   * Add a Google calendar to sync
   */
  addCalendar: protectedProcedure
    .input(AddGoogleCalendarInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Adding Google calendar via tRPC",
          { accountId: input.accountId, calendarId: input.calendarId },
          LOG_SOURCE
        );
        return await addGoogleCalendar({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "addCalendar");
      }
    }),

  /**
   * Sync Google calendars
   */
  syncCalendars: protectedProcedure
    .input(SyncGoogleCalendarsInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Syncing Google calendars via tRPC",
          { accountId: input.accountId },
          LOG_SOURCE
        );
        return await syncGoogleCalendars({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "syncCalendars");
      }
    }),

  /**
   * Update Google calendar feed settings
   */
  updateFeed: protectedProcedure
    .input(UpdateGoogleCalendarFeedInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Updating Google calendar feed via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await updateGoogleCalendarFeed({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "updateFeed");
      }
    }),

  /**
   * Delete Google calendar feed
   */
  deleteFeed: protectedProcedure
    .input(DeleteGoogleCalendarFeedInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Deleting Google calendar feed via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await deleteGoogleCalendarFeed({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "deleteFeed");
      }
    }),
});

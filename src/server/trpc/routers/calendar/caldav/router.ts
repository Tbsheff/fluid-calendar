/**
 * CalDAV Calendar tRPC router
 */
import { TRPCError } from "@trpc/server";

import {
  CalendarAuthError,
  CalendarError,
  addCalDAVCalendar,
  authenticateCalDAV,
  deleteCalDAVCalendarFeed,
  getAvailableCalDAVCalendars,
  syncCalDAVCalendars,
  testCalDAVConnection,
  updateCalDAVCalendarFeed,
} from "@/lib/api/calendar";
import { logger } from "@/lib/logger";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";
import {
  AddCalDAVCalendarInputSchema,
  AuthenticateCalDAVInputSchema,
  DeleteCalDAVCalendarFeedInputSchema,
  GetAvailableCalDAVCalendarsInputSchema,
  SyncCalDAVCalendarsInputSchema,
  TestCalDAVConnectionInputSchema,
  UpdateCalDAVCalendarFeedInputSchema,
} from "./schemas";

const LOG_SOURCE = "CalDAVCalendarTRPC";

/**
 * Helper function to convert calendar errors to tRPC errors
 */
function handleCalendarError(error: unknown, operation: string): never {
  logger.error(
    `CalDAV Calendar ${operation} failed`,
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

export const caldavCalendarRouter = createTRPCRouter({
  /**
   * Authenticate and add a CalDAV account
   */
  authenticate: protectedProcedure
    .input(AuthenticateCalDAVInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Authenticating CalDAV account via tRPC",
          { serverUrl: input.serverUrl, username: input.username },
          LOG_SOURCE
        );
        return await authenticateCalDAV({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "authenticate");
      }
    }),

  /**
   * Test CalDAV connection without saving
   */
  testConnection: publicProcedure
    .input(TestCalDAVConnectionInputSchema)
    .query(async ({ input }) => {
      try {
        logger.info(
          "Testing CalDAV connection via tRPC",
          { serverUrl: input.serverUrl, username: input.username },
          LOG_SOURCE
        );
        return await testCalDAVConnection({
          ...input,
          userId: "temp", // Not needed for test connection
        });
      } catch (error) {
        handleCalendarError(error, "testConnection");
      }
    }),

  /**
   * Get available CalDAV calendars for an account
   */
  getAvailableCalendars: protectedProcedure
    .input(GetAvailableCalDAVCalendarsInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        logger.info(
          "Getting available CalDAV calendars via tRPC",
          { accountId: input.accountId },
          LOG_SOURCE
        );
        return await getAvailableCalDAVCalendars({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "getAvailableCalendars");
      }
    }),

  /**
   * Add a CalDAV calendar to sync
   */
  addCalendar: protectedProcedure
    .input(AddCalDAVCalendarInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Adding CalDAV calendar via tRPC",
          { accountId: input.accountId, calendarId: input.calendarId },
          LOG_SOURCE
        );
        return await addCalDAVCalendar({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "addCalendar");
      }
    }),

  /**
   * Sync CalDAV calendars
   */
  syncCalendars: protectedProcedure
    .input(SyncCalDAVCalendarsInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Syncing CalDAV calendars via tRPC",
          { accountId: input.accountId },
          LOG_SOURCE
        );
        return await syncCalDAVCalendars({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "syncCalendars");
      }
    }),

  /**
   * Update CalDAV calendar feed settings
   */
  updateFeed: protectedProcedure
    .input(UpdateCalDAVCalendarFeedInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Updating CalDAV calendar feed via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await updateCalDAVCalendarFeed({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "updateFeed");
      }
    }),

  /**
   * Delete CalDAV calendar feed
   */
  deleteFeed: protectedProcedure
    .input(DeleteCalDAVCalendarFeedInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Deleting CalDAV calendar feed via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await deleteCalDAVCalendarFeed({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "deleteFeed");
      }
    }),
});

/**
 * Outlook Calendar tRPC router
 */
import { TRPCError } from "@trpc/server";

import {
  CalendarAuthError,
  CalendarError,
  addOutlookCalendar,
  deleteOutlookCalendarFeed,
  getAvailableOutlookCalendars,
  getOutlookAuthUrl,
  syncOutlookCalendars,
  updateOutlookCalendarFeed,
} from "@/lib/api/calendar";
import { logger } from "@/lib/logger";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";
import {
  AddOutlookCalendarInputSchema,
  DeleteOutlookCalendarFeedInputSchema,
  GetAvailableOutlookCalendarsInputSchema,
  GetOutlookAuthUrlInputSchema,
  SyncOutlookCalendarsInputSchema,
  UpdateOutlookCalendarFeedInputSchema,
} from "./schemas";

const LOG_SOURCE = "OutlookCalendarTRPC";

/**
 * Helper function to convert calendar errors to tRPC errors
 */
function handleCalendarError(error: unknown, operation: string): never {
  logger.error(
    `Outlook Calendar ${operation} failed`,
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

export const outlookCalendarRouter = createTRPCRouter({
  /**
   * Get Outlook OAuth authorization URL
   */
  getAuthUrl: publicProcedure
    .input(GetOutlookAuthUrlInputSchema)
    .query(async () => {
      try {
        logger.info("Getting Outlook OAuth URL via tRPC", {}, LOG_SOURCE);
        return await getOutlookAuthUrl({ userId: "temp" }); // userId not needed for OAuth URL
      } catch (error) {
        handleCalendarError(error, "getAuthUrl");
      }
    }),

  /**
   * Get available Outlook calendars for an account
   */
  getAvailableCalendars: protectedProcedure
    .input(GetAvailableOutlookCalendarsInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        logger.info(
          "Getting available Outlook calendars via tRPC",
          { accountId: input.accountId },
          LOG_SOURCE
        );
        return await getAvailableOutlookCalendars({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "getAvailableCalendars");
      }
    }),

  /**
   * Add an Outlook calendar to sync
   */
  addCalendar: protectedProcedure
    .input(AddOutlookCalendarInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Adding Outlook calendar via tRPC",
          { accountId: input.accountId, calendarId: input.calendarId },
          LOG_SOURCE
        );
        return await addOutlookCalendar({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "addCalendar");
      }
    }),

  /**
   * Sync Outlook calendars
   */
  syncCalendars: protectedProcedure
    .input(SyncOutlookCalendarsInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Syncing Outlook calendars via tRPC",
          { accountId: input.accountId },
          LOG_SOURCE
        );
        return await syncOutlookCalendars({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "syncCalendars");
      }
    }),

  /**
   * Update Outlook calendar feed settings
   */
  updateFeed: protectedProcedure
    .input(UpdateOutlookCalendarFeedInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Updating Outlook calendar feed via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await updateOutlookCalendarFeed({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "updateFeed");
      }
    }),

  /**
   * Delete Outlook calendar feed
   */
  deleteFeed: protectedProcedure
    .input(DeleteOutlookCalendarFeedInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info(
          "Deleting Outlook calendar feed via tRPC",
          { feedId: input.feedId },
          LOG_SOURCE
        );
        return await deleteOutlookCalendarFeed({
          ...input,
          userId: ctx.userId,
        });
      } catch (error) {
        handleCalendarError(error, "deleteFeed");
      }
    }),
});

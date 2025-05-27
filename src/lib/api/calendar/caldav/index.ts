/**
 * CalDAV Calendar business logic functions
 */
import { v4 as uuidv4 } from "uuid";

import { CalDAVCalendarService } from "@/lib/caldav-calendar";
import { newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// Import CalDAV utilities
import {
  createCalDAVClient,
  fetchCalDAVCalendars,
  formatAbsoluteUrl,
  handleFastmailPath,
  loginToCalDAVServer,
} from "../../../../app/api/calendar/caldav/utils";
import type { AvailableCalendar, CalendarSyncResult } from "../shared/schemas";
import {
  CalendarAuthError,
  CalendarError,
  CalendarSyncError,
} from "../shared/types";
import {
  type AddCalDAVCalendarInput,
  AddCalDAVCalendarInputSchema,
  type AuthenticateCalDAVInput,
  AuthenticateCalDAVInputSchema,
  type DeleteCalDAVCalendarFeedInput,
  DeleteCalDAVCalendarFeedInputSchema,
  type GetAvailableCalDAVCalendarsInput,
  GetAvailableCalDAVCalendarsInputSchema,
  type SyncCalDAVCalendarsInput,
  SyncCalDAVCalendarsInputSchema,
  type TestCalDAVConnectionInput,
  TestCalDAVConnectionInputSchema,
  type UpdateCalDAVCalendarFeedInput,
  UpdateCalDAVCalendarFeedInputSchema,
} from "./schemas";

const LOG_SOURCE = "CalDAVCalendarAPI";

/**
 * Authenticate and add a CalDAV account
 */
export async function authenticateCalDAV(
  input: AuthenticateCalDAVInput
): Promise<{ success: boolean; accountId: string }> {
  const { serverUrl, username, password, path, userId } =
    AuthenticateCalDAVInputSchema.parse(input);

  logger.info(
    "Authenticating CalDAV account",
    { serverUrl, username },
    LOG_SOURCE
  );

  try {
    // Create a DAVClient instance
    const client = createCalDAVClient(serverUrl, username, password);

    // Try to login to verify credentials
    try {
      await loginToCalDAVServer(client, serverUrl, username);
    } catch (loginError) {
      logger.error(
        "Failed to login to CalDAV server",
        {
          error:
            loginError instanceof Error ? loginError.message : "Unknown error",
          serverUrl,
          username,
        },
        LOG_SOURCE
      );
      throw new CalendarAuthError(
        "Failed to authenticate with CalDAV server. Please check your credentials.",
        "CALDAV"
      );
    }

    // Handle Fastmail-specific path formatting
    const caldavPath = handleFastmailPath(serverUrl, path, username);

    // If path is provided, try to fetch calendars to verify the path
    if (caldavPath) {
      try {
        logger.info(
          "Verifying CalDAV path",
          { caldavPath, fullUrl: formatAbsoluteUrl(serverUrl, caldavPath) },
          LOG_SOURCE
        );

        await fetchCalDAVCalendars(client);
      } catch (pathError) {
        logger.error(
          "Failed to validate CalDAV path",
          {
            error:
              pathError instanceof Error ? pathError.message : "Unknown error",
            caldavPath,
            serverUrl,
            username,
          },
          LOG_SOURCE
        );
        throw new CalendarError(
          "Failed to validate the CalDAV path. Please check the path and try again.",
          "CALDAV",
          "INVALID_PATH",
          400
        );
      }
    }

    // Successfully connected, add the account to the database
    const fullUrl = caldavPath
      ? formatAbsoluteUrl(serverUrl, caldavPath)
      : serverUrl;

    const account = await prisma.connectedAccount.create({
      data: {
        provider: "CALDAV",
        email: username,
        caldavUrl: fullUrl,
        caldavUsername: username,
        accessToken: password, // Store password as access token
        userId,
        expiresAt: newDate(Date.now() + 365 * 24 * 60 * 60 * 1000), // Set expiry to 1 year from now
      },
    });

    logger.info(
      "Successfully added CalDAV account",
      { accountId: account.id, username },
      LOG_SOURCE
    );

    return { success: true, accountId: account.id };
  } catch (error) {
    logger.error(
      "Failed to authenticate CalDAV account",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        serverUrl,
        username,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarAuthError("Failed to connect to CalDAV server", "CALDAV");
  }
}

/**
 * Test CalDAV connection without saving
 */
export async function testCalDAVConnection(
  input: TestCalDAVConnectionInput
): Promise<{
  success: boolean;
  calendars?: AvailableCalendar[];
  error?: string;
}> {
  const { serverUrl, username, password, path } =
    TestCalDAVConnectionInputSchema.parse(input);

  logger.info("Testing CalDAV connection", { serverUrl, username }, LOG_SOURCE);

  try {
    // Create a DAVClient instance
    const client = createCalDAVClient(serverUrl, username, password);

    // Try to login to verify credentials
    try {
      await loginToCalDAVServer(client, serverUrl, username);
    } catch (loginError) {
      logger.error(
        "Failed to login to CalDAV server during test",
        {
          error:
            loginError instanceof Error ? loginError.message : "Unknown error",
          serverUrl,
          username,
        },
        LOG_SOURCE
      );
      return {
        success: false,
        error:
          "Failed to authenticate with CalDAV server. Please check your credentials.",
      };
    }

    // Handle Fastmail-specific path formatting
    const caldavPath = handleFastmailPath(serverUrl, path, username);

    // Try to fetch calendars
    let calendars: Awaited<ReturnType<typeof fetchCalDAVCalendars>> = [];
    if (caldavPath) {
      try {
        logger.info(
          "Testing CalDAV path",
          { caldavPath, fullUrl: formatAbsoluteUrl(serverUrl, caldavPath) },
          LOG_SOURCE
        );

        calendars = await fetchCalDAVCalendars(client);
      } catch (pathError) {
        logger.error(
          "Failed to validate CalDAV path during test",
          {
            error:
              pathError instanceof Error ? pathError.message : "Unknown error",
            caldavPath,
            serverUrl,
            username,
          },
          LOG_SOURCE
        );
        return {
          success: false,
          error:
            "Failed to validate the CalDAV path. Please check the path and try again.",
        };
      }
    } else {
      // If no path is provided, try to discover calendars
      try {
        logger.info(
          "No path provided, attempting to discover calendars",
          { serverUrl, username },
          LOG_SOURCE
        );

        calendars = await fetchCalDAVCalendars(client);
      } catch (discoverError) {
        logger.error(
          "Failed to discover calendars during test",
          {
            error:
              discoverError instanceof Error
                ? discoverError.message
                : "Unknown error",
            serverUrl,
            username,
          },
          LOG_SOURCE
        );
        // Still return success if login worked
        return {
          success: true,
          calendars: [],
        };
      }
    }

    // Format the calendars for the response
    const formattedCalendars: AvailableCalendar[] = calendars.map((cal) => ({
      id: cal.url,
      name:
        typeof cal.displayName === "string"
          ? cal.displayName
          : "Unnamed Calendar",
      description:
        typeof cal.description === "string" ? cal.description : undefined,
      color:
        typeof cal.calendarColor === "string" ? cal.calendarColor : "#4285F4",
      isPrimary: undefined,
      accessRole: "owner", // CalDAV calendars are typically owned by the user
    }));

    logger.info(
      "CalDAV connection test successful",
      { serverUrl, username, calendarsCount: formattedCalendars.length },
      LOG_SOURCE
    );

    return {
      success: true,
      calendars: formattedCalendars,
    };
  } catch (error) {
    logger.error(
      "CalDAV connection test failed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        serverUrl,
        username,
      },
      LOG_SOURCE
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get available CalDAV calendars for an account
 */
export async function getAvailableCalDAVCalendars(
  input: GetAvailableCalDAVCalendarsInput
): Promise<AvailableCalendar[]> {
  const { accountId, userId } =
    GetAvailableCalDAVCalendarsInputSchema.parse(input);

  logger.info("Getting available CalDAV calendars", { accountId }, LOG_SOURCE);

  try {
    // Check if account belongs to the current user
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
        userId,
      },
      include: {
        calendars: true,
      },
    });

    if (!account) {
      throw new CalendarError("Account not found", "CALDAV", "NOT_FOUND", 404);
    }

    if (account.provider !== "CALDAV") {
      throw new CalendarError("Invalid account type", "CALDAV", "INVALID", 400);
    }

    // Ensure we have the required CalDAV fields
    if (!account.caldavUrl || !account.caldavUsername || !account.accessToken) {
      throw new CalendarError(
        "Account is missing required CalDAV fields",
        "CALDAV",
        "INVALID",
        400
      );
    }

    // Create a DAVClient instance
    const client = createCalDAVClient(
      account.caldavUrl,
      account.caldavUsername,
      account.accessToken
    );

    // Login to the CalDAV server
    try {
      await loginToCalDAVServer(
        client,
        account.caldavUrl,
        account.caldavUsername
      );
    } catch (loginError) {
      logger.error(
        "Failed to login to CalDAV server",
        {
          error:
            loginError instanceof Error ? loginError.message : "Unknown error",
          accountId,
        },
        LOG_SOURCE
      );
      throw new CalendarAuthError(
        "Failed to authenticate with CalDAV server",
        "CALDAV"
      );
    }

    // Fetch available calendars
    const calendars = await fetchCalDAVCalendars(client);

    // Transform calendars to match the expected format
    const availableCalendars: AvailableCalendar[] = calendars
      .map((calendar) => ({
        id: calendar.url,
        name:
          typeof calendar.displayName === "string"
            ? calendar.displayName
            : "Unnamed Calendar",
        description:
          typeof calendar.description === "string"
            ? calendar.description
            : undefined,
        color:
          typeof calendar.calendarColor === "string"
            ? calendar.calendarColor
            : "#4285F4",
        isPrimary: undefined,
        accessRole: "owner" as const,
      }))
      .filter((cal) => {
        // Only include calendars that are not already connected
        return !account.calendars.some((f) => f.url === cal.id);
      });

    logger.info(
      "Retrieved available CalDAV calendars",
      { accountId, count: availableCalendars.length },
      LOG_SOURCE
    );

    return availableCalendars;
  } catch (error) {
    logger.error(
      "Failed to get available CalDAV calendars",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to get available calendars", "CALDAV");
  }
}

/**
 * Add a CalDAV calendar to sync
 */
export async function addCalDAVCalendar(
  input: AddCalDAVCalendarInput
): Promise<{ success: boolean; feedId?: string }> {
  const { accountId, calendarId, name, color, userId } =
    AddCalDAVCalendarInputSchema.parse(input);

  logger.info("Adding CalDAV calendar", { accountId, calendarId }, LOG_SOURCE);

  try {
    // Check if account belongs to the current user
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new CalendarError("Account not found", "CALDAV", "NOT_FOUND", 404);
    }

    if (account.provider !== "CALDAV") {
      throw new CalendarError("Invalid account type", "CALDAV", "INVALID", 400);
    }

    // Check if calendar already exists
    const existingFeed = await prisma.calendarFeed.findFirst({
      where: {
        type: "CALDAV",
        url: calendarId,
        accountId,
        userId,
      },
    });

    if (existingFeed) {
      logger.info(
        "CalDAV calendar already exists",
        { feedId: existingFeed.id },
        LOG_SOURCE
      );
      return { success: true, feedId: existingFeed.id };
    }

    // Create calendar feed
    const feed = await prisma.calendarFeed.create({
      data: {
        id: uuidv4(),
        name,
        type: "CALDAV",
        url: calendarId,
        color: color || "#4285F4",
        enabled: true,
        accountId,
        userId,
      },
    });

    // Perform initial sync
    try {
      const caldavService = new CalDAVCalendarService(account);
      await caldavService.syncCalendar(feed.id, calendarId, userId);

      // Update the last sync time
      await prisma.calendarFeed.update({
        where: { id: feed.id },
        data: { lastSync: newDate() },
      });
    } catch (syncError) {
      logger.error(
        "Failed to perform initial sync of CalDAV calendar",
        {
          error:
            syncError instanceof Error ? syncError.message : "Unknown error",
          feedId: feed.id,
          calendarId,
        },
        LOG_SOURCE
      );
      // Don't throw error here, as we've already created the feed
    }

    logger.info(
      "CalDAV calendar added successfully",
      { feedId: feed.id },
      LOG_SOURCE
    );

    return { success: true, feedId: feed.id };
  } catch (error) {
    logger.error(
      "Failed to add CalDAV calendar",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
        calendarId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to add calendar", "CALDAV");
  }
}

/**
 * Sync CalDAV calendars
 */
export async function syncCalDAVCalendars(
  input: SyncCalDAVCalendarsInput
): Promise<CalendarSyncResult> {
  const { accountId, feedIds, userId } =
    SyncCalDAVCalendarsInputSchema.parse(input);

  logger.info(
    "Syncing CalDAV calendars",
    { accountId, feedIds: feedIds || [] },
    LOG_SOURCE
  );

  try {
    // Get feeds to sync
    const feeds = await prisma.calendarFeed.findMany({
      where: {
        accountId,
        userId,
        type: "CALDAV",
        ...(feedIds && { id: { in: feedIds } }),
      },
    });

    if (feeds.length === 0) {
      logger.info(
        "No CalDAV calendar feeds found to sync",
        { accountId },
        LOG_SOURCE
      );
      return {
        success: true,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
      };
    }

    // Get the account
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new CalendarError("Account not found", "CALDAV", "NOT_FOUND", 404);
    }

    const caldavService = new CalDAVCalendarService(account);
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        if (!feed.url) {
          throw new Error("Feed URL is missing");
        }

        const syncResult = await caldavService.syncCalendar(
          feed.id,
          feed.url,
          userId
        );

        // Update sync time
        await prisma.calendarFeed.update({
          where: { id: feed.id },
          data: { lastSync: newDate() },
        });

        // Accumulate results
        totalCreated += syncResult.added.length;
        totalUpdated += syncResult.updated.length;
        totalDeleted += syncResult.deleted.length;
      } catch (error) {
        const errorMessage = `Failed to sync feed ${feed.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        logger.error(
          "Failed to sync CalDAV calendar feed",
          { feedId: feed.id, error: errorMessage },
          LOG_SOURCE
        );
      }
    }

    const result: CalendarSyncResult = {
      success: errors.length === 0,
      eventsCreated: totalCreated,
      eventsUpdated: totalUpdated,
      eventsDeleted: totalDeleted,
      ...(errors.length > 0 && { errors }),
    };

    logger.info("CalDAV calendars sync completed", result, LOG_SOURCE);

    return result;
  } catch (error) {
    logger.error(
      "Failed to sync CalDAV calendars",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
      },
      LOG_SOURCE
    );
    throw new CalendarSyncError("Failed to sync calendars", "CALDAV");
  }
}

/**
 * Update CalDAV calendar feed settings
 */
export async function updateCalDAVCalendarFeed(
  input: UpdateCalDAVCalendarFeedInput
): Promise<{ success: boolean }> {
  const { feedId, name, color, isEnabled, userId } =
    UpdateCalDAVCalendarFeedInputSchema.parse(input);

  logger.info("Updating CalDAV calendar feed", { feedId }, LOG_SOURCE);

  try {
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
        type: "CALDAV",
      },
    });

    if (!feed) {
      throw new CalendarError(
        "Calendar feed not found",
        "CALDAV",
        "NOT_FOUND",
        404
      );
    }

    await prisma.calendarFeed.update({
      where: { id: feedId },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
        ...(isEnabled !== undefined && { enabled: isEnabled }),
      },
    });

    logger.info(
      "CalDAV calendar feed updated successfully",
      { feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to update CalDAV calendar feed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to update calendar feed", "CALDAV");
  }
}

/**
 * Delete CalDAV calendar feed
 */
export async function deleteCalDAVCalendarFeed(
  input: DeleteCalDAVCalendarFeedInput
): Promise<{ success: boolean }> {
  const { feedId, userId } = DeleteCalDAVCalendarFeedInputSchema.parse(input);

  logger.info("Deleting CalDAV calendar feed", { feedId }, LOG_SOURCE);

  try {
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
        type: "CALDAV",
      },
    });

    if (!feed) {
      throw new CalendarError(
        "Calendar feed not found",
        "CALDAV",
        "NOT_FOUND",
        404
      );
    }

    // Delete all events associated with this feed
    await prisma.calendarEvent.deleteMany({
      where: { feedId },
    });

    // Delete the feed
    await prisma.calendarFeed.delete({
      where: { id: feedId },
    });

    logger.info(
      "CalDAV calendar feed deleted successfully",
      { feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete CalDAV calendar feed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to delete calendar feed", "CALDAV");
  }
}

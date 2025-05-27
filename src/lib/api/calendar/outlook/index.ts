/**
 * Outlook Calendar business logic functions
 */
import { v4 as uuidv4 } from "uuid";

import { getOutlookCredentials } from "@/lib/auth";
import { newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import {
  MICROSOFT_GRAPH_AUTH_ENDPOINTS,
  MICROSOFT_GRAPH_SCOPES,
} from "@/lib/outlook";
import {
  OutlookCalendarService,
  getOutlookClient,
} from "@/lib/outlook-calendar";
import { syncOutlookCalendar } from "@/lib/outlook-sync";
import { prisma } from "@/lib/prisma";
import { TokenManager } from "@/lib/token-manager";

import type {
  AvailableCalendar,
  CalendarSyncResult,
  OAuthCallbackResult,
  OAuthUrlResult,
} from "../shared/schemas";
import {
  CalendarAuthError,
  CalendarError,
  CalendarSyncError,
} from "../shared/types";
import {
  type AddOutlookCalendarInput,
  AddOutlookCalendarInputSchema,
  type DeleteOutlookCalendarFeedInput,
  DeleteOutlookCalendarFeedInputSchema,
  type GetAvailableOutlookCalendarsInput,
  GetAvailableOutlookCalendarsInputSchema,
  type GetOutlookAuthUrlInput,
  GetOutlookAuthUrlInputSchema,
  type OutlookOAuthCallbackInput,
  OutlookOAuthCallbackInputSchema,
  type SyncOutlookCalendarsInput,
  SyncOutlookCalendarsInputSchema,
  type UpdateOutlookCalendarFeedInput,
  UpdateOutlookCalendarFeedInputSchema,
} from "./schemas";

const LOG_SOURCE = "OutlookCalendarAPI";

/**
 * Get Outlook OAuth authorization URL
 */
export async function getOutlookAuthUrl(
  input: GetOutlookAuthUrlInput
): Promise<OAuthUrlResult> {
  GetOutlookAuthUrlInputSchema.parse(input);

  logger.info("Generating Outlook OAuth URL", {}, LOG_SOURCE);

  try {
    const { clientId } = await getOutlookCredentials();
    const redirectUrl = `${process.env.NEXTAUTH_URL}/api/calendar/outlook`;

    // Construct the authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUrl,
      scope: MICROSOFT_GRAPH_SCOPES.join(" "),
      response_mode: "query",
      prompt: "consent",
    });

    const authUrl = `${MICROSOFT_GRAPH_AUTH_ENDPOINTS.auth}?${params.toString()}`;

    logger.info("Generated Outlook OAuth URL", { authUrl }, LOG_SOURCE);

    return { authUrl };
  } catch (error) {
    logger.error(
      "Failed to generate Outlook OAuth URL",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    throw new CalendarAuthError("Failed to generate OAuth URL", "OUTLOOK");
  }
}

/**
 * Handle Outlook OAuth callback and store tokens
 */
export async function handleOutlookOAuthCallback(
  input: OutlookOAuthCallbackInput
): Promise<OAuthCallbackResult> {
  const { code, userId } = OutlookOAuthCallbackInputSchema.parse(input);

  logger.info("Handling Outlook OAuth callback", { userId }, LOG_SOURCE);

  try {
    const { clientId, clientSecret } = await getOutlookCredentials();
    const redirectUrl = `${process.env.NEXTAUTH_URL}/api/calendar/outlook`;

    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUrl,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch(MICROSOFT_GRAPH_AUTH_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      logger.error(
        "Failed to exchange code for tokens",
        { status: tokenResponse.status },
        LOG_SOURCE
      );
      throw new CalendarAuthError(
        "Failed to exchange authorization code",
        "OUTLOOK"
      );
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = newDate(Date.now() + tokenData.expires_in * 1000);

    // Create a temporary account to get user info
    const tempAccount = {
      id: "temp",
      provider: "OUTLOOK" as const,
      email: "",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      createdAt: newDate(),
      updatedAt: newDate(),
      caldavUrl: null,
      caldavUsername: null,
      userId: userId ?? null,
    };

    // Get user info
    const outlookService = new OutlookCalendarService(tempAccount);
    const userInfo = await outlookService.getUserProfile();

    if (!userInfo.mail && !userInfo.userPrincipalName) {
      throw new CalendarAuthError("Could not get user email", "OUTLOOK");
    }

    const email = userInfo.mail || userInfo.userPrincipalName || "";

    // Store tokens
    const tokenManager = TokenManager.getInstance();
    const accountId = await tokenManager.storeTokens(
      "OUTLOOK",
      email,
      {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
      userId
    );

    // Get list of calendars and store them
    const calendars = await outlookService.listCalendars();

    if (calendars) {
      for (const cal of calendars) {
        if (cal.id && cal.name) {
          // Check if calendar feed already exists
          const existingFeed = await prisma.calendarFeed.findFirst({
            where: {
              type: "OUTLOOK",
              url: cal.id,
              accountId,
              userId,
            },
          });

          // Only create if it doesn't exist
          if (!existingFeed) {
            await prisma.calendarFeed.create({
              data: {
                id: uuidv4(),
                name: cal.name,
                url: cal.id,
                type: "OUTLOOK",
                color: cal.color || "#0078d4",
                accountId,
                userId,
              },
            });
          }
        }
      }
    }

    logger.info(
      "Outlook OAuth callback handled successfully",
      { accountId },
      LOG_SOURCE
    );

    return { success: true, accountId };
  } catch (error) {
    logger.error(
      "Failed to handle Outlook OAuth callback",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    throw new CalendarAuthError(
      "Failed to authenticate with Outlook",
      "OUTLOOK"
    );
  }
}

/**
 * Get available Outlook calendars for an account
 */
export async function getAvailableOutlookCalendars(
  input: GetAvailableOutlookCalendarsInput
): Promise<AvailableCalendar[]> {
  const { accountId, userId } =
    GetAvailableOutlookCalendarsInputSchema.parse(input);

  logger.info("Getting available Outlook calendars", { accountId }, LOG_SOURCE);

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
      throw new CalendarError("Account not found", "OUTLOOK", "NOT_FOUND", 404);
    }

    if (account.provider !== "OUTLOOK") {
      throw new CalendarError(
        "Invalid account type",
        "OUTLOOK",
        "INVALID",
        400
      );
    }

    // Initialize service and fetch calendars
    const outlookService = new OutlookCalendarService(account);
    const calendars = await outlookService.listCalendars();

    // Transform calendars to match the expected format
    const availableCalendars: AvailableCalendar[] = calendars
      .map((calendar) => ({
        id: calendar.id!,
        name: calendar.name!,
        description: undefined,
        color: calendar.color || "#0078d4",
        isPrimary: undefined, // TODO: Determine primary calendar logic
        accessRole: calendar.canEdit ? "owner" : "reader",
      }))
      .filter((cal) => {
        // Only include calendars that:
        // 1. Have an ID and name
        // 2. Are not already connected
        // 3. User has write access
        return cal.id && !account.calendars.some((f) => f.url === cal.id);
      });

    logger.info(
      "Retrieved available Outlook calendars",
      { accountId, count: availableCalendars.length },
      LOG_SOURCE
    );

    return availableCalendars;
  } catch (error) {
    logger.error(
      "Failed to get available Outlook calendars",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
      },
      LOG_SOURCE
    );
    throw new CalendarError("Failed to get available calendars", "OUTLOOK");
  }
}

/**
 * Add an Outlook calendar to sync
 */
export async function addOutlookCalendar(
  input: AddOutlookCalendarInput
): Promise<{ success: boolean; feedId?: string }> {
  const { accountId, calendarId, name, color, userId } =
    AddOutlookCalendarInputSchema.parse(input);

  logger.info("Adding Outlook calendar", { accountId, calendarId }, LOG_SOURCE);

  try {
    // Check if account belongs to the current user
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new CalendarError("Account not found", "OUTLOOK", "NOT_FOUND", 404);
    }

    if (account.provider !== "OUTLOOK") {
      throw new CalendarError(
        "Invalid account type",
        "OUTLOOK",
        "INVALID",
        400
      );
    }

    // Check if calendar already exists
    const existingFeed = await prisma.calendarFeed.findFirst({
      where: {
        type: "OUTLOOK",
        url: calendarId,
        accountId,
        userId,
      },
    });

    if (existingFeed) {
      logger.info(
        "Outlook calendar already exists",
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
        type: "OUTLOOK",
        url: calendarId,
        color: color || "#0078d4",
        enabled: true,
        accountId,
        userId,
      },
    });

    // Initial sync of calendar events
    const client = await getOutlookClient(accountId, userId);
    await syncOutlookCalendar(client, { id: feed.id, url: feed.url! }, null);

    logger.info(
      "Outlook calendar added successfully",
      { feedId: feed.id },
      LOG_SOURCE
    );

    return { success: true, feedId: feed.id };
  } catch (error) {
    logger.error(
      "Failed to add Outlook calendar",
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
    throw new CalendarError("Failed to add calendar", "OUTLOOK");
  }
}

/**
 * Sync Outlook calendars
 */
export async function syncOutlookCalendars(
  input: SyncOutlookCalendarsInput
): Promise<CalendarSyncResult> {
  const { accountId, feedIds, userId } =
    SyncOutlookCalendarsInputSchema.parse(input);

  logger.info(
    "Syncing Outlook calendars",
    { accountId, feedIds: feedIds || [] },
    LOG_SOURCE
  );

  try {
    // Get feeds to sync
    const feeds = await prisma.calendarFeed.findMany({
      where: {
        accountId,
        userId,
        type: "OUTLOOK",
        ...(feedIds && { id: { in: feedIds } }),
      },
    });

    if (feeds.length === 0) {
      logger.info(
        "No Outlook calendar feeds found to sync",
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

    const client = await getOutlookClient(accountId, userId);
    const totalCreated = 0; // TODO: Implement proper counting from sync result
    let totalUpdated = 0;
    const totalDeleted = 0; // TODO: Implement proper counting from sync result
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        if (!feed.url) {
          throw new Error("Feed URL is missing");
        }

        const { processedEventIds } = await syncOutlookCalendar(
          client,
          { id: feed.id, url: feed.url },
          feed.syncToken,
          true
        );

        // Update sync time
        await prisma.calendarFeed.update({
          where: { id: feed.id },
          data: { lastSync: newDate() },
        });

        // For now, just count processed events as updated
        // TODO: Implement proper counting from sync result
        totalUpdated += processedEventIds.size;
      } catch (error) {
        const errorMessage = `Failed to sync feed ${feed.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        logger.error(
          "Failed to sync Outlook calendar feed",
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

    logger.info("Outlook calendars sync completed", result, LOG_SOURCE);

    return result;
  } catch (error) {
    logger.error(
      "Failed to sync Outlook calendars",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
      },
      LOG_SOURCE
    );
    throw new CalendarSyncError("Failed to sync calendars", "OUTLOOK");
  }
}

/**
 * Update Outlook calendar feed settings
 */
export async function updateOutlookCalendarFeed(
  input: UpdateOutlookCalendarFeedInput
): Promise<{ success: boolean }> {
  const { feedId, name, color, isEnabled, userId } =
    UpdateOutlookCalendarFeedInputSchema.parse(input);

  logger.info("Updating Outlook calendar feed", { feedId }, LOG_SOURCE);

  try {
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
        type: "OUTLOOK",
      },
    });

    if (!feed) {
      throw new CalendarError(
        "Calendar feed not found",
        "OUTLOOK",
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
      "Outlook calendar feed updated successfully",
      { feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to update Outlook calendar feed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to update calendar feed", "OUTLOOK");
  }
}

/**
 * Delete Outlook calendar feed
 */
export async function deleteOutlookCalendarFeed(
  input: DeleteOutlookCalendarFeedInput
): Promise<{ success: boolean }> {
  const { feedId, userId } = DeleteOutlookCalendarFeedInputSchema.parse(input);

  logger.info("Deleting Outlook calendar feed", { feedId }, LOG_SOURCE);

  try {
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
        type: "OUTLOOK",
      },
    });

    if (!feed) {
      throw new CalendarError(
        "Calendar feed not found",
        "OUTLOOK",
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
      "Outlook calendar feed deleted successfully",
      { feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete Outlook calendar feed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to delete calendar feed", "OUTLOOK");
  }
}

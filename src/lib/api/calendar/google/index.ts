/**
 * Google Calendar business logic functions
 */
import { calendar_v3, google } from "googleapis";
import { v4 as uuidv4 } from "uuid";

import { createAllDayDate, newDate, newDateFromYMD } from "@/lib/date-utils";
import { createGoogleOAuthClient } from "@/lib/google";
import { getGoogleCalendarClient } from "@/lib/google-calendar";
import { logger } from "@/lib/logger";
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
  type AddGoogleCalendarInput,
  AddGoogleCalendarInputSchema,
  type DeleteGoogleCalendarFeedInput,
  DeleteGoogleCalendarFeedInputSchema,
  type GetAvailableGoogleCalendarsInput,
  GetAvailableGoogleCalendarsInputSchema,
  type GetGoogleAuthUrlInput,
  GetGoogleAuthUrlInputSchema,
  type GoogleOAuthCallbackInput,
  GoogleOAuthCallbackInputSchema,
  type SyncGoogleCalendarsInput,
  SyncGoogleCalendarsInputSchema,
  type UpdateGoogleCalendarFeedInput,
  UpdateGoogleCalendarFeedInputSchema,
} from "./schemas";

const LOG_SOURCE = "GoogleCalendarAPI";

// Helper function to process recurrence rules
function processRecurrenceRule(
  recurrence: string[] | null | undefined,
  startDate?: Date
): string | undefined {
  if (!recurrence || recurrence.length === 0) return undefined;

  // Find the RRULE (should be the first one starting with RRULE:)
  const rrule = recurrence.find((r) => r.startsWith("RRULE:"));
  if (!rrule) return undefined;

  // For yearly rules, ensure both BYMONTH and BYMONTHDAY are present
  if (rrule.includes("FREQ=YEARLY") && startDate) {
    const hasMonth = rrule.includes("BYMONTH=");
    const hasMonthDay = rrule.includes("BYMONTHDAY=");

    if (!hasMonth || !hasMonthDay) {
      // Start with the base rule
      let parts = rrule.split(";");

      // Remove any existing incomplete parts we'll replace
      parts = parts.filter(
        (part) =>
          !part.startsWith("BYMONTH=") && !part.startsWith("BYMONTHDAY=")
      );

      // Add the complete month and day
      parts.push(`BYMONTH=${startDate.getMonth() + 1}`);
      parts.push(`BYMONTHDAY=${startDate.getDate()}`);

      return parts.join(";");
    }
  }

  return rrule;
}

/**
 * Get Google OAuth authorization URL
 */
export async function getGoogleAuthUrl(
  input: GetGoogleAuthUrlInput
): Promise<OAuthUrlResult> {
  GetGoogleAuthUrlInputSchema.parse(input);

  logger.info("Generating Google OAuth URL", {}, LOG_SOURCE);

  try {
    const redirectUrl = `${process.env.NEXTAUTH_URL}/api/calendar/google`;
    const oauth2Client = await createGoogleOAuthClient({ redirectUrl });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });

    logger.info("Generated Google OAuth URL", { authUrl }, LOG_SOURCE);

    return { authUrl };
  } catch (error) {
    logger.error(
      "Failed to generate Google OAuth URL",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    throw new CalendarAuthError("Failed to generate OAuth URL", "GOOGLE");
  }
}

/**
 * Handle Google OAuth callback and store tokens
 */
export async function handleGoogleOAuthCallback(
  input: GoogleOAuthCallbackInput
): Promise<OAuthCallbackResult> {
  const { code, userId } = GoogleOAuthCallbackInputSchema.parse(input);

  logger.info("Handling Google OAuth callback", { userId }, LOG_SOURCE);

  try {
    const oauth2Client = await createGoogleOAuthClient({
      redirectUrl: `${process.env.NEXTAUTH_URL}/api/calendar/google`,
    });

    // Exchange code for tokens
    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    oauth2Client.setCredentials(tokens);

    // Get user info to get email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      throw new CalendarAuthError("Could not get user email", "GOOGLE");
    }

    // Store tokens
    const tokenManager = TokenManager.getInstance();
    const accountId = await tokenManager.storeTokens(
      "GOOGLE",
      userInfo.data.email,
      {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: newDate(Date.now() + (tokens.expiry_date || 3600 * 1000)),
      },
      userId
    );

    // Get list of calendars and store them
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();

    if (calendarList.data.items) {
      for (const cal of calendarList.data.items) {
        if (cal.id && cal.summary) {
          // Check if calendar feed already exists
          const existingFeed = await prisma.calendarFeed.findFirst({
            where: {
              type: "GOOGLE",
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
                name: cal.summary,
                url: cal.id,
                type: "GOOGLE",
                color: cal.backgroundColor ?? undefined,
                accountId,
                userId,
              },
            });
          }
        }
      }
    }

    logger.info(
      "Google OAuth callback handled successfully",
      { accountId },
      LOG_SOURCE
    );

    return { success: true, accountId };
  } catch (error) {
    logger.error(
      "Failed to handle Google OAuth callback",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    throw new CalendarAuthError("Failed to authenticate with Google", "GOOGLE");
  }
}

/**
 * Get available Google calendars for an account
 */
export async function getAvailableGoogleCalendars(
  input: GetAvailableGoogleCalendarsInput
): Promise<AvailableCalendar[]> {
  const { accountId, userId } =
    GetAvailableGoogleCalendarsInputSchema.parse(input);

  logger.info("Getting available Google calendars", { accountId }, LOG_SOURCE);

  try {
    // Check if account belongs to the current user
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new CalendarError("Account not found", "GOOGLE", "NOT_FOUND", 404);
    }

    const calendar = await getGoogleCalendarClient(accountId, userId);
    const calendarList = await calendar.calendarList.list();

    const availableCalendars: AvailableCalendar[] = (
      calendarList.data.items || []
    )
      .filter((cal) => cal.id && cal.summary)
      .map((cal) => ({
        id: cal.id!,
        name: cal.summary!,
        description: cal.description || undefined,
        color: cal.backgroundColor || undefined,
        isPrimary: cal.primary || undefined,
        accessRole: cal.accessRole || undefined,
      }));

    logger.info(
      "Retrieved available Google calendars",
      { accountId, count: availableCalendars.length },
      LOG_SOURCE
    );

    return availableCalendars;
  } catch (error) {
    logger.error(
      "Failed to get available Google calendars",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
      },
      LOG_SOURCE
    );
    throw new CalendarError("Failed to get available calendars", "GOOGLE");
  }
}

/**
 * Add a Google calendar to sync
 */
export async function addGoogleCalendar(
  input: AddGoogleCalendarInput
): Promise<{ success: boolean; feedId?: string }> {
  const { accountId, calendarId, name, color, userId } =
    AddGoogleCalendarInputSchema.parse(input);

  logger.info("Adding Google calendar", { accountId, calendarId }, LOG_SOURCE);

  try {
    // Check if account belongs to the current user
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new CalendarError("Account not found", "GOOGLE", "NOT_FOUND", 404);
    }

    // Check if calendar already exists
    const existingFeed = await prisma.calendarFeed.findFirst({
      where: {
        type: "GOOGLE",
        url: calendarId,
        accountId,
        userId,
      },
    });

    if (existingFeed) {
      logger.info(
        "Google calendar already exists",
        { feedId: existingFeed.id },
        LOG_SOURCE
      );
      return { success: true, feedId: existingFeed.id };
    }

    // Create calendar client and verify access
    const calendar = await getGoogleCalendarClient(accountId, userId);

    try {
      await calendar.calendars.get({ calendarId });
    } catch (error) {
      logger.error(
        "Failed to access Google calendar",
        {
          calendarId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        LOG_SOURCE
      );
      throw new CalendarError(
        "Failed to access calendar",
        "GOOGLE",
        "ACCESS_DENIED",
        403
      );
    }

    // Create calendar feed
    const feed = await prisma.calendarFeed.create({
      data: {
        id: uuidv4(),
        name,
        url: calendarId,
        type: "GOOGLE",
        color,
        accountId,
        userId,
      },
    });

    // Initial sync of calendar events
    await syncGoogleCalendarEvents(calendar, feed.id, calendarId);

    logger.info(
      "Google calendar added successfully",
      { feedId: feed.id },
      LOG_SOURCE
    );

    return { success: true, feedId: feed.id };
  } catch (error) {
    logger.error(
      "Failed to add Google calendar",
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
    throw new CalendarError("Failed to add calendar", "GOOGLE");
  }
}

/**
 * Sync Google calendars
 */
export async function syncGoogleCalendars(
  input: SyncGoogleCalendarsInput
): Promise<CalendarSyncResult> {
  const { accountId, feedIds, userId } =
    SyncGoogleCalendarsInputSchema.parse(input);

  logger.info(
    "Syncing Google calendars",
    { accountId, feedIds: feedIds || [] },
    LOG_SOURCE
  );

  try {
    // Get feeds to sync
    const feeds = await prisma.calendarFeed.findMany({
      where: {
        accountId,
        userId,
        type: "GOOGLE",
        ...(feedIds && { id: { in: feedIds } }),
      },
    });

    if (feeds.length === 0) {
      logger.info(
        "No Google calendar feeds found to sync",
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

    const calendar = await getGoogleCalendarClient(accountId, userId);
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        const result = await syncGoogleCalendarEvents(
          calendar,
          feed.id,
          feed.url || ""
        );
        totalCreated += result.eventsCreated;
        totalUpdated += result.eventsUpdated;
        totalDeleted += result.eventsDeleted;
      } catch (error) {
        const errorMessage = `Failed to sync feed ${feed.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        logger.error(
          "Failed to sync Google calendar feed",
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

    logger.info("Google calendars sync completed", result, LOG_SOURCE);

    return result;
  } catch (error) {
    logger.error(
      "Failed to sync Google calendars",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId,
      },
      LOG_SOURCE
    );
    throw new CalendarSyncError("Failed to sync calendars", "GOOGLE");
  }
}

/**
 * Update Google calendar feed settings
 */
export async function updateGoogleCalendarFeed(
  input: UpdateGoogleCalendarFeedInput
): Promise<{ success: boolean }> {
  const { feedId, name, color, isEnabled, userId } =
    UpdateGoogleCalendarFeedInputSchema.parse(input);

  logger.info("Updating Google calendar feed", { feedId }, LOG_SOURCE);

  try {
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
        type: "GOOGLE",
      },
    });

    if (!feed) {
      throw new CalendarError(
        "Calendar feed not found",
        "GOOGLE",
        "NOT_FOUND",
        404
      );
    }

    await prisma.calendarFeed.update({
      where: { id: feedId },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
    });

    logger.info(
      "Google calendar feed updated successfully",
      { feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to update Google calendar feed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to update calendar feed", "GOOGLE");
  }
}

/**
 * Delete Google calendar feed
 */
export async function deleteGoogleCalendarFeed(
  input: DeleteGoogleCalendarFeedInput
): Promise<{ success: boolean }> {
  const { feedId, userId } = DeleteGoogleCalendarFeedInputSchema.parse(input);

  logger.info("Deleting Google calendar feed", { feedId }, LOG_SOURCE);

  try {
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
        type: "GOOGLE",
      },
    });

    if (!feed) {
      throw new CalendarError(
        "Calendar feed not found",
        "GOOGLE",
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
      "Google calendar feed deleted successfully",
      { feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete Google calendar feed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to delete calendar feed", "GOOGLE");
  }
}

/**
 * Helper function to sync events for a specific Google calendar
 */
async function syncGoogleCalendarEvents(
  calendar: calendar_v3.Calendar,
  feedId: string,
  calendarId: string
): Promise<CalendarSyncResult> {
  logger.info(
    "Syncing Google calendar events",
    { feedId, calendarId },
    LOG_SOURCE
  );

  try {
    // Get events from Google Calendar
    const eventsResponse = await calendar.events.list({
      calendarId,
      timeMin: newDateFromYMD(newDate().getFullYear(), 0, 1).toISOString(),
      timeMax: newDateFromYMD(newDate().getFullYear() + 1, 0, 1).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsResponse.data.items || [];
    let eventsCreated = 0;
    let eventsUpdated = 0;
    const eventsDeleted = 0; // TODO: Implement event deletion logic

    // Process events in a transaction
    await prisma.$transaction(async (tx) => {
      // First, process master events
      const masterEvents = new Map();
      for (const event of events) {
        if (event.recurringEventId) {
          if (!masterEvents.has(event.recurringEventId)) {
            try {
              const masterEvent = await calendar.events.get({
                calendarId,
                eventId: event.recurringEventId,
              });
              masterEvents.set(event.recurringEventId, masterEvent.data);
            } catch (error) {
              logger.error(
                "Failed to fetch master event",
                {
                  eventId: event.recurringEventId,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
                LOG_SOURCE
              );
            }
          }
        }
      }

      // Create or update master events
      for (const [eventId, masterEventData] of masterEvents) {
        const existingMaster = await tx.calendarEvent.findFirst({
          where: {
            feedId,
            externalEventId: eventId,
            isMaster: true,
          },
        });

        const isAllDay = masterEventData.start
          ? !masterEventData.start.dateTime
          : false;

        const masterEventRecord = {
          feedId,
          externalEventId: eventId,
          title: masterEventData.summary || "Untitled Event",
          description: masterEventData.description || "",
          start: isAllDay
            ? createAllDayDate(masterEventData.start?.date || "")
            : newDate(
                masterEventData.start?.dateTime ||
                  masterEventData.start?.date ||
                  ""
              ),
          end: isAllDay
            ? createAllDayDate(masterEventData.end?.date || "")
            : newDate(
                masterEventData.end?.dateTime || masterEventData.end?.date || ""
              ),
          location: masterEventData.location,
          isRecurring: true,
          isMaster: true,
          recurrenceRule: processRecurrenceRule(
            masterEventData.recurrence,
            newDate(
              masterEventData.start?.dateTime ||
                masterEventData.start?.date ||
                ""
            )
          ),
          recurringEventId: masterEventData.recurringEventId,
          allDay: isAllDay,
          status: masterEventData.status,
          sequence: masterEventData.sequence,
          created: masterEventData.created
            ? newDate(masterEventData.created)
            : undefined,
          lastModified: masterEventData.updated
            ? newDate(masterEventData.updated)
            : undefined,
          organizer: masterEventData.organizer
            ? {
                name: masterEventData.organizer.displayName,
                email: masterEventData.organizer.email,
              }
            : undefined,
          attendees: masterEventData.attendees?.map(
            (a: calendar_v3.Schema$EventAttendee) => ({
              name: a.displayName,
              email: a.email,
              status: a.responseStatus,
            })
          ),
        };

        if (existingMaster) {
          await tx.calendarEvent.update({
            where: { id: existingMaster.id },
            data: masterEventRecord,
          });
          eventsUpdated++;
        } else {
          await tx.calendarEvent.create({
            data: masterEventRecord,
          });
          eventsCreated++;
        }
      }

      // Create or update event instances
      for (const event of events) {
        const existingEvent = await tx.calendarEvent.findFirst({
          where: {
            feedId,
            externalEventId: event.id,
            isMaster: false,
          },
        });

        const masterEvent = event.recurringEventId
          ? await tx.calendarEvent.findFirst({
              where: {
                feedId,
                externalEventId: event.recurringEventId,
                isMaster: true,
              },
            })
          : null;

        const isAllDay = event.start ? !event.start.dateTime : false;

        const eventRecord = {
          feedId,
          externalEventId: event.id,
          title: event.summary || "Untitled Event",
          description: event.description || "",
          start: isAllDay
            ? createAllDayDate(event.start?.date || "")
            : newDate(event.start?.dateTime || event.start?.date || ""),
          end: isAllDay
            ? createAllDayDate(event.end?.date || "")
            : newDate(event.end?.dateTime || event.end?.date || ""),
          location: event.location,
          isRecurring: !!event.recurringEventId,
          isMaster: false,
          masterEventId: masterEvent?.id,
          recurringEventId: event.recurringEventId,
          recurrenceRule: masterEvent
            ? undefined
            : processRecurrenceRule(
                event.recurrence,
                event.start
                  ? newDate(event.start?.dateTime || event.start?.date || "")
                  : undefined
              ),
          allDay: isAllDay,
          status: event.status,
          sequence: event.sequence,
          created: event.created ? newDate(event.created) : undefined,
          lastModified: event.updated ? newDate(event.updated) : undefined,
          organizer: event.organizer
            ? {
                name: event.organizer.displayName,
                email: event.organizer.email,
              }
            : undefined,
          attendees: event.attendees?.map((a) => ({
            name: a.displayName,
            email: a.email,
            status: a.responseStatus,
          })),
        };

        if (existingEvent) {
          await tx.calendarEvent.update({
            where: { id: existingEvent.id },
            data: eventRecord,
          });
          eventsUpdated++;
        } else {
          await tx.calendarEvent.create({
            data: eventRecord,
          });
          eventsCreated++;
        }
      }
    });

    const result: CalendarSyncResult = {
      success: true,
      eventsCreated,
      eventsUpdated,
      eventsDeleted,
    };

    logger.info(
      "Google calendar events synced successfully",
      result,
      LOG_SOURCE
    );

    return result;
  } catch (error) {
    logger.error(
      "Failed to sync Google calendar events",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
        calendarId,
      },
      LOG_SOURCE
    );
    throw new CalendarSyncError("Failed to sync calendar events", "GOOGLE");
  }
}

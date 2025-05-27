/**
 * CalDAV Calendar Events business logic functions
 */
import { CalDAVCalendarService } from "@/lib/caldav-calendar";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { CalendarError } from "../shared/types";
import {
  type CreateCalDAVEventInput,
  CreateCalDAVEventInputSchema,
  type DeleteCalDAVEventInput,
  DeleteCalDAVEventInputSchema,
  type UpdateCalDAVEventInput,
  UpdateCalDAVEventInputSchema,
} from "./schemas";

// Use Prisma type for CalendarEvent
type CalendarEvent = Awaited<ReturnType<typeof prisma.calendarEvent.create>>;

const LOG_SOURCE = "CalDAVEventsAPI";

/**
 * Convert Prisma null types to undefined for CalDAV service compatibility
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertPrismaToCalDAVEvent(event: any): any {
  return {
    ...event,
    externalEventId: event.externalEventId || undefined,
    description: event.description || undefined,
    location: event.location || undefined,
    recurrenceRule: event.recurrenceRule || undefined,
    status: event.status || undefined,
    recurringEventId: event.recurringEventId || undefined,
  };
}

/**
 * Create a new CalDAV Calendar event
 */
export async function createCalDAVCalendarEvent(
  input: CreateCalDAVEventInput
): Promise<CalendarEvent[]> {
  const { feedId, userId, ...eventData } =
    CreateCalDAVEventInputSchema.parse(input);

  logger.info("Creating CalDAV calendar event", { feedId }, LOG_SOURCE);

  try {
    // Check if the feed belongs to the current user
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
      },
      include: {
        account: true,
      },
    });

    if (!feed || feed.type !== "CALDAV" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "CALDAV",
        "INVALID_FEED",
        400
      );
    }

    // Check if account exists
    if (!feed.account) {
      throw new CalendarError(
        "Missing account for CalDAV event creation",
        "CALDAV",
        "INVALID_FEED",
        400
      );
    }

    // Create CalDAV service
    const caldavService = new CalDAVCalendarService(feed.account);

    // Create event in CalDAV Calendar
    const caldavEvent = await caldavService.createEvent(
      feed.url,
      {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        allDay: eventData.allDay,
        isRecurring: eventData.isRecurring,
        recurrenceRule: eventData.recurrenceRule,
      },
      userId
    );

    if (!caldavEvent.externalEventId) {
      throw new CalendarError(
        "Failed to get event ID from CalDAV Calendar",
        "CALDAV"
      );
    }

    logger.info(
      "CalDAV calendar event created successfully",
      { feedId, eventId: caldavEvent.externalEventId },
      LOG_SOURCE
    );

    return [caldavEvent as CalendarEvent];
  } catch (error) {
    logger.error(
      "Failed to create CalDAV calendar event",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to create event", "CALDAV");
  }
}

/**
 * Update a CalDAV Calendar event
 */
export async function updateCalDAVCalendarEvent(
  input: UpdateCalDAVEventInput
): Promise<CalendarEvent> {
  const { eventId, feedId, userId, mode, ...eventData } =
    UpdateCalDAVEventInputSchema.parse(input);

  logger.info(
    "Updating CalDAV calendar event",
    { eventId, feedId },
    LOG_SOURCE
  );

  try {
    // Check if the feed belongs to the current user
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
      },
      include: {
        account: true,
      },
    });

    if (!feed || feed.type !== "CALDAV" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "CALDAV",
        "INVALID_FEED",
        400
      );
    }

    // Get the existing event from our database
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        externalEventId: eventId,
        feedId,
      },
      include: {
        feed: true,
      },
    });

    if (!existingEvent) {
      throw new CalendarError("Event not found", "CALDAV", "NOT_FOUND", 404);
    }

    // Check if account exists
    if (!feed.account) {
      throw new CalendarError(
        "Missing account for CalDAV event update",
        "CALDAV",
        "INVALID_FEED",
        400
      );
    }

    // Create CalDAV service
    const caldavService = new CalDAVCalendarService(feed.account);

    // Update event in CalDAV Calendar
    const updatedEvent = await caldavService.updateEvent(
      convertPrismaToCalDAVEvent(existingEvent),
      feed.url,
      eventId,
      {
        title: eventData.title || existingEvent.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start || existingEvent.start,
        end: eventData.end || existingEvent.end,
        allDay: eventData.allDay ?? existingEvent.allDay,
        isRecurring: eventData.isRecurring ?? existingEvent.isRecurring,
        recurrenceRule: eventData.recurrenceRule,
      },
      mode || "single",
      userId
    );

    logger.info(
      "CalDAV calendar event updated successfully",
      { eventId, feedId },
      LOG_SOURCE
    );

    return updatedEvent as CalendarEvent;
  } catch (error) {
    logger.error(
      "Failed to update CalDAV calendar event",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        eventId,
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to update event", "CALDAV");
  }
}

/**
 * Delete a CalDAV Calendar event
 */
export async function deleteCalDAVCalendarEvent(
  input: DeleteCalDAVEventInput
): Promise<{ success: boolean }> {
  const { eventId, feedId, userId, mode } =
    DeleteCalDAVEventInputSchema.parse(input);

  logger.info(
    "Deleting CalDAV calendar event",
    { eventId, feedId },
    LOG_SOURCE
  );

  try {
    // Check if the feed belongs to the current user
    const feed = await prisma.calendarFeed.findUnique({
      where: {
        id: feedId,
        userId,
      },
      include: {
        account: true,
      },
    });

    if (!feed || feed.type !== "CALDAV" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "CALDAV",
        "INVALID_FEED",
        400
      );
    }

    // Get the existing event from our database
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        externalEventId: eventId,
        feedId,
      },
      include: {
        feed: true,
      },
    });

    if (!existingEvent) {
      throw new CalendarError("Event not found", "CALDAV", "NOT_FOUND", 404);
    }

    // Check if account exists
    if (!feed.account) {
      throw new CalendarError(
        "Missing account for CalDAV event deletion",
        "CALDAV",
        "INVALID_FEED",
        400
      );
    }

    // Create CalDAV service
    const caldavService = new CalDAVCalendarService(feed.account);

    // Delete the event from CalDAV
    await caldavService.deleteEvent(
      convertPrismaToCalDAVEvent(existingEvent),
      feed.url,
      eventId,
      mode || "single",
      userId
    );

    // Delete the event from our database
    if (mode === "series" && existingEvent.recurringEventId) {
      // Delete all instances of the series
      await prisma.calendarEvent.deleteMany({
        where: {
          OR: [
            { externalEventId: eventId },
            { recurringEventId: existingEvent.recurringEventId },
            { recurringEventId: eventId },
          ],
        },
      });
    } else {
      // Delete only this event
      await prisma.calendarEvent.delete({
        where: { id: existingEvent.id },
      });
    }

    logger.info(
      "CalDAV calendar event deleted successfully",
      { eventId, feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete CalDAV calendar event",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        eventId,
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to delete event", "CALDAV");
  }
}

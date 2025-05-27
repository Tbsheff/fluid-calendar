/**
 * Outlook Calendar Events business logic functions
 */
import { logger } from "@/lib/logger";
import {
  createOutlookEvent,
  deleteOutlookEvent,
  updateOutlookEvent,
} from "@/lib/outlook-calendar";
import { getOutlookClient } from "@/lib/outlook-calendar";
import { syncOutlookCalendar } from "@/lib/outlook-sync";
import { prisma } from "@/lib/prisma";

import { CalendarError } from "../shared/types";
import {
  type CreateOutlookEventInput,
  CreateOutlookEventInputSchema,
  type DeleteOutlookEventInput,
  DeleteOutlookEventInputSchema,
  type UpdateOutlookEventInput,
  UpdateOutlookEventInputSchema,
} from "./schemas";

// Use Prisma type for CalendarEvent
type CalendarEvent = Awaited<ReturnType<typeof prisma.calendarEvent.create>>;

const LOG_SOURCE = "OutlookEventsAPI";

/**
 * Create a new Outlook Calendar event
 */
export async function createOutlookCalendarEvent(
  input: CreateOutlookEventInput
): Promise<CalendarEvent[]> {
  const { feedId, userId, ...eventData } =
    CreateOutlookEventInputSchema.parse(input);

  logger.info("Creating Outlook calendar event", { feedId }, LOG_SOURCE);

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

    if (!feed || feed.type !== "OUTLOOK" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "OUTLOOK",
        "INVALID_FEED",
        400
      );
    }

    // Create event in Outlook Calendar
    const outlookEvent = await createOutlookEvent(
      feed.accountId,
      userId,
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
      }
    );

    if (!outlookEvent.id) {
      throw new CalendarError(
        "Failed to get event ID from Outlook Calendar",
        "OUTLOOK"
      );
    }

    // Sync the calendar to get the new event in our database
    const client = await getOutlookClient(feed.accountId, userId);
    await syncOutlookCalendar(
      client,
      { id: feed.id, url: feed.url },
      feed.syncToken
    );

    // Get the created event from database
    const createdEvent = await prisma.calendarEvent.findFirst({
      where: {
        feedId: feed.id,
        externalEventId: outlookEvent.id,
      },
    });

    if (!createdEvent) {
      throw new CalendarError(
        "Failed to find created event after sync",
        "OUTLOOK"
      );
    }

    logger.info(
      "Outlook calendar event created successfully",
      { feedId, eventId: outlookEvent.id },
      LOG_SOURCE
    );

    return [createdEvent as CalendarEvent];
  } catch (error) {
    logger.error(
      "Failed to create Outlook calendar event",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to create event", "OUTLOOK");
  }
}

/**
 * Update an Outlook Calendar event
 */
export async function updateOutlookCalendarEvent(
  input: UpdateOutlookEventInput
): Promise<CalendarEvent> {
  const { eventId, feedId, userId, mode, ...eventData } =
    UpdateOutlookEventInputSchema.parse(input);

  logger.info(
    "Updating Outlook calendar event",
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

    if (!feed || feed.type !== "OUTLOOK" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "OUTLOOK",
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
    });

    if (!existingEvent) {
      throw new CalendarError("Event not found", "OUTLOOK", "NOT_FOUND", 404);
    }

    // Update event in Outlook Calendar
    const outlookEvent = await updateOutlookEvent(
      feed.accountId,
      userId,
      feed.url,
      eventId,
      {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        allDay: eventData.allDay,
        isRecurring: eventData.isRecurring,
        recurrenceRule: eventData.recurrenceRule,
        mode: mode,
      }
    );

    // Delete existing event and any related instances from our database
    await prisma.calendarEvent.deleteMany({
      where: {
        OR: [
          { id: existingEvent.id },
          { recurringEventId: existingEvent.externalEventId },
        ],
      },
    });

    // Sync the calendar to get the updated event in our database
    const client = await getOutlookClient(feed.accountId, userId);
    await syncOutlookCalendar(
      client,
      { id: feed.id, url: feed.url },
      feed.syncToken
    );

    // Get the updated event from database
    const updatedEvent = await prisma.calendarEvent.findFirst({
      where: {
        feedId: feed.id,
        externalEventId: outlookEvent.id,
      },
    });

    if (!updatedEvent) {
      throw new CalendarError(
        "Failed to find updated event after sync",
        "OUTLOOK"
      );
    }

    logger.info(
      "Outlook calendar event updated successfully",
      { eventId, feedId },
      LOG_SOURCE
    );

    return updatedEvent as CalendarEvent;
  } catch (error) {
    logger.error(
      "Failed to update Outlook calendar event",
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
    throw new CalendarError("Failed to update event", "OUTLOOK");
  }
}

/**
 * Delete an Outlook Calendar event
 */
export async function deleteOutlookCalendarEvent(
  input: DeleteOutlookEventInput
): Promise<{ success: boolean }> {
  const { eventId, feedId, userId, mode } =
    DeleteOutlookEventInputSchema.parse(input);

  logger.info(
    "Deleting Outlook calendar event",
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

    if (!feed || feed.type !== "OUTLOOK" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "OUTLOOK",
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
    });

    if (!existingEvent) {
      throw new CalendarError("Event not found", "OUTLOOK", "NOT_FOUND", 404);
    }

    // Delete event from Outlook Calendar
    await deleteOutlookEvent(feed.accountId, userId, feed.url, eventId, mode);

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
      "Outlook calendar event deleted successfully",
      { eventId, feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete Outlook calendar event",
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
    throw new CalendarError("Failed to delete event", "OUTLOOK");
  }
}

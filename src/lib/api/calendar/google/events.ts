/**
 * Google Calendar Events business logic functions
 */
import { calendar_v3 } from "googleapis";

import { createAllDayDate, newDate } from "@/lib/date-utils";
import getGoogleEvent, {
  createGoogleEvent,
  deleteGoogleEvent,
  updateGoogleEvent,
} from "@/lib/google-calendar";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { CalendarError } from "../shared/types";
import {
  type CreateGoogleEventInput,
  CreateGoogleEventInputSchema,
  type DeleteGoogleEventInput,
  DeleteGoogleEventInputSchema,
  type UpdateGoogleEventInput,
  UpdateGoogleEventInputSchema,
} from "./schemas";

// Use Prisma type for CalendarEvent
type CalendarEvent = Awaited<ReturnType<typeof prisma.calendarEvent.create>>;

const LOG_SOURCE = "GoogleEventsAPI";

type GoogleEvent = calendar_v3.Schema$Event;

/**
 * Helper function to write event to database
 */
async function writeEventToDatabase(
  feedId: string,
  event: GoogleEvent,
  instances?: GoogleEvent[]
): Promise<CalendarEvent[]> {
  const isRecurring = !!event.recurrence;
  const isAllDay = event.start ? !event.start.dateTime : false;

  if (!isRecurring) {
    // Create the master event only if not recurring
    const masterEvent = await prisma.calendarEvent.create({
      data: {
        feedId,
        externalEventId: event.id!,
        title: event.summary || "Untitled Event",
        description: event.description || "",
        start: isAllDay
          ? createAllDayDate(event.start?.date || "")
          : newDate(event.start?.dateTime || event.start?.date || ""),
        end: isAllDay
          ? createAllDayDate(event.end?.date || "")
          : newDate(event.end?.dateTime || event.end?.date || ""),
        location: event.location,
        isRecurring: isRecurring,
        recurrenceRule: event.recurrence?.[0],
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
      },
    });
    return [masterEvent as CalendarEvent];
  }

  // Create instances if any
  const createdInstances: CalendarEvent[] = [];
  if (instances) {
    for (const instance of instances) {
      const instanceIsAllDay = instance.start
        ? !instance.start.dateTime
        : false;

      const createdInstance = await prisma.calendarEvent.create({
        data: {
          feedId,
          externalEventId: instance.id!,
          title: instance.summary || "Untitled Event",
          description: instance.description || "",
          start: instanceIsAllDay
            ? createAllDayDate(instance.start?.date || "")
            : newDate(instance.start?.dateTime || instance.start?.date || ""),
          end: instanceIsAllDay
            ? createAllDayDate(instance.end?.date || "")
            : newDate(instance.end?.dateTime || instance.end?.date || ""),
          location: instance.location,
          isRecurring: true,
          recurrenceRule: event.recurrence?.[0],
          recurringEventId: instance.recurringEventId,
          allDay: instanceIsAllDay,
          status: instance.status,
          sequence: instance.sequence,
          created: instance.created ? newDate(instance.created) : undefined,
          lastModified: instance.updated
            ? newDate(instance.updated)
            : undefined,
          organizer: instance.organizer
            ? {
                name: instance.organizer.displayName,
                email: instance.organizer.email,
              }
            : undefined,
          attendees: instance.attendees?.map((a) => ({
            name: a.displayName,
            email: a.email,
            status: a.responseStatus,
          })),
        },
      });
      createdInstances.push(createdInstance as CalendarEvent);
    }
  }

  return createdInstances;
}

/**
 * Create a new Google Calendar event
 */
export async function createGoogleCalendarEvent(
  input: CreateGoogleEventInput
): Promise<CalendarEvent[]> {
  const { feedId, userId, ...eventData } =
    CreateGoogleEventInputSchema.parse(input);

  logger.info("Creating Google calendar event", { feedId }, LOG_SOURCE);

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

    if (!feed || feed.type !== "GOOGLE" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "GOOGLE",
        "INVALID_FEED",
        400
      );
    }

    // Create event in Google Calendar
    const googleEvent = await createGoogleEvent(
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

    if (!googleEvent.id) {
      throw new CalendarError(
        "Failed to get event ID from Google Calendar",
        "GOOGLE"
      );
    }

    // Sync the new event to our database
    const { event, instances } = await getGoogleEvent(
      feed.accountId,
      userId,
      feed.url,
      googleEvent.id
    );

    // Create the event record(s) in our database
    const records = await writeEventToDatabase(feed.id, event, instances);

    logger.info(
      "Google calendar event created successfully",
      { feedId, eventId: googleEvent.id },
      LOG_SOURCE
    );

    return records;
  } catch (error) {
    logger.error(
      "Failed to create Google calendar event",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        feedId,
      },
      LOG_SOURCE
    );
    if (error instanceof CalendarError) {
      throw error;
    }
    throw new CalendarError("Failed to create event", "GOOGLE");
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateGoogleCalendarEvent(
  input: UpdateGoogleEventInput
): Promise<CalendarEvent> {
  const { eventId, feedId, userId, ...eventData } =
    UpdateGoogleEventInputSchema.parse(input);

  logger.info(
    "Updating Google calendar event",
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

    if (!feed || feed.type !== "GOOGLE" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "GOOGLE",
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
      throw new CalendarError("Event not found", "GOOGLE", "NOT_FOUND", 404);
    }

    // Update event in Google Calendar
    const googleEvent = await updateGoogleEvent(
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
      }
    );

    // Update the event in our database
    const isAllDay = googleEvent.start ? !googleEvent.start.dateTime : false;

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: existingEvent.id },
      data: {
        title: googleEvent.summary || "Untitled Event",
        description: googleEvent.description || "",
        start: isAllDay
          ? createAllDayDate(googleEvent.start?.date || "")
          : newDate(
              googleEvent.start?.dateTime || googleEvent.start?.date || ""
            ),
        end: isAllDay
          ? createAllDayDate(googleEvent.end?.date || "")
          : newDate(googleEvent.end?.dateTime || googleEvent.end?.date || ""),
        location: googleEvent.location,
        allDay: isAllDay,
        status: googleEvent.status,
        sequence: googleEvent.sequence,
        lastModified: googleEvent.updated
          ? newDate(googleEvent.updated)
          : undefined,
        organizer: googleEvent.organizer
          ? {
              name: googleEvent.organizer.displayName,
              email: googleEvent.organizer.email,
            }
          : undefined,
        attendees: googleEvent.attendees?.map((a) => ({
          name: a.displayName,
          email: a.email,
          status: a.responseStatus,
        })),
      },
    });

    logger.info(
      "Google calendar event updated successfully",
      { eventId, feedId },
      LOG_SOURCE
    );

    return updatedEvent as CalendarEvent;
  } catch (error) {
    logger.error(
      "Failed to update Google calendar event",
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
    throw new CalendarError("Failed to update event", "GOOGLE");
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(
  input: DeleteGoogleEventInput
): Promise<{ success: boolean }> {
  const { eventId, feedId, userId } = DeleteGoogleEventInputSchema.parse(input);

  logger.info(
    "Deleting Google calendar event",
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

    if (!feed || feed.type !== "GOOGLE" || !feed.url || !feed.accountId) {
      throw new CalendarError(
        "Invalid calendar feed",
        "GOOGLE",
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
      throw new CalendarError("Event not found", "GOOGLE", "NOT_FOUND", 404);
    }

    // Delete event from Google Calendar
    await deleteGoogleEvent(feed.accountId, userId, feed.url, eventId);

    // Delete the event from our database
    await prisma.calendarEvent.delete({
      where: { id: existingEvent.id },
    });

    logger.info(
      "Google calendar event deleted successfully",
      { eventId, feedId },
      LOG_SOURCE
    );

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete Google calendar event",
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
    throw new CalendarError("Failed to delete event", "GOOGLE");
  }
}

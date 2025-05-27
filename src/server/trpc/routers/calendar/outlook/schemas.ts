/**
 * tRPC input schemas for Outlook Calendar operations
 */
import { z } from "zod";

// Outlook OAuth tRPC schemas
export const GetOutlookAuthUrlInputSchema = z.object({});

export const GetAvailableOutlookCalendarsInputSchema = z.object({
  accountId: z.string().uuid(),
});

export const AddOutlookCalendarInputSchema = z.object({
  accountId: z.string().uuid(),
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const SyncOutlookCalendarsInputSchema = z.object({
  accountId: z.string().uuid(),
  feedIds: z.array(z.string().uuid()).optional(),
});

export const UpdateOutlookCalendarFeedInputSchema = z.object({
  accountId: z.string().uuid(),
  feedId: z.string().uuid(),
  name: z.string().min(1, "Calendar name is required").optional(),
  color: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export const DeleteOutlookCalendarFeedInputSchema = z.object({
  accountId: z.string().uuid(),
  feedId: z.string().uuid(),
});

// Outlook Events tRPC schemas
export const CreateOutlookEventInputSchema = z.object({
  feedId: z.string().uuid(),
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  allDay: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .optional(),
});

export const UpdateOutlookEventInputSchema = z.object({
  eventId: z.string(),
  feedId: z.string().uuid(),
  title: z.string().min(1, "Event title is required").optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  mode: z.enum(["single", "series"]).optional(),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .optional(),
});

export const DeleteOutlookEventInputSchema = z.object({
  eventId: z.string(),
  feedId: z.string().uuid(),
  mode: z.enum(["single", "series"]).optional(),
});

// Type exports
export type GetOutlookAuthUrlInput = z.infer<
  typeof GetOutlookAuthUrlInputSchema
>;
export type GetAvailableOutlookCalendarsInput = z.infer<
  typeof GetAvailableOutlookCalendarsInputSchema
>;
export type AddOutlookCalendarInput = z.infer<
  typeof AddOutlookCalendarInputSchema
>;
export type SyncOutlookCalendarsInput = z.infer<
  typeof SyncOutlookCalendarsInputSchema
>;
export type UpdateOutlookCalendarFeedInput = z.infer<
  typeof UpdateOutlookCalendarFeedInputSchema
>;
export type DeleteOutlookCalendarFeedInput = z.infer<
  typeof DeleteOutlookCalendarFeedInputSchema
>;
export type CreateOutlookEventInput = z.infer<
  typeof CreateOutlookEventInputSchema
>;
export type UpdateOutlookEventInput = z.infer<
  typeof UpdateOutlookEventInputSchema
>;
export type DeleteOutlookEventInput = z.infer<
  typeof DeleteOutlookEventInputSchema
>;

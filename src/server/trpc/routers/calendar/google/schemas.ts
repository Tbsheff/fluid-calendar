/**
 * tRPC input schemas for Google Calendar operations
 */
import { z } from "zod";

// Google OAuth tRPC schemas
export const GetGoogleAuthUrlInputSchema = z.object({});

export const GetAvailableGoogleCalendarsInputSchema = z.object({
  accountId: z.string().uuid(),
});

export const AddGoogleCalendarInputSchema = z.object({
  accountId: z.string().uuid(),
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const SyncGoogleCalendarsInputSchema = z.object({
  accountId: z.string().uuid(),
  feedIds: z.array(z.string().uuid()).optional(),
});

export const UpdateGoogleCalendarFeedInputSchema = z.object({
  accountId: z.string().uuid(),
  feedId: z.string().uuid(),
  name: z.string().min(1, "Calendar name is required").optional(),
  color: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export const DeleteGoogleCalendarFeedInputSchema = z.object({
  accountId: z.string().uuid(),
  feedId: z.string().uuid(),
});

// Google Events tRPC schemas
export const CreateGoogleEventInputSchema = z.object({
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

export const UpdateGoogleEventInputSchema = z.object({
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
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .optional(),
});

export const DeleteGoogleEventInputSchema = z.object({
  eventId: z.string(),
  feedId: z.string().uuid(),
});

// Type exports
export type GetGoogleAuthUrlInput = z.infer<typeof GetGoogleAuthUrlInputSchema>;
export type GetAvailableGoogleCalendarsInput = z.infer<
  typeof GetAvailableGoogleCalendarsInputSchema
>;
export type AddGoogleCalendarInput = z.infer<
  typeof AddGoogleCalendarInputSchema
>;
export type SyncGoogleCalendarsInput = z.infer<
  typeof SyncGoogleCalendarsInputSchema
>;
export type UpdateGoogleCalendarFeedInput = z.infer<
  typeof UpdateGoogleCalendarFeedInputSchema
>;
export type DeleteGoogleCalendarFeedInput = z.infer<
  typeof DeleteGoogleCalendarFeedInputSchema
>;
export type CreateGoogleEventInput = z.infer<
  typeof CreateGoogleEventInputSchema
>;
export type UpdateGoogleEventInput = z.infer<
  typeof UpdateGoogleEventInputSchema
>;
export type DeleteGoogleEventInput = z.infer<
  typeof DeleteGoogleEventInputSchema
>;

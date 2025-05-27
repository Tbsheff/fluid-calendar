/**
 * Google Calendar specific schemas
 */
import { z } from "zod";

import {
  AccountInputSchema,
  BaseCalendarInputSchema,
  CalendarFeedInputSchema,
  EventInputSchema,
} from "../shared/schemas";

// Google OAuth schemas
export const GetGoogleAuthUrlInputSchema = BaseCalendarInputSchema;

export const GoogleOAuthCallbackInputSchema = BaseCalendarInputSchema.extend({
  code: z.string().min(1, "Authorization code is required"),
});

// Google calendar schemas
export const GetAvailableGoogleCalendarsInputSchema = AccountInputSchema;

export const AddGoogleCalendarInputSchema = AccountInputSchema.extend({
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const SyncGoogleCalendarsInputSchema = AccountInputSchema.extend({
  feedIds: z.array(z.string().uuid()).optional(),
});

export const UpdateGoogleCalendarFeedInputSchema =
  CalendarFeedInputSchema.extend({
    name: z.string().min(1, "Calendar name is required").optional(),
    color: z.string().optional(),
    isEnabled: z.boolean().optional(),
  });

export const DeleteGoogleCalendarFeedInputSchema = CalendarFeedInputSchema;

// Google event schemas
export const CreateGoogleEventInputSchema = BaseCalendarInputSchema.extend({
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

export const UpdateGoogleEventInputSchema = EventInputSchema.extend({
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

export const DeleteGoogleEventInputSchema = EventInputSchema.extend({
  feedId: z.string().uuid(),
});

// Type exports
export type GetGoogleAuthUrlInput = z.infer<typeof GetGoogleAuthUrlInputSchema>;
export type GoogleOAuthCallbackInput = z.infer<
  typeof GoogleOAuthCallbackInputSchema
>;
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

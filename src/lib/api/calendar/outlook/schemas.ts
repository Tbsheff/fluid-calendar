/**
 * Outlook Calendar specific schemas
 */
import { z } from "zod";

import {
  AccountInputSchema,
  BaseCalendarInputSchema,
  CalendarFeedInputSchema,
  EventInputSchema,
} from "../shared/schemas";

// Outlook OAuth schemas
export const GetOutlookAuthUrlInputSchema = BaseCalendarInputSchema;

export const OutlookOAuthCallbackInputSchema = BaseCalendarInputSchema.extend({
  code: z.string().min(1, "Authorization code is required"),
});

// Outlook calendar schemas
export const GetAvailableOutlookCalendarsInputSchema = AccountInputSchema;

export const AddOutlookCalendarInputSchema = AccountInputSchema.extend({
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const SyncOutlookCalendarsInputSchema = AccountInputSchema.extend({
  feedIds: z.array(z.string().uuid()).optional(),
});

export const UpdateOutlookCalendarFeedInputSchema =
  CalendarFeedInputSchema.extend({
    name: z.string().min(1, "Calendar name is required").optional(),
    color: z.string().optional(),
    isEnabled: z.boolean().optional(),
  });

export const DeleteOutlookCalendarFeedInputSchema = CalendarFeedInputSchema;

// Outlook event schemas
export const CreateOutlookEventInputSchema = BaseCalendarInputSchema.extend({
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

export const UpdateOutlookEventInputSchema = EventInputSchema.extend({
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

export const DeleteOutlookEventInputSchema = EventInputSchema.extend({
  feedId: z.string().uuid(),
  mode: z.enum(["single", "series"]).optional(),
});

// Type exports
export type GetOutlookAuthUrlInput = z.infer<
  typeof GetOutlookAuthUrlInputSchema
>;
export type OutlookOAuthCallbackInput = z.infer<
  typeof OutlookOAuthCallbackInputSchema
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

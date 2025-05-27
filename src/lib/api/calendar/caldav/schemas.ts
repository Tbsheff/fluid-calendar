/**
 * CalDAV Calendar specific schemas
 */
import { z } from "zod";

import {
  AccountInputSchema,
  BaseCalendarInputSchema,
  CalendarFeedInputSchema,
  EventInputSchema,
} from "../shared/schemas";

// CalDAV Auth schemas
export const AuthenticateCalDAVInputSchema = BaseCalendarInputSchema.extend({
  serverUrl: z.string().url("Valid server URL is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  path: z.string().optional(),
});

export const TestCalDAVConnectionInputSchema = BaseCalendarInputSchema.extend({
  serverUrl: z.string().url("Valid server URL is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  path: z.string().optional(),
});

// CalDAV calendar schemas
export const GetAvailableCalDAVCalendarsInputSchema = AccountInputSchema;

export const AddCalDAVCalendarInputSchema = AccountInputSchema.extend({
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const SyncCalDAVCalendarsInputSchema = AccountInputSchema.extend({
  feedIds: z.array(z.string().uuid()).optional(),
});

export const UpdateCalDAVCalendarFeedInputSchema =
  CalendarFeedInputSchema.extend({
    name: z.string().min(1, "Calendar name is required").optional(),
    color: z.string().optional(),
    isEnabled: z.boolean().optional(),
  });

export const DeleteCalDAVCalendarFeedInputSchema = CalendarFeedInputSchema;

// CalDAV event schemas
export const CreateCalDAVEventInputSchema = BaseCalendarInputSchema.extend({
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

export const UpdateCalDAVEventInputSchema = EventInputSchema.extend({
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

export const DeleteCalDAVEventInputSchema = EventInputSchema.extend({
  feedId: z.string().uuid(),
  mode: z.enum(["single", "series"]).optional(),
});

// Type exports
export type AuthenticateCalDAVInput = z.infer<
  typeof AuthenticateCalDAVInputSchema
>;
export type TestCalDAVConnectionInput = z.infer<
  typeof TestCalDAVConnectionInputSchema
>;
export type GetAvailableCalDAVCalendarsInput = z.infer<
  typeof GetAvailableCalDAVCalendarsInputSchema
>;
export type AddCalDAVCalendarInput = z.infer<
  typeof AddCalDAVCalendarInputSchema
>;
export type SyncCalDAVCalendarsInput = z.infer<
  typeof SyncCalDAVCalendarsInputSchema
>;
export type UpdateCalDAVCalendarFeedInput = z.infer<
  typeof UpdateCalDAVCalendarFeedInputSchema
>;
export type DeleteCalDAVCalendarFeedInput = z.infer<
  typeof DeleteCalDAVCalendarFeedInputSchema
>;
export type CreateCalDAVEventInput = z.infer<
  typeof CreateCalDAVEventInputSchema
>;
export type UpdateCalDAVEventInput = z.infer<
  typeof UpdateCalDAVEventInputSchema
>;
export type DeleteCalDAVEventInput = z.infer<
  typeof DeleteCalDAVEventInputSchema
>;

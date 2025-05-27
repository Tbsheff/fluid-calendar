/**
 * tRPC input schemas for CalDAV Calendar operations
 */
import { z } from "zod";

// CalDAV Auth tRPC schemas
export const AuthenticateCalDAVInputSchema = z.object({
  serverUrl: z.string().url("Valid server URL is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  path: z.string().optional(),
});

export const TestCalDAVConnectionInputSchema = z.object({
  serverUrl: z.string().url("Valid server URL is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  path: z.string().optional(),
});

export const GetAvailableCalDAVCalendarsInputSchema = z.object({
  accountId: z.string().uuid(),
});

export const AddCalDAVCalendarInputSchema = z.object({
  accountId: z.string().uuid(),
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const SyncCalDAVCalendarsInputSchema = z.object({
  accountId: z.string().uuid(),
  feedIds: z.array(z.string().uuid()).optional(),
});

export const UpdateCalDAVCalendarFeedInputSchema = z.object({
  accountId: z.string().uuid(),
  feedId: z.string().uuid(),
  name: z.string().min(1, "Calendar name is required").optional(),
  color: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export const DeleteCalDAVCalendarFeedInputSchema = z.object({
  accountId: z.string().uuid(),
  feedId: z.string().uuid(),
});

// CalDAV Events tRPC schemas
export const CreateCalDAVEventInputSchema = z.object({
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

export const UpdateCalDAVEventInputSchema = z.object({
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

export const DeleteCalDAVEventInputSchema = z.object({
  eventId: z.string(),
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

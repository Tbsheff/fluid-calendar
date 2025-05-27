/**
 * Shared Zod schemas for calendar operations across all providers
 */
import { z } from "zod";

// Base schemas
export const CalendarProviderSchema = z.enum(["GOOGLE", "OUTLOOK", "CALDAV"]);

export const BaseCalendarInputSchema = z.object({
  userId: z.string().uuid(),
});

export const CalendarProviderInputSchema = BaseCalendarInputSchema.extend({
  provider: CalendarProviderSchema,
});

export const AccountInputSchema = BaseCalendarInputSchema.extend({
  accountId: z.string().uuid(),
});

export const CalendarFeedInputSchema = AccountInputSchema.extend({
  feedId: z.string().uuid(),
});

export const EventInputSchema = BaseCalendarInputSchema.extend({
  eventId: z.string(),
});

// OAuth schemas
export const OAuthCallbackInputSchema = BaseCalendarInputSchema.extend({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional(),
});

export const OAuthUrlResultSchema = z.object({
  authUrl: z.string().url(),
  state: z.string().optional(),
});

export const OAuthCallbackResultSchema = z.object({
  success: z.boolean(),
  accountId: z.string().uuid().optional(),
  message: z.string().optional(),
});

// Calendar and event schemas
export const AvailableCalendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  isPrimary: z.boolean().optional(),
  accessRole: z.string().optional(),
});

export const CalendarEventAttendeeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  status: z.enum(["accepted", "declined", "tentative", "needsAction"]),
});

export const CalendarEventOrganizerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allDay: z.boolean(),
  isRecurring: z.boolean(),
  recurrenceRule: z.string().optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]),
  sequence: z.number().optional(),
  externalEventId: z.string(),
  organizer: CalendarEventOrganizerSchema.optional(),
  attendees: z.array(CalendarEventAttendeeSchema).optional(),
  calendarFeedId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CalendarSyncResultSchema = z.object({
  success: z.boolean(),
  eventsCreated: z.number(),
  eventsUpdated: z.number(),
  eventsDeleted: z.number(),
  errors: z.array(z.string()).optional(),
});

// Common calendar operation schemas
export const AddCalendarInputSchema = AccountInputSchema.extend({
  calendarId: z.string().min(1, "Calendar ID is required"),
  name: z.string().min(1, "Calendar name is required"),
  color: z.string().optional(),
});

export const UpdateCalendarFeedInputSchema = CalendarFeedInputSchema.extend({
  name: z.string().min(1, "Calendar name is required").optional(),
  color: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export const DeleteCalendarFeedInputSchema = CalendarFeedInputSchema;

export const SyncCalendarsInputSchema = AccountInputSchema.extend({
  feedIds: z.array(z.string().uuid()).optional(), // If not provided, sync all feeds
});

// Event operation schemas
export const CreateEventInputSchema = BaseCalendarInputSchema.extend({
  calendarFeedId: z.string().uuid(),
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allDay: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  attendees: z.array(CalendarEventAttendeeSchema).optional(),
});

export const UpdateEventInputSchema = EventInputSchema.extend({
  calendarFeedId: z.string().uuid(),
  title: z.string().min(1, "Event title is required").optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  attendees: z.array(CalendarEventAttendeeSchema).optional(),
});

export const DeleteEventInputSchema = EventInputSchema.extend({
  calendarFeedId: z.string().uuid(),
});

// Test connection schema (for CalDAV)
export const TestConnectionInputSchema = BaseCalendarInputSchema.extend({
  url: z.string().url(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const TestConnectionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  calendars: z.array(AvailableCalendarSchema).optional(),
});

// Authentication schemas (for CalDAV)
export const CalDAVAuthInputSchema = BaseCalendarInputSchema.extend({
  url: z.string().url(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Account name is required"),
});

export const CalDAVAuthResultSchema = z.object({
  success: z.boolean(),
  accountId: z.string().uuid().optional(),
  message: z.string(),
});

// Response schemas
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

// Type exports for use in business logic
export type CalendarProvider = z.infer<typeof CalendarProviderSchema>;
export type BaseCalendarInput = z.infer<typeof BaseCalendarInputSchema>;
export type CalendarProviderInput = z.infer<typeof CalendarProviderInputSchema>;
export type AccountInput = z.infer<typeof AccountInputSchema>;
export type CalendarFeedInput = z.infer<typeof CalendarFeedInputSchema>;
export type EventInput = z.infer<typeof EventInputSchema>;
export type OAuthCallbackInput = z.infer<typeof OAuthCallbackInputSchema>;
export type OAuthUrlResult = z.infer<typeof OAuthUrlResultSchema>;
export type OAuthCallbackResult = z.infer<typeof OAuthCallbackResultSchema>;
export type AvailableCalendar = z.infer<typeof AvailableCalendarSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CalendarSyncResult = z.infer<typeof CalendarSyncResultSchema>;
export type AddCalendarInput = z.infer<typeof AddCalendarInputSchema>;
export type UpdateCalendarFeedInput = z.infer<
  typeof UpdateCalendarFeedInputSchema
>;
export type DeleteCalendarFeedInput = z.infer<
  typeof DeleteCalendarFeedInputSchema
>;
export type SyncCalendarsInput = z.infer<typeof SyncCalendarsInputSchema>;
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
export type DeleteEventInput = z.infer<typeof DeleteEventInputSchema>;
export type TestConnectionInput = z.infer<typeof TestConnectionInputSchema>;
export type TestConnectionResult = z.infer<typeof TestConnectionResultSchema>;
export type CalDAVAuthInput = z.infer<typeof CalDAVAuthInputSchema>;
export type CalDAVAuthResult = z.infer<typeof CalDAVAuthResultSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

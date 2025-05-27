/**
 * Main calendar API exports
 * This file exports all calendar business logic functions for use in tRPC routers
 */

// Shared types and schemas
export {
  CalendarError,
  CalendarAuthError,
  CalendarSyncError,
} from "./shared/types";

export type { CalendarProvider } from "./shared/types";

export type {
  AvailableCalendar,
  CalendarSyncResult,
  OAuthUrlResult,
  OAuthCallbackResult,
} from "./shared/schemas";

// Google Calendar
export {
  getGoogleAuthUrl,
  handleGoogleOAuthCallback,
  getAvailableGoogleCalendars,
  addGoogleCalendar,
  syncGoogleCalendars,
  updateGoogleCalendarFeed,
  deleteGoogleCalendarFeed,
} from "./google/index";

export {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "./google/events";

export type {
  GetGoogleAuthUrlInput,
  GoogleOAuthCallbackInput,
  GetAvailableGoogleCalendarsInput,
  AddGoogleCalendarInput,
  SyncGoogleCalendarsInput,
  UpdateGoogleCalendarFeedInput,
  DeleteGoogleCalendarFeedInput,
  CreateGoogleEventInput,
  UpdateGoogleEventInput,
  DeleteGoogleEventInput,
} from "./google/schemas";

// Outlook Calendar
export {
  getOutlookAuthUrl,
  handleOutlookOAuthCallback,
  getAvailableOutlookCalendars,
  addOutlookCalendar,
  syncOutlookCalendars,
  updateOutlookCalendarFeed,
  deleteOutlookCalendarFeed,
} from "./outlook/index";

export {
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
} from "./outlook/events";

export type {
  GetOutlookAuthUrlInput,
  OutlookOAuthCallbackInput,
  GetAvailableOutlookCalendarsInput,
  AddOutlookCalendarInput,
  SyncOutlookCalendarsInput,
  UpdateOutlookCalendarFeedInput,
  DeleteOutlookCalendarFeedInput,
  CreateOutlookEventInput,
  UpdateOutlookEventInput,
  DeleteOutlookEventInput,
} from "./outlook/schemas";

// CalDAV Calendar
export {
  authenticateCalDAV,
  testCalDAVConnection,
  getAvailableCalDAVCalendars,
  addCalDAVCalendar,
  syncCalDAVCalendars,
  updateCalDAVCalendarFeed,
  deleteCalDAVCalendarFeed,
} from "./caldav/index";

export {
  createCalDAVCalendarEvent,
  updateCalDAVCalendarEvent,
  deleteCalDAVCalendarEvent,
} from "./caldav/events";

export type {
  AuthenticateCalDAVInput,
  TestCalDAVConnectionInput,
  GetAvailableCalDAVCalendarsInput,
  AddCalDAVCalendarInput,
  SyncCalDAVCalendarsInput,
  UpdateCalDAVCalendarFeedInput,
  DeleteCalDAVCalendarFeedInput,
  CreateCalDAVEventInput,
  UpdateCalDAVEventInput,
  DeleteCalDAVEventInput,
} from "./caldav/schemas";

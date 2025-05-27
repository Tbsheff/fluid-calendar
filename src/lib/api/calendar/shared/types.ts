/**
 * Shared types for calendar operations across all providers (Google, Outlook, CalDAV)
 */

export type CalendarProvider = "GOOGLE" | "OUTLOOK" | "CALDAV";

export interface CalendarAccount {
  id: string;
  email: string;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  userId: string;
}

export interface CalendarFeed {
  id: string;
  name: string;
  url: string;
  type: CalendarProvider;
  color?: string;
  accountId: string;
  userId: string;
  isEnabled: boolean;
  lastSyncAt?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  status: "confirmed" | "tentative" | "cancelled";
  sequence?: number;
  externalEventId: string;
  organizer?: {
    email: string;
    name?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    status: "accepted" | "declined" | "tentative" | "needsAction";
  }>;
  calendarFeedId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface CalendarSyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors?: string[];
}

export interface AvailableCalendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isPrimary?: boolean;
  accessRole?: string;
}

// Common input types
export interface BaseCalendarInput {
  userId: string;
}

export interface CalendarProviderInput extends BaseCalendarInput {
  provider: CalendarProvider;
}

export interface AccountInput extends BaseCalendarInput {
  accountId: string;
}

export interface CalendarFeedInput extends AccountInput {
  feedId: string;
}

export interface EventInput extends BaseCalendarInput {
  eventId: string;
}

// OAuth flow types
export interface OAuthUrlResult {
  authUrl: string;
  state?: string;
}

export interface OAuthCallbackInput extends BaseCalendarInput {
  code: string;
  state?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  accountId?: string;
  message?: string;
}

// Error types
export class CalendarError extends Error {
  constructor(
    message: string,
    public provider: CalendarProvider,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "CalendarError";
  }
}

export class CalendarAuthError extends CalendarError {
  constructor(message: string, provider: CalendarProvider) {
    super(message, provider, "AUTH_ERROR", 401);
    this.name = "CalendarAuthError";
  }
}

export class CalendarSyncError extends CalendarError {
  constructor(message: string, provider: CalendarProvider) {
    super(message, provider, "SYNC_ERROR", 500);
    this.name = "CalendarSyncError";
  }
}

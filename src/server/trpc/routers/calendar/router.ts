/**
 * Main Calendar tRPC router
 * Combines all calendar providers (Google, Outlook, CalDAV)
 */
import { createTRPCRouter } from "../../trpc";
import { caldavEventsRouter } from "./caldav/events";
import { caldavCalendarRouter } from "./caldav/router";
import { googleEventsRouter } from "./google/events";
import { googleCalendarRouter } from "./google/router";
import { outlookEventsRouter } from "./outlook/events";
import { outlookCalendarRouter } from "./outlook/router";

export const calendarRouter = createTRPCRouter({
  google: googleCalendarRouter,
  googleEvents: googleEventsRouter,

  outlook: outlookCalendarRouter,
  outlookEvents: outlookEventsRouter,

  caldav: caldavCalendarRouter,
  caldavEvents: caldavEventsRouter,
});

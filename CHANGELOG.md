# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Refactored admin status check to use a direct tRPC procedure (`auth.isAdmin`) that inspects session context, instead of a separate API route and library function.
  - Removed `/api/auth/check-admin` route.
  - Removed `checkAdminStatus` function from `@/lib/api/auth`.
  - Removed related `CheckAdminStatusInputSchema` and `AuthError` from `@/lib/api/auth/schemas`.
  - Removed related tRPC input schemas from `server/trpc/routers/auth/schemas.ts`.
  - Updated `useAdmin` hook to use the new `auth.isAdmin` tRPC query.
  - Updated `AuthTest.tsx` to test the new `auth.isAdmin` tRPC query.

### Fixed

- **SetupCheck Hook Error**: Fixed "Invalid hook call" error in SetupCheck component caused by calling `trpc.useUtils()` inside `useEffect`
  - Moved `trpc.useUtils()` call to the component's top level to comply with React's Rules of Hooks
  - Added utils to the useEffect dependency array for proper reactivity
  - Maintained existing functionality while ensuring proper hook usage patterns
- **Calendar Settings Undefined Error**: Fixed "Cannot read properties of undefined (reading 'start')" error in calendar components
  - Enhanced calendar settings defaults handling in Calendar component to ensure `workingHours` is always properly defined
  - Improved object merging pattern to safely handle partial tRPC responses
  - Fixed potential undefined access to `calendarSettings.workingHours.start`, `end`, `enabled`, and `days` properties
  - This fix resolves errors in WeekView, DayView, and other calendar view components that receive settings as props

- **Store Dependencies Refactoring**: Completed migration from deprecated Zustand stores to tRPC
  - Refactored AutoScheduleSettings component to use tRPC instead of deprecated useSettingsStore
  - Refactored SystemSettings component to use tRPC instead of deprecated useSettingsStore  
  - Refactored TaskSyncSettings component to use tRPC instead of deprecated useSettingsStore
  - Refactored EditableCell component to use tRPC for projects instead of deprecated useProjectStore
  - Updated calendar commands to use correct calendar UI store imports
  - Updated task commands to use correct task UI store imports
  - Modified Google Calendar functions to accept timezone as parameter instead of using store
  - Modified Outlook Calendar functions to accept timezone as parameter instead of using store
  - Updated SchedulingService to require AutoScheduleSettings parameter instead of fallback to store
  - Refactored TaskModal component to use tRPC for projects instead of deprecated useProjectStore
  - Added temporary local state fallbacks for TaskList component (TODO: implement proper stores)
  - Fixed SetupCheck component to use tRPC instead of deprecated useSetupStore
  - Fixed SetupForm component to remove deprecated useSetupStore dependency
  - Fixed build errors caused by deprecated store dependencies
  - Removed deprecated store imports from Google and Outlook calendar libraries
  - Removed deprecated store fallback logic from SchedulingService
- **Schema Generation Issue**: Fixed `npm run db:generate` not generating Zod schemas
  - Replaced incompatible `prisma-zod-generator@0.8.13` with `zod-prisma-types@3.2.1`
  - Updated Prisma schema generator configuration to use working provider
  - Updated `src/lib/api/tags/schemas.ts` to use new generated schema format (`TagSchema` instead of `TagCreateInputSchema`/`TagUpdateInputSchema`)
  - All Zod schemas now generate correctly from Prisma models, providing TypeScript type safety
- **Dynamic Import Issues**: Fixed Next.js build errors with dynamic imports using template literals
  - Fixed `src/lib/email/password-reset.ts` to use conditional imports instead of template literal imports
  - Fixed `src/components/calendar/Calendar.tsx` LifetimeAccessBanner dynamic import pattern
  - Created missing `LifetimeAccessBanner.saas.tsx` component file
  - All dynamic imports now work correctly with Next.js static analysis
- **CRITICAL**: Fixed tRPC authentication by implementing proper session extraction from NextAuth JWT tokens
- **CRITICAL**: Fixed infinite re-render loop in EventModal component caused by failed tRPC queries
- Fixed "Maximum update depth exceeded" React error in calendar components
- Fixed "Failed to load feeds from database" errors caused by authentication failures
- **Fixed remaining legacy calendar store usage**: Migrated all remaining components using deprecated `loadFromDatabase()` method to tRPC
  - Fixed WeekView, MonthView, MultiMonthView, and DayView components to use tRPC data from parent Calendar component
  - Fixed AutoScheduleSettings component to use `trpc.feeds.getAll.useQuery()` instead of calendar store
  - Fixed CalendarSettings component to use `trpc.feeds.getAll.useQuery()` instead of calendar store
  - Removed all remaining calls to deprecated `loadFromDatabase()` method
- Improved error handling in EventModal to prevent retry loops on authentication failures
- **Calendar View Components Migration**: Complete migration of all calendar view components from legacy store patterns to prop-driven architecture
  - `src/components/calendar/WeekView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/MonthView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/MultiMonthView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/DayView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/Calendar.tsx`: Updated parent component to fetch all required data via tRPC and pass as props to calendar view components
  - Removed all direct calls to `useTaskStore.getState()`, `useCalendarStore.getState()`, and `useSettingsStore()` methods
  - Converted all components to accept data and mutation handlers as props for full tRPC compatibility
  - Created `CalendarDisplayEvent` interface for FullCalendar event formatting consistency
  - Enhanced type safety with proper TypeScript interfaces and Record<string, unknown> for extendedProps
  - Fixed TypeScript compatibility issues with tag handling (Task.tags → tagIds for tRPC mutations)
  - Build verification: Successful TypeScript compilation, formatting, and linting
- Fixed auto-scheduling to correctly use user's timezone by passing it from `TaskSchedulingService` to `SchedulingService` and then to `TimeSlotManagerImpl`.

### Added

- **Database Seed Script**: Added comprehensive development database seeding

  - Created `prisma/seed.ts` with sample data for all major models
  - Added 3 test users (1 admin, 2 regular users) with complete settings profiles
  - Generated 4 sample projects with different categories (Work, Personal, Learning, Admin)
  - Created 4 color-coded tags (urgent, meeting, research, review)
  - Added 7 realistic tasks with various statuses, priorities, and due dates
  - Included 2 calendar feeds and 3 sample events
  - Added sample subscriptions (FREE and LIFETIME plans)
  - Added npm scripts: `npm run db:seed` and `npm run db:reset`
  - Provides ready-to-use test data for development and testing

- **Frontend tRPC Migration Phase 5 Complete**: Successfully migrated Focus Mode components to tRPC v11

  - **Focus Mode Components Migration**: Complete migration of focus mode functionality to tRPC
    - `src/components/focus/FocusMode.tsx`: Layout component, no migration needed (coordinates other components)
    - `src/components/focus/TaskQueue.tsx`: Uses task store for now, focus mode store handles tRPC integration
    - `src/components/focus/FocusedTask.tsx`: Pure presentation component, no migration needed
    - `src/components/focus/QuickActions.tsx`: Migrated from task store to tRPC hooks for task operations
      - `trpc.tasks.update.useMutation()` for task editing with proper date and status type conversions
      - `trpc.tasks.delete.useMutation()` for task deletion with loading states
      - `trpc.tags.getAll.useQuery()` for tag data fetching
      - `trpc.tags.create.useMutation()` for tag creation
  - **Focus Mode Store Migration**: Added comprehensive deprecation warnings to focus mode store methods
    - `completeCurrentTask()` → `trpc.tasks.update.useMutation()` with status: 'COMPLETED'
    - `postponeTask()` → `trpc.tasks.update.useMutation()` with postponedUntil field
    - Maintained task store integration for backward compatibility with existing focus mode logic
  - **Enhanced User Experience**: Improved error handling with toast notifications, proper loading states, and TypeScript type safety
    - Enhanced task editing with proper date serialization (Date → ISO string)
    - Enhanced task status conversion (TaskStatus enum → tRPC string literals)
    - Enhanced tag handling with null-to-undefined conversions for UI compatibility
  - **Type Safety Improvements**: Proper type conversions between frontend types and tRPC schemas
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Phase 5 of frontend migration complete (Focus Mode components migrated), Phase 6 (Project Components Migration) ready to begin

- **Frontend tRPC Migration Phase 4 Complete**: Successfully migrated Calendar System components to tRPC v11

  - **Calendar Component Migration**: Complete migration of core calendar functionality to tRPC
    - `src/components/calendar/Calendar.tsx`: Migrated from calendar and task stores to `trpc.feeds.getAll.useQuery()`, `trpc.events.getAll.useQuery()`, and `trpc.tasks.scheduleAll.useMutation()`
    - Enhanced auto-scheduling functionality with proper error handling and loading states
    - Improved data hydration with tRPC queries and backward compatibility with calendar views
  - **EventModal Component Migration**: Complete migration of event CRUD operations to tRPC
    - `src/components/calendar/EventModal.tsx`: Migrated from calendar store to calendar-specific event mutations based on calendar type (Google, Outlook, CalDAV)
    - `trpc.calendar.googleEvents.create/update/delete.useMutation()` for Google Calendar events
    - `trpc.calendar.outlookEvents.create/update/delete.useMutation()` for Outlook Calendar events
    - `trpc.calendar.caldavEvents.create/update/delete.useMutation()` for CalDAV events
    - Enhanced error handling with toast notifications and proper parameter validation
  - **AvailableCalendars Component Migration**: Complete migration of calendar provider integration to tRPC
    - `src/components/settings/AvailableCalendars.tsx`: Migrated from direct fetch calls to provider-specific tRPC queries
    - `trpc.calendar.google.getAvailableCalendars.useQuery()` and `trpc.calendar.google.addCalendar.useMutation()` for Google
    - `trpc.calendar.outlook.getAvailableCalendars.useQuery()` and `trpc.calendar.outlook.addCalendar.useMutation()` for Outlook
    - `trpc.calendar.caldav.getAvailableCalendars.useQuery()` and `trpc.calendar.caldav.addCalendar.useMutation()` for CalDAV
    - Enhanced user experience with proper loading states and error feedback
  - **Enhanced User Experience**: Improved error handling with toast notifications, proper loading states, and TypeScript type safety across all calendar components
  - **Type Safety Improvements**: Proper type conversions between tRPC types and frontend types with appropriate casting
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Phase 4 of frontend migration complete (Calendar System components migrated), Phase 5 (Focus Mode Migration) ready to begin

- **Frontend tRPC Migration Phase 4 Started**: Calendar System Migration to tRPC v11

  - **Calendar Store Deprecation**: Added comprehensive deprecation warnings to all calendar store methods directing developers to use tRPC hooks
    - `addFeed()` → `trpc.calendar.google.addCalendar.useMutation()`, `trpc.calendar.outlook.addCalendar.useMutation()`, or `trpc.calendar.caldav.addCalendar.useMutation()`
    - `removeFeed()` → `trpc.calendar.google.deleteFeed.useMutation()`, `trpc.calendar.outlook.deleteFeed.useMutation()`, or `trpc.calendar.caldav.deleteFeed.useMutation()`
    - `toggleFeed()` → `trpc.calendar.google.updateFeed.useMutation()`, `trpc.calendar.outlook.updateFeed.useMutation()`, or `trpc.calendar.caldav.updateFeed.useMutation()`
    - `updateFeed()` → `trpc.calendar.google.updateFeed.useMutation()`, `trpc.calendar.outlook.updateFeed.useMutation()`, or `trpc.calendar.caldav.updateFeed.useMutation()`
    - `addEvent()` → `trpc.calendar.googleEvents.create.useMutation()`, `trpc.calendar.outlookEvents.create.useMutation()`, or `trpc.calendar.caldavEvents.create.useMutation()`
    - `updateEvent()` → `trpc.calendar.googleEvents.update.useMutation()`, `trpc.calendar.outlookEvents.update.useMutation()`, or `trpc.calendar.caldavEvents.update.useMutation()`
    - `removeEvent()` → `trpc.calendar.googleEvents.delete.useMutation()`, `trpc.calendar.outlookEvents.delete.useMutation()`, or `trpc.calendar.caldavEvents.delete.useMutation()`
    - `syncFeed()` → `trpc.calendar.google.syncCalendars.useMutation()`, `trpc.calendar.outlook.syncCalendars.useMutation()`, or `trpc.calendar.caldav.syncCalendars.useMutation()`
    - `loadFromDatabase()` → `trpc.feeds.getAll.useQuery()` and `trpc.events.getAll.useQuery()`
  - **FeedManager Component Migration**: Complete migration of calendar feed management to tRPC
    - `src/components/calendar/FeedManager.tsx`: Migrated from calendar store to `trpc.feeds.getAll.useQuery()`, `trpc.feeds.delete.useMutation()`, `trpc.feeds.update.useMutation()`, and calendar sync mutations
    - Enhanced error handling with toast notifications for all feed operations
    - Improved user experience with proper loading states and error feedback
    - Type-safe calendar sync operations with proper account validation
  - **Migration Progress**: Phase 4 of frontend migration started (Calendar System Migration), FeedManager component migrated

- **Frontend tRPC Migration Phase 3 Complete**: Successfully migrated Log Viewer components to tRPC v11

  - **Log Viewer Components Migration**: Complete migration of log viewing functionality to tRPC
    - `src/components/settings/LogViewer/index.tsx`: Migrated from log view store to `trpc.logs.get.useQuery()`, `trpc.logs.getSources.useQuery()`, and `trpc.logs.cleanup.useMutation()`
    - `src/components/settings/LogViewer/LogFilters.tsx`: Updated to receive sources as prop instead of from store
    - `src/components/settings/LogViewer/LogSettings.tsx`: Already using tRPC (was migrated previously)
    - `src/components/settings/LogViewer/LogTable.tsx`: No changes needed (pure presentation component)
  - **Log View Store Deprecation**: Added comprehensive deprecation warnings to all log view store methods directing developers to use tRPC hooks
  - **Enhanced User Experience**: Improved error handling with toast notifications, proper loading states, and TypeScript type safety
  - **Type Safety Improvements**: Proper transformation of tRPC Date objects to string format for Log type compatibility
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Phase 3 of frontend migration complete (Log Viewer components migrated), Phase 4 (Calendar System Migration) ready to begin

- **Frontend tRPC Migration Phase 2 Complete**: Successfully migrated all settings components to tRPC v11

  - **Settings Store Migration**: Added comprehensive deprecation warnings to all settings store methods directing developers to use tRPC hooks
  - **Settings Components Migration**: Complete migration of all settings functionality to tRPC
    - `src/components/settings/UserSettings.tsx`: Migrated from settings store to `trpc.settings.get.useQuery()` and `trpc.settings.update.useMutation()` with type 'user'
    - `src/components/settings/CalendarSettings.tsx`: Migrated from settings store to `trpc.settings.get.useQuery()` and `trpc.settings.update.useMutation()` with types 'calendar' and 'user'
    - `src/components/settings/NotificationSettings.tsx`: Migrated from settings store to `trpc.settings.get.useQuery()` and `trpc.settings.update.useMutation()` with type 'notification'
    - `src/components/settings/IntegrationSettings.tsx`: Migrated from settings store to `trpc.settings.get.useQuery()` and `trpc.settings.update.useMutation()` with type 'integration'
    - `src/components/settings/DataSettings.tsx`: Migrated from settings store to `trpc.settings.get.useQuery()` and `trpc.settings.update.useMutation()` with type 'data'
  - **Enhanced User Experience**: Improved loading states, error handling with toast notifications, and proper TypeScript type safety
  - **Type Safety Improvements**: Proper casting of tRPC union types to specific Prisma model types for each settings category
  - **Loading States**: Added comprehensive loading and error states for all settings components
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Phase 2 of frontend migration complete (6 settings components migrated), Phase 3 (Log Viewer Migration) ready to begin

- **Frontend tRPC Migration Phase 1 Complete**: Successfully migrated auth and setup components to tRPC v11

  - **Auth Components Migration**: Complete migration of authentication functionality to tRPC
    - `src/components/auth/SignInForm.tsx`: Migrated from direct fetch to `trpc.auth.register.useMutation()` and `trpc.auth.getPublicSignupStatus.useQuery()`
    - `src/components/auth/PasswordResetForm.tsx`: Migrated from direct fetch to `trpc.auth.requestPasswordReset.useMutation()` and `trpc.auth.resetPassword.useMutation()`
  - **Setup Components Migration**: Complete migration of setup functionality to tRPC
    - `src/components/setup/SetupForm.tsx`: Migrated from direct fetch to `trpc.setup.perform.useMutation()`
  - **CalDAV Components Migration**: Partial migration of CalDAV functionality to tRPC
    - `src/components/settings/CalDAVAccountForm.tsx`: Authentication migrated to `trpc.calendar.caldav.authenticate.useMutation()`, test connection functionality temporarily disabled due to tRPC client setup issues
  - **Type Safety & Error Handling**: Enhanced error handling with proper tRPC error patterns and TypeScript integration
  - **Loading States**: Improved loading state management with tRPC's `isPending` status
  - **Migration Progress**: Phase 1 of frontend migration complete (4 components migrated), Phase 2 (Settings Store Migration) ready to begin

- **Auth tRPC Migration**: Complete migration of Auth functionality to tRPC v11

  - **Business Logic Layer**: Enhanced auth API infrastructure with admin status checking
    - `src/lib/api/auth/`: Updated auth business logic with `checkAdminStatus` function
    - Added `CheckAdminStatusInput` schema and `AuthError` class for proper error handling
  - **tRPC Router Implementation**: Auth tRPC integration
    - `src/server/trpc/routers/auth/router.ts`: Added `checkAdminStatus` procedure with protected access
    - `src/server/trpc/routers/auth/schemas.ts`: Added tRPC input validation schemas
  - **Available tRPC Procedures**: 1 new auth procedure
    - **Admin Operations (1)**: `checkAdminStatus` - Check if current user has admin role
  - **Type Safety & Error Handling**: Full TypeScript integration with Zod validation and comprehensive error mapping
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Now 48 out of 54 routes migrated to tRPC (89% complete)

- **CalDAV Calendar tRPC Migration**: Complete migration of CalDAV Calendar functionality to tRPC v11

  - **Business Logic Layer**: Created comprehensive CalDAV Calendar API infrastructure
    - `src/lib/api/calendar/caldav/`: Complete CalDAV Calendar business logic with authentication, calendar management, and event operations
    - `src/lib/api/calendar/caldav/events.ts`: Dedicated event CRUD operations (create, update, delete)
    - Updated `src/lib/api/calendar/index.ts`: Added CalDAV Calendar exports alongside Google and Outlook Calendar
  - **tRPC Router Implementation**: Full CalDAV Calendar tRPC integration
    - `src/server/trpc/routers/calendar/caldav/router.ts`: Main CalDAV Calendar operations (auth, test connection, sync, feed management)
    - `src/server/trpc/routers/calendar/caldav/events.ts`: CalDAV Events operations (create, update, delete)
    - `src/server/trpc/routers/calendar/caldav/schemas.ts`: Comprehensive input validation schemas
    - Updated `src/server/trpc/routers/calendar/router.ts`: Integrated CalDAV routers into main calendar router
  - **Available tRPC Procedures**: 10 total CalDAV procedures
    - **Calendar Operations (7)**: `authenticate`, `testConnection`, `getAvailableCalendars`, `addCalendar`, `syncCalendars`, `updateFeed`, `deleteFeed`
    - **Event Operations (3)**: `create`, `update`, `delete`
  - **Type Safety & Error Handling**: Full TypeScript integration with Zod validation and comprehensive error mapping
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting

- **Outlook Calendar tRPC Migration**: Complete migration of Outlook Calendar functionality to tRPC v11

  - **Business Logic Layer**: Created comprehensive Outlook Calendar API infrastructure
    - `src/lib/api/calendar/outlook/`: Complete Outlook Calendar business logic with OAuth, calendar management, and event operations
    - `src/lib/api/calendar/outlook/events.ts`: Dedicated event CRUD operations (create, update, delete)
    - Updated `src/lib/api/calendar/index.ts`: Added Outlook Calendar exports alongside Google Calendar
  - **tRPC Router Implementation**: Full Outlook Calendar tRPC integration
    - `src/server/trpc/routers/calendar/outlook/router.ts`: Main Outlook Calendar operations (OAuth, sync, feed management)
    - `src/server/trpc/routers/calendar/outlook/events.ts`: Outlook Calendar event operations
    - `src/server/trpc/routers/calendar/outlook/schemas.ts`: tRPC-specific input validation schemas
    - Updated `src/server/trpc/routers/calendar/router.ts`: Added Outlook routers to main calendar router
  - **Available tRPC Procedures**:
    - `trpc.calendar.outlook.getAuthUrl`: Get Outlook OAuth authorization URL
    - `trpc.calendar.outlook.getAvailableCalendars`: List available Outlook calendars
    - `trpc.calendar.outlook.addCalendar`: Add Outlook calendar for syncing
    - `trpc.calendar.outlook.syncCalendars`: Sync Outlook calendar events
    - `trpc.calendar.outlook.updateFeed`: Update calendar feed settings
    - `trpc.calendar.outlook.deleteFeed`: Delete calendar feed
    - `trpc.calendar.outlookEvents.create`: Create Outlook Calendar event
    - `trpc.calendar.outlookEvents.update`: Update Outlook Calendar event
    - `trpc.calendar.outlookEvents.delete`: Delete Outlook Calendar event
  - **Error Handling**: Comprehensive error mapping from calendar errors to tRPC errors with proper HTTP status codes
  - **Type Safety**: Full type safety with Zod validation and TypeScript integration
  - **Authentication**: Protected procedures with user context and proper authorization checks
  - **Migration Progress**: Now 37+ out of 54 routes migrated to tRPC (68.5%+ complete)

- **Google Calendar tRPC Migration**: Complete migration of Google Calendar functionality to tRPC v11

  - **Business Logic Layer**: Created comprehensive calendar API infrastructure
    - `src/lib/api/calendar/shared/`: Shared types, schemas, and error classes for all calendar providers
    - `src/lib/api/calendar/google/`: Complete Google Calendar business logic with OAuth, calendar management, and event operations
    - `src/lib/api/calendar/google/events.ts`: Dedicated event CRUD operations (create, update, delete)
    - `src/lib/api/calendar/index.ts`: Main exports file for all calendar functionality
  - **tRPC Router Implementation**: Full Google Calendar tRPC integration
    - `src/server/trpc/routers/calendar/google/router.ts`: Main Google Calendar operations (OAuth, sync, feed management)
    - `src/server/trpc/routers/calendar/google/events.ts`: Google Calendar event operations
    - `src/server/trpc/routers/calendar/google/schemas.ts`: tRPC-specific input validation schemas
    - `src/server/trpc/routers/calendar/router.ts`: Main calendar router combining all providers
  - **Available tRPC Procedures**:
    - `trpc.calendar.google.getAuthUrl`: Get Google OAuth authorization URL
    - `trpc.calendar.google.getAvailableCalendars`: List available Google calendars
    - `trpc.calendar.google.addCalendar`: Add Google calendar for syncing
    - `trpc.calendar.google.syncCalendars`: Sync Google calendar events
    - `trpc.calendar.google.updateFeed`: Update calendar feed settings
    - `trpc.calendar.google.deleteFeed`: Delete calendar feed
    - `trpc.calendar.googleEvents.create`: Create Google Calendar event
    - `trpc.calendar.googleEvents.update`: Update Google Calendar event
    - `trpc.calendar.googleEvents.delete`: Delete Google Calendar event
  - **Error Handling**: Comprehensive error mapping from calendar errors to tRPC errors with proper HTTP status codes
  - **Type Safety**: Full type safety with Zod validation and TypeScript integration
  - **Authentication**: Protected procedures with user context and proper authorization checks

- **Complete tRPC v11 Migration Infrastructure**: Established comprehensive tRPC setup with React Query integration
  - Server setup with context creation, procedures (public, protected, admin), and error handling
  - Client setup with httpBatchLink, superjson transformer, and React Query integration
  - Root router system for combining domain-specific sub-routers
  - API handler with fetchRequestHandler for Next.js App Router compatibility
- **Tags Domain Migration to tRPC**: Complete migration of tags functionality from REST API to tRPC
  - Migrated all tag operations (CRUD) to tRPC procedures
  - Created business logic layer with proper validation and error handling
  - Implemented tRPC router with protected procedures for authentication
  - Added comprehensive input validation using Zod schemas
  - Created test component to verify tRPC integration works correctly
  - Removed old REST API routes: `/api/tags` and `/api/tags/[id]`
- **Projects Domain Migration to tRPC**: Complete migration of projects functionality from REST API to tRPC

  - Migrated all project operations (CRUD) to tRPC procedures
  - Created business logic layer with proper validation and error handling
  - Implemented tRPC router with protected procedures for authentication
  - Added comprehensive input validation using Zod schemas
  - Created test component to verify tRPC integration works correctly
  - Removed old REST API routes: `/api/projects` and `/api/projects/[id]`

- Added a button to mark tasks as completed directly from the task quick view popup
- Added visual indicator for externally synced tasks in task list view
- Added Stripe configuration file (`src/lib/stripe.saas.ts`) for SAAS payment processing
- Lifetime access purchase feature
  - Added Stripe integration for one-time payments
  - Implemented early bird 50% discount for first 50 purchases
  - Added lifetime access status tracking for users
  - Created webhook handler for Stripe events
  - Added server actions and API routes for purchase flow
- Lifetime access subscription plan with special early bird pricing
- Server actions for handling lifetime access purchases
- Early bird discount for first 50 lifetime subscribers ($200 instead of $400)
- Lifetime Access subscription plan with early bird pricing
  - Early bird offer: $200 for first 50 subscribers
  - Regular price: $400 after early bird period
  - Includes all Pro features with perpetual access
- Lifetime subscription success page with modern design and animations
- New reusable PageHeader component for consistent page headers
- Enhanced payment success flow with session verification
- New success page for lifetime subscription purchases
- API endpoint to verify Stripe checkout sessions
- Refactored the lifetime subscription success page (`src/app/(saas)/subscription/lifetime/success/page.tsx`) to use the new pattern for `searchParams` and `params` as Promise types, updating usages accordingly.
- Added a password setup page at /subscription/lifetime/setup-password for new users after successful payment (SAAS only).
- Updated the 'Set Up Your Account' button on the lifetime success page to redirect to the password setup page.
- The 'Set Up Your Account' button now sends name and email in query params to the password setup page, which displays them if present.
- Implemented backend API route and service for password setup at /subscription/lifetime/setup-password/api (SAAS only).
- Added client service to call the backend API for password setup.
- Integrated password setup form with the backend using Tanstack Query, including loading, error, and success states.
- Made `/subscription/lifetime/success` route public in middleware so it no longer requires authentication after successful payment.
- Made `/subscription/lifetime/setup-password` route public in middleware so users can set their password after payment without authentication.
- Enhanced lifetime subscription success page with automatic user verification and redirection
- Added subscription status verification and automatic updates for existing users
- Improved payment verification with early bird discount detection
- Updated LifetimeSuccessPage and LifetimeSuccessClient to show 'Go to login' or 'Go to Calendar' for existing users after successful lifetime subscription payment, based on whether the user is logged in or not. The setup button is now only shown for new users.
- Added a dismissible "Buy Lifetime Access" banner at the top of the main calendar/dashboard view for SAAS users who have not purchased lifetime access. The banner links to /beta for payment.
- The "Upgrade to Lifetime Access" banner is now only shown if the user does not have a lifetime subscription. Added `/api/subscription/lifetime/status` endpoint for this check.
- Fixed "Upgrade to Lifetime Access" banner to remain hidden initially until verification confirms user doesn't have lifetime access, preventing banner flash for lifetime subscribers
- Added Asia/Karachi to the timezone options in user settings
- Improved calendar rendering performance with Server Components
  - Added server-side pre-fetching of calendar feeds and events data
  - Modified client components to hydrate with server-fetched data
  - Reduced client-side data loading operations and API calls
  - Eliminated loading delay for initial calendar view rendering
- **tRPC Migration Progress**: Successfully migrated Logs, Import/Export, Auth, and Settings Homepage domains to tRPC v11
  - **Logs Domain (5 routes)**: Complete migration with admin-only access controls
    - GET/DELETE `/api/logs` → `trpc.logs.get` / `trpc.logs.delete`
    - POST `/api/logs/batch` → `trpc.logs.batch` (public access for internal logging)
    - POST `/api/logs/cleanup` → `trpc.logs.cleanup`
    - GET/PUT `/api/logs/settings` → `trpc.logs.getSettings` / `trpc.logs.updateSettings`
    - GET `/api/logs/sources` → `trpc.logs.getSources`
  - **Import/Export Domain (2 routes)**: Complete migration with authentication
    - GET `/api/export/tasks` → `trpc.importExport.exportTasks`
    - POST `/api/import/tasks` → `trpc.importExport.importTasks`
  - **Auth Domain (4 routes)**: Partial migration with public procedures
    - GET `/api/auth/public-signup` → `trpc.auth.getPublicSignupStatus`
    - POST `/api/auth/register` → `trpc.auth.register`
    - POST `/api/auth/reset-password/request` → `trpc.auth.requestPasswordReset`
    - POST `/api/auth/reset-password/reset` → `trpc.auth.resetPassword`
    - Note: `/api/auth/[...nextauth]` and `/api/auth/check-admin` remain as API routes due to NextAuth requirements
  - **Settings Homepage (1 route)**: Complete migration with public access
    - GET `/api/settings/homepage-disabled` → `trpc.systemSettings.getHomepageDisabled`
- **Business Logic Layer**: Created comprehensive API layers for both domains with proper validation
- **Test Components**: Added `ImportExportTest.tsx` for testing the new tRPC endpoints
- **Type Safety**: Enhanced type safety with Zod schemas and proper error handling

### Fixed

- **Store Dependencies Refactoring**: Completed migration from deprecated Zustand stores to tRPC
  - Refactored AutoScheduleSettings component to use tRPC instead of deprecated useSettingsStore
  - Refactored SystemSettings component to use tRPC instead of deprecated useSettingsStore  
  - Refactored TaskSyncSettings component to use tRPC instead of deprecated useSettingsStore
  - Refactored EditableCell component to use tRPC for projects instead of deprecated useProjectStore
  - Updated calendar commands to use correct calendar UI store imports
  - Updated task commands to use correct task UI store imports
  - Modified Google Calendar functions to accept timezone as parameter instead of using store
  - Modified Outlook Calendar functions to accept timezone as parameter instead of using store
  - Updated SchedulingService to require AutoScheduleSettings parameter instead of fallback to store
  - Refactored TaskModal component to use tRPC for projects instead of deprecated useProjectStore
  - Added temporary local state fallbacks for TaskList component (TODO: implement proper stores)
  - Fixed SetupCheck component to use tRPC instead of deprecated useSetupStore
  - Fixed SetupForm component to remove deprecated useSetupStore dependency
  - Fixed build errors caused by deprecated store dependencies
  - Removed deprecated store imports from Google and Outlook calendar libraries
  - Removed deprecated store fallback logic from SchedulingService
- **Schema Generation Issue**: Fixed `npm run db:generate` not generating Zod schemas
  - Replaced incompatible `prisma-zod-generator@0.8.13` with `zod-prisma-types@3.2.1`
  - Updated Prisma schema generator configuration to use working provider
  - Updated `src/lib/api/tags/schemas.ts` to use new generated schema format (`TagSchema` instead of `TagCreateInputSchema`/`TagUpdateInputSchema`)
  - All Zod schemas now generate correctly from Prisma models, providing TypeScript type safety
- **Dynamic Import Issues**: Fixed Next.js build errors with dynamic imports using template literals
  - Fixed `src/lib/email/password-reset.ts` to use conditional imports instead of template literal imports
  - Fixed `src/components/calendar/Calendar.tsx` LifetimeAccessBanner dynamic import pattern
  - Created missing `LifetimeAccessBanner.saas.tsx` component file
  - All dynamic imports now work correctly with Next.js static analysis
- **CRITICAL**: Fixed tRPC authentication by implementing proper session extraction from NextAuth JWT tokens
- **CRITICAL**: Fixed infinite re-render loop in EventModal component caused by failed tRPC queries
- Fixed "Maximum update depth exceeded" React error in calendar components
- Fixed "Failed to load feeds from database" errors caused by authentication failures
- **Fixed remaining legacy calendar store usage**: Migrated all remaining components using deprecated `loadFromDatabase()` method to tRPC
  - Fixed WeekView, MonthView, MultiMonthView, and DayView components to use tRPC data from parent Calendar component
  - Fixed AutoScheduleSettings component to use `trpc.feeds.getAll.useQuery()` instead of calendar store
  - Fixed CalendarSettings component to use `trpc.feeds.getAll.useQuery()` instead of calendar store
  - Removed all remaining calls to deprecated `loadFromDatabase()` method
- Improved error handling in EventModal to prevent retry loops on authentication failures
- **Calendar View Components Migration**: Complete migration of all calendar view components from legacy store patterns to prop-driven architecture
  - `src/components/calendar/WeekView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/MonthView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/MultiMonthView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/DayView.tsx`: Migrated from legacy store usage to prop-driven architecture with tRPC compatibility
  - `src/components/calendar/Calendar.tsx`: Updated parent component to fetch all required data via tRPC and pass as props to calendar view components
  - Removed all direct calls to `useTaskStore.getState()`, `useCalendarStore.getState()`, and `useSettingsStore()` methods
  - Converted all components to accept data and mutation handlers as props for full tRPC compatibility
  - Created `CalendarDisplayEvent` interface for FullCalendar event formatting consistency
  - Enhanced type safety with proper TypeScript interfaces and Record<string, unknown> for extendedProps
  - Fixed TypeScript compatibility issues with tag handling (Task.tags → tagIds for tRPC mutations)
  - Build verification: Successful TypeScript compilation, formatting, and linting
- Fixed auto-scheduling to correctly use user's timezone by passing it from `TaskSchedulingService` to `SchedulingService` and then to `TimeSlotManagerImpl`.

## [1.3.0] 2025-03-25

### Added

- Comprehensive bidirectional task synchronization system with support for Outlook
  - Field mapping system for consistent task property synchronization
  - Recurrence rule conversion for recurring tasks
  - Intelligent conflict resolution based on timestamps
  - Support for task priorities and status synchronization
- Password reset functionality with email support for both SAAS and open source versions
- Smart email service with queued (SAAS) and direct (open source) delivery options
- System setting to optionally disable homepage and redirect to login/calendar
- Daily email updates for upcoming meetings and tasks (configurable)
- Resend API key management through SystemSettings

### Changed

- Enhanced task sync manager for true bidirectional synchronization
- Improved date and timezone handling across calendar and task systems
- Moved sensitive credentials from environment variables to SystemSettings
- Replaced Google Fonts CDN with self-hosted Inter font
- Updated API routes to follow NextJS 15 conventions
- Split task sync route into SAAS and open source versions
  - Moved background job-based sync to `route.saas.ts`
  - Created synchronous version in `route.open.ts` for open source edition

### Fixed

- Multiple task synchronization issues:
  - Prevented duplicate task creation in Outlook
  - Fixed task deletion synchronization
  - Resolved bidirectional sync conflicts
  - Fixed task mapping and direction issues
- All-day events timezone and display issues
- Various TypeScript and linter errors throughout the task sync system

### Removed

- Legacy one-way Outlook task import system and related components
- OutlookTaskListMapping model in favor of new TaskListMapping
- RESEND_API_KEY from environment variables

## [1.2.3]

### Added

- Added task start date feature to specify when a task should become active
  - Tasks with future start dates won't appear in focus mode
  - Auto-scheduling respects start dates, not scheduling tasks before their start date
  - Visual indicators for upcoming tasks in task list view
  - Filter option to hide upcoming tasks
  - Ability to sort and filter by start date
- Added week start day setting to Calendar Settings UI to allow users to choose between Monday and Sunday as the first day of the week
- Expanded timezone options in user settings to include a more comprehensive global list fixes #68
- Bulk resend invitations functionality for users with INVITED status
- Added "Resend Invitation" button to individual user actions in waitlist management

### Changed

- Updated email templates to use "FluidCalendar" instead of "Fluid Calendar" for consistent branding
- Refactored task scheduling logic into a common service to reduce code duplication
  - Created `TaskSchedulingService` with shared scheduling functionality
  - Updated both API route and background job processor to use the common service
- Improved SAAS/open source code separation
  - Moved SAAS-specific API routes to use `.saas.ts` extension
  - Renamed NotificationProvider to NotificationProvider.saas.tsx
  - Relocated NotificationProvider to SAAS layout for better code organization
  - Updated client-side code to use the correct endpoints based on version

### Fixed

- Fixed type errors in the job retry API by using the correct compound unique key (queueName + jobId)
- Fixed database connection exhaustion issue in task scheduling:
  - Refactored SchedulingService to use the global Prisma instance instead of creating new connections
  - Updated CalendarServiceImpl and TimeSlotManagerImpl to use the global Prisma instance
  - Added proper cleanup of resources in task scheduling API route
  - Resolved "Too many database connections" errors in production

### Technical Debt

- Added proper TypeScript types to replace `any` types
- Added eslint-disable comments only where absolutely necessary
- Fixed linter and TypeScript compiler errors
- Improved code maintainability with better type definitions
- Added documentation for the job processing system
- Standardized error handling across the codebase

### Removed

- Separate one-way sync methods in favor of a more efficient bidirectional approach

## [1.2.1] 2025-03-13

### Added

- Added login button to SAAS home page that redirects to signin screen or app root based on authentication status
- Added SessionProvider to SAAS layout to support authentication state across SAAS pages
- Added pre-commit hooks with husky and lint-staged to run linting and type checking before commits

### Changed

- Removed Settings option from the main navigation bar since it's already available in the user dropdown menu
- Improved dark mode by replacing black with dark gray colors for better visual comfort and reduced contrast

### Fixed

- Fixed event title alignment in calendar events to be top-aligned instead of vertically centered
- Removed minimum height constraint for all-day events in WeekView and DayView components to improve space utilization
- Made EventModal and TaskModal content scrollable on small screens to ensure buttons remain accessible

## [1.2.0] 2025-03-13

### Added

- Added background job processing system with BullMQ
  - Implemented BaseProcessor for handling job processing
  - Added DailySummaryProcessor for generating and sending daily summary emails
  - Added EmailProcessor for sending emails via Resend
  - Created job tracking system to monitor job status in the database
- Added admin interface for job management
  - Created admin jobs page with statistics and job listings
  - Added ability to trigger daily summary emails for testing
  - Implemented toast notifications for user feedback
- Added Toaster component to the saas layout and admin layout
- Added Redis configuration for job queues
- Added Prisma schema updates for job records
- Added worker process for background job processing
  - Created worker.ts and worker.cjs for running the worker process
  - Added run-worker.ts script for starting the worker
- Added Kubernetes deployment configuration for the worker
- Added Docker configuration for the worker
- Added date utilities for handling timezones in job processing
- Added maintenance job system for database cleanup
  - Implemented MaintenanceProcessor for handling system maintenance tasks
  - Added daily scheduled job to clean up orphaned job records
  - Created cleanup logic to mark old pending jobs as failed
- Centralized email service that uses the queue system for all email sending
- Task reminder processor and templates for sending task reminder emails
- Email queue system for better reliability and performance

### Fixed

- Fixed TypeScript errors in the job processing system:
  - Replaced `any` types with proper type constraints in BaseProcessor, job-creator, and job-tracker
  - Added proper type handling for job data and results
  - Fixed handling of undefined values in logger metadata
  - Added proper error handling for Prisma event system
  - Fixed BullMQ job status handling to use synchronous properties instead of Promise-returning methods
  - Added proper null fallbacks for potentially undefined values
  - Fixed type constraints for job data interfaces
  - Added proper type casting with eslint-disable comments where necessary
- Fixed meeting and task utilities to use proper date handling
- Fixed worker deployment in CI/CD pipeline
- Fixed job ID uniqueness issues by implementing UUID generation for all queue jobs
  - Resolved unique constraint violations when the same job ID was used across different queues
  - Replaced console.log calls with proper logger usage in worker.ts
- Fixed job tracking reliability issues
  - Reordered operations to create database records before adding jobs to the queue
  - Improved error handling and logging for job tracking operations
  - Added automated cleanup for orphaned job records
- Improved error handling in email sending process
- Reduced potential for rate limiting by queueing emails

### Changed

- Updated job tracking system to be more robust:
  - Improved error handling in job tracker
  - Added better type safety for job data and results
  - Enhanced logging with proper null fallbacks
  - Improved job status detection logic
  - Changed job creation sequence to ensure database records exist before processing begins
  - Added daily maintenance job to clean up orphaned records
- Updated GitHub workflow to include worker deployment
- Updated Docker Compose configuration to include Redis
- Updated package.json with new dependencies for job processing
- Updated tsconfig with worker-specific configuration
- Refactored date utilities to be more consistent
- Improved API routes for job management
- Enhanced admin interface with better job visualization
- Refactored all direct email sending to use the queue system
- Updated waitlist email functions to use the new email service

### Security

- Added Stripe webhook signature verification
- Secure handling of payment processing
- Protected routes with authentication checks

## [0.1.0] - 2024-04-01

### Added

- Initial release

### Technical Improvements

- **Enhanced Type Safety**: Full TypeScript inference across client-server boundary
- **Improved Developer Experience**: Automatic API documentation and IntelliSense
- **Centralized Error Handling**: Consistent error responses with proper HTTP status codes
- **Input Validation**: Comprehensive Zod schema validation for all API inputs
- **Business Logic Separation**: Clean separation between API layer and business logic
- **Test Components**: Created test components for verifying tRPC integration

### Architecture

- **Layered Architecture**: Frontend (React Components) → tRPC Layer (Routers & Procedures) → Backend API/Business Logic Layer → Database & Generated Schemas
- **Migration Pattern Established**: Standardized approach for migrating remaining API routes
- **Backward Compatibility**: Maintained existing functionality while improving architecture

### Progress Summary

- ✅ **9 API routes migrated** (Tasks: 4, Events: 2, Feeds: 3)
- ✅ **46 remaining routes** to be migrated following established pattern
- ✅ **tRPC infrastructure** fully operational and tested
- ✅ **Type-safe API communication** established across all migrated domains

### Next Steps

- Continue domain-by-domain migration following established pattern
- Migrate Settings, Task Sync, Logging, and remaining domains
- Update frontend components to use tRPC hooks instead of direct API calls
- Implement optimistic updates and enhanced caching strategies

### Changed

- **tRPC Backend Migration Complete (94.4%)**: Successfully migrated the functionality of 51 out of 54 original API routes to tRPC v11, resulting in 95 tRPC procedures across 15 domains. The remaining 3 API routes (`/api/auth/[...nextauth]`, `/api/calendar/google` callback, `/api/calendar/outlook` callback) will remain as standard API routes due to technical requirements (NextAuth integration, external OAuth provider redirects). This phase focused on backend migration; frontend components will be updated to use tRPC in a subsequent phase.

- **Frontend tRPC Migration Continued**: Migrated additional high-priority components to use tRPC hooks
  - **TasksPage Component**: Fully migrated from Zustand store methods to tRPC hooks
    - Replaced `useTaskStore` methods with `trpc.tasks.*` and `trpc.tags.*` hooks
    - Added proper type conversions between frontend enums and tRPC schemas
    - Implemented optimistic updates and error handling
    - TaskModal, TaskList, and BoardView components now use tRPC through parent callbacks
  - **Settings Components Migration**: Migrated core settings components to tRPC
    - **AccountManager**: Migrated from direct fetch to `trpc.integrationStatus.get.useQuery()`
    - **SystemSettings**: Migrated from direct fetch to `trpc.systemSettings.*` hooks with proper null-to-undefined conversions
    - **PublicSignupSettings**: Migrated from direct fetch to `trpc.systemSettings.*` hooks
    - **LogSettings**: Migrated from direct fetch to `trpc.logs.getSettings/updateSettings` hooks with proper type casting
  - **Store Deprecation Warnings**: Added deprecation warnings to task and project stores directing developers to use tRPC hooks
  - **Type Safety Improvements**: Enhanced type safety with proper conversions between Prisma types and frontend interfaces
- **Frontend Migration Progress**: 6 high-priority components now using tRPC (TasksPage + 4 settings components + AccountManager)
- **Task Management**: Complete tRPC integration for all task-related operations
- **Settings Management**: Core system settings now fully integrated with tRPC

- **Frontend tRPC Migration Phase 6 Complete**: Successfully migrated Project Components to tRPC v11

  - **Project Components Migration**: Complete migration of all project management functionality to tRPC
    - `src/components/projects/ProjectModal.tsx`: Migrated from project store to `trpc.projects.create.useMutation()` and `trpc.projects.update.useMutation()`
      - Enhanced error handling with toast notifications and proper logging
      - Improved loading states with tRPC's `isPending` status
      - Fixed parameter structure to match tRPC schemas (using `id` instead of `projectId`)
    - `src/components/projects/DeleteProjectDialog.tsx`: Migrated from project store to `trpc.projects.delete.useMutation()`
      - Enhanced error handling with toast notifications and proper logging
      - Improved user experience with loading states and error feedback
      - Fixed parameter structure to match tRPC schemas
    - `src/components/projects/ProjectSidebar.tsx`: Completed migration from project and task stores to tRPC hooks
      - `trpc.projects.getAll.useQuery()` for fetching projects with task counts
      - `trpc.tasks.getAll.useQuery({})` for fetching tasks to calculate unassigned task counts
      - Maintained existing task sync functionality that was already migrated to tRPC
      - Enhanced error handling with toast notifications for data fetching errors
      - Improved type safety with proper casting of tRPC types to frontend types
  - **Enhanced User Experience**: Improved error handling with toast notifications, proper loading states, and TypeScript type safety across all project components
  - **Type Safety Improvements**: Proper type conversions between tRPC types and frontend types with appropriate casting for ProjectWithCount to Project
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Phase 6 of frontend migration complete (Project Components migrated), Phase 7 (DnD Components Migration) ready to begin

- **Frontend tRPC Migration Phase 7 Complete**: Successfully migrated DnD (Drag and Drop) System to tRPC v11

  - **DnD System Migration**: Complete migration of drag and drop functionality to tRPC
    - `src/components/dnd/DndProvider.tsx`: Migrated from deprecated store methods to tRPC hooks for task project assignment
      - Replaced `useTaskStore()` with `trpc.tasks.update.useMutation()` for updating task project assignments
      - Replaced `useProjectStore()` with `trpc.useUtils()` for cache invalidation and data refetching
      - Enhanced error handling with toast notifications and proper logging for drag and drop operations
      - Improved user experience with comprehensive logging of drag and drop events
      - Maintained optimistic update behavior while ensuring data consistency
    - `src/components/dnd/useDragAndDrop.ts`: No changes needed (pure wrapper hooks around @dnd-kit/core)
    - Enhanced drag and drop operations with proper error recovery and user feedback
  - **Enhanced User Experience**: Improved error handling with toast notifications, comprehensive logging, and proper cache invalidation
  - **Type Safety Improvements**: Full TypeScript integration with proper tRPC parameter structure
  - **Build Verification**: Successful TypeScript compilation, formatting, and linting
  - **Migration Progress**: Phase 7 of frontend migration complete (DnD System migrated), Phase 8 (Store Cleanup) ready to begin

- **Frontend tRPC Migration Phase 8 Complete**: Successfully completed migration of all calendar view components and parent Calendar component to tRPC
  - All calendar view components (WeekView, MonthView, MultiMonthView, DayView) now use prop-driven architecture with tRPC compatibility
  - Parent Calendar component updated to fetch all required data via tRPC queries and pass as props to child components
  - All legacy Zustand store usage fully removed from calendar view components
  - All CRUD and lookup operations now use tRPC mutations and parent-provided props
  - Fixed TypeScript compatibility issues with tag handling for proper tRPC integration
  - This completes the frontend migration to tRPC for all major calendar/task UI components

- **Phase 9: Hybrid State Management Implementation (In Progress)**: Implementing best practice approach with UI state in Zustand, server state in tRPC
  - **Approach**: Keep UI state management in Zustand stores, use tRPC exclusively for server state (follows React/Next.js best practices)
  - **Created minimal UI-only stores**:
    - `src/store/ui.ts` - Global UI state (modal open/close, sidebar state, hydration)
    - `src/store/calendar-ui.ts` - Calendar-specific UI state (current date, view mode, navigation)
    - `src/store/task-ui.ts` - Task page UI state (view mode, modal state, project filtering)
  - **Updated major components**:
    - Calendar component now uses calendar UI store for view state, tRPC for data
    - Layout component uses global UI store for shortcuts modal
    - Tasks page uses task UI store for view preferences and modal state
  - **Benefits**: Clear separation of concerns, persistent UI state, no prop drilling for UI state, optimal caching and mutations via tRPC
  - **Remaining**: Fix remaining components importing deleted stores, complete migration of all UI state to appropriate stores

### Added
- Proper Prisma enum definitions for TaskStatus, Priority, EnergyLevel, TimePreference, and ProjectStatus
- Enum validation in generated Zod schemas instead of generic string validation

### Changed
- Updated TypeScript enums to use uppercase values for consistency with Prisma enums
- Task and Project models now use proper enum types instead of String fields
- BoardView component fixed to use correct task UI store properties
- AutoScheduleSettings component migrated from deprecated stores to tRPC
- All color mapping objects updated to use uppercase enum keys
- API and tRPC schemas updated to use uppercase enum values
- Seed file updated to use proper Prisma enum values

### Fixed
- **CRITICAL**: Completed enum consistency fixes across the entire application
  - Added ANYTIME value to TimePreference enum in Prisma schema for better UX
  - Fixed Priority enum schema validation in API and tRPC layers
  - Updated import/export functionality with proper enum type casting and validation
  - Fixed TimeSlotManager service to remove deprecated settings store dependency
  - Updated all UI components to support ANYTIME time preference with proper color mapping
- Enum type consistency across Prisma schema, TypeScript types, and generated schemas
- Task UI store property access in BoardView component
- Type safety for enum values throughout the application
- Color mapping for energy levels, time preferences, and task statuses
- Project status enum consistency between frontend and backend
- **Build Success**: Application now builds successfully with full enum type safety

### Removed
- Deprecated store dependencies from settings components
- Unused store properties from task UI components
- Inconsistent enum value mappings

### Technical Debt
- All enum consistency issues have been resolved across the application

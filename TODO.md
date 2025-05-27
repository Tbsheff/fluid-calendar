# IMPORTANT

- pending waitlist - need a way to resend emails with new tokens or for users that signup again to get a new email
- synced tasks are not set to auto-schedule by default
- hide upcoming tasks not working
- project sidebar edit/sync not shown properly in production when project name is too long
- check out this comment https://www.reddit.com/r/selfhosted/comments/1irj353/comment/mjgcajo/?%24deep_link=true&correlation_id=ca91f555-ee0e-5331-bd75-473ac484ff09&ref=email_comment_reply&ref_campaign=email_comment_reply&ref_source=email&%243p=e_as&_branch_match_id=1262094978557361170&utm_medium=Email+Amazon+SES&_branch_referrer=H4sIAAAAAAAAA32O0WqEMBBFv8Z9U1djut2ClELb3wjZZKJjYxImEelLv70j9bkwgZs75zJ3LiXll7YlsBZLo1NqPIavVqTXqh9EGkHpfGEZCScM2quN%2FDgfqUq8Vf0nz77vzZk3cWWD%2BGXwbo65gOUP2yuEkll2SIuQgpXzG1qjPQSrSWFWIe4qJggqx40MMLIuk9FLPM4IviT7wQIkdTSsxHuhjaEnE4nA64IxKLTsG33vnJSyBrhCLYXo6oe9yXq4CW2G58G5651zBI5hWDV6dRZUBMl%2F%2F%2B2U0WvSOIV%2FobPqiVx%2B2AMiDJN6UNwz0PhhJ%2FgFVuHGA2YBAAA%3D
-

## Frontend tRPC Migration Progress

### Phase 1: Simple Component Migrations ✅ COMPLETED

- [x] Auth Components: SignInForm.tsx, PasswordResetForm.tsx
- [x] Setup Components: SetupForm.tsx
- [x] CalDAV Components: CalDAVAccountForm.tsx (partial - test connection disabled)

### Phase 2: Settings Store Migration ✅ COMPLETED

- [x] Added deprecation warnings to all settings store methods
- [x] Migrated UserSettings.tsx to tRPC hooks
- [x] Migrated CalendarSettings.tsx to tRPC hooks
- [x] Migrated NotificationSettings.tsx to tRPC hooks
- [x] Migrated IntegrationSettings.tsx to tRPC hooks
- [x] Migrated DataSettings.tsx to tRPC hooks
- [x] Enhanced error handling with toast notifications
- [x] Improved loading states with proper TypeScript types
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 3: Log Viewer Migration ✅ COMPLETED

- [x] LogViewer/LogSettings.tsx - Already using tRPC (was migrated previously)
- [x] LogViewer/index.tsx - Migrated from store to tRPC hooks for log fetching and cleanup
- [x] LogViewer/LogTable.tsx - No changes needed (pure presentation component)
- [x] LogViewer/LogFilters.tsx - Updated to receive sources as prop instead of from store
- [x] LogViewStore deprecation - Added comprehensive deprecation warnings to all store methods
- [x] Enhanced error handling with toast notifications and proper TypeScript types
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 4: Calendar System Migration ✅ COMPLETED

- [x] Calendar.tsx - Core calendar component migration ✅
- [x] EventModal.tsx - Event CRUD operations to tRPC ✅
- [x] FeedManager.tsx - Calendar feed management to tRPC ✅
- [x] AvailableCalendars.tsx - Calendar provider integration to tRPC ✅
- [x] Calendar store deprecation warnings added ✅
- [x] Enhanced error handling with toast notifications and proper TypeScript types
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 5: Focus Mode Migration ✅ COMPLETED

- [x] FocusMode.tsx - Layout component, no migration needed (uses other components)
- [x] TaskQueue.tsx - Uses task store for now, focus mode store handles tRPC integration
- [x] FocusedTask.tsx - Pure presentation component, no migration needed
- [x] QuickActions.tsx - Migrated from task store to tRPC hooks for task operations
- [x] Focus Mode Store - Added deprecation warnings and maintained task store integration
- [x] Enhanced error handling with toast notifications and proper TypeScript types
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 6: Project Components Migration ✅ COMPLETED

- [x] ProjectModal.tsx - Project CRUD operations to tRPC
- [x] ProjectSidebar.tsx - Already migrated task sync, complete remaining operations
- [x] DeleteProjectDialog.tsx - Project deletion to tRPC
- [x] Enhanced error handling with toast notifications and proper TypeScript types
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 7: DnD System Migration ✅ COMPLETED

- [x] DndProvider.tsx - Migrated from deprecated store methods to tRPC hooks for task project assignment
- [x] useDragAndDrop.ts - No changes needed (pure wrapper hooks around @dnd-kit/core)
- [x] Enhanced error handling with toast notifications and comprehensive logging
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 8: Calendar View Components Migration ✅ COMPLETED

- [x] WeekView.tsx - Migrated from legacy store patterns to prop-driven architecture with tRPC compatibility
- [x] MonthView.tsx - Migrated from legacy store patterns to prop-driven architecture with tRPC compatibility
- [x] MultiMonthView.tsx - Migrated from legacy store patterns to prop-driven architecture with tRPC compatibility
- [x] DayView.tsx - Migrated from legacy store patterns to prop-driven architecture with tRPC compatibility
- [x] Update parent Calendar component to fetch all required data via tRPC and pass as props
- [x] Enhanced error handling with toast notifications and proper TypeScript types
- [x] Build verification: TypeScript compilation, formatting, and linting

### Phase 9: Hybrid State Management Implementation 🚧 IN PROGRESS

**Approach**: Keep UI state in Zustand stores, server state in tRPC (best practice)

**Completed:**
- [x] Created minimal UI-only stores:
  - `src/store/ui.ts` - Global UI state (modals, sidebar)
  - `src/store/calendar-ui.ts` - Calendar view state (date, view mode, sidebar)
  - `src/store/task-ui.ts` - Task page state (view mode, modal, project filter)
- [x] Updated Calendar component to use calendar UI store
- [x] Updated layout to use global UI store
- [x] Updated tasks page to use task UI store

**Remaining:**
- [ ] Fix remaining components importing deleted stores:
  - EventModal.tsx (settings store)
  - FeedManager.tsx (calendar store)
  - FocusMode components (focusMode store)
  - Other components with store imports
- [ ] Remove deprecated server-state methods from any remaining stores
- [ ] Clean up unused imports and dependencies
- [ ] Verify all components use tRPC for server state, stores for UI state only
- [ ] Run comprehensive tests to ensure no regressions

### Phase 10: Final Cleanup & Testing (3-4 hours, Low Risk)

- [ ] Remove all direct API fetch calls
- [ ] Update error handling patterns
- [ ] Performance optimization
- [ ] Comprehensive testing

**Current Status**: Phase 9 in progress - Implementing hybrid state management approach with UI-only stores for client state and tRPC for server state. Created new minimal stores (ui.ts, calendar-ui.ts, task-ui.ts) and updated major components to use them.

## tRPC Migration Progress

### Phase 1: Business Logic Layer ✅ COMPLETED

- [x] Shared calendar infrastructure (types, schemas, error classes)
- [x] Google Calendar business logic (OAuth, calendar management, sync operations)
- [x] Google Calendar events operations (create, update, delete)
- [x] Outlook Calendar business logic (OAuth, calendar management, sync operations)
- [x] Outlook Calendar events operations (create, update, delete)

### Phase 2: tRPC Router Implementation ✅ COMPLETED (Google & Outlook)

- [x] Google Calendar Router with 6 procedures:
  - `getAuthUrl`, `getAvailableCalendars`, `addCalendar`, `syncCalendars`, `updateFeed`, `deleteFeed`
- [x] Google Events Router with 3 procedures:
  - `create`, `update`, `delete`
- [x] Outlook Calendar Router with 6 procedures:
  - `getAuthUrl`, `getAvailableCalendars`, `addCalendar`, `syncCalendars`, `updateFeed`, `deleteFeed`
- [x] Outlook Events Router with 3 procedures:
  - `create`, `update`, `delete`
- [x] Main calendar router integration
- [x] TypeScript compilation verification
- [x] Code quality verification (format, lint, build)

### Phase 3: CalDAV Migration ✅ COMPLETED

- [x] CalDAV Calendar business logic (auth, calendar management, sync operations)
- [x] CalDAV Events business logic (create, update, delete)
- [x] CalDAV Calendar Router with 7 procedures:
  - `authenticate`, `testConnection`, `getAvailableCalendars`, `addCalendar`, `syncCalendars`, `updateFeed`, `deleteFeed`
- [x] CalDAV Events Router with 3 procedures:
  - `create`, `update`, `delete`
- [x] Main calendar router integration
- [x] TypeScript compilation verification
- [x] Code quality verification (format, lint, build)

### Phase 4: Auth Migration ✅ COMPLETED

- [x] Auth business logic (`checkAdminStatus`)
- [x] Auth tRPC router with 1 procedure:
  - `checkAdminStatus`
- [x] TypeScript compilation verification
- [x] Code quality verification (format, lint, build)

**Current Status**: 51 out of 54 API routes' functionality is now handled by tRPC (94.4% complete).

### Final Migration Status ✅ EFFECTIVELY COMPLETE

**Functionality of 51 original API routes is now provided by tRPC, resulting in 95 tRPC procedures across the following domains:**

- Accounts: 2 procedures
- Auth: 5 procedures
- Calendar (Google, Outlook, CalDAV, including events): 28 procedures
- Generic Events (non-calendar): 5 procedures
- Feeds: 6 procedures
- Import/Export: 2 procedures
- Integration Status: 1 procedure
- Logs: 7 procedures
- Projects: 5 procedures
- Generic Settings: 2 procedures
- Setup: 2 procedures
- System Settings: 6 procedures
- Tags: 5 procedures
- Task Sync: 12 procedures
- Tasks: 7 procedures

**Remaining API Routes (3 original API routes' functionality remains solely as API routes due to technical requirements):**

- `/api/auth/[...nextauth]` - NextAuth requirement
- `/api/calendar/google` - OAuth callback (external service requirement)
- `/api/calendar/outlook` - OAuth callback (external service requirement)

## Task Sync Phase 1 Tasks

1. **Database Schema Changes**

   - [x] Create the `TaskProvider` model in schema.prisma
   - [x] Create the `TaskListMapping` model to replace `OutlookTaskListMapping`
   - [x] Create the `TaskSync` model
   - [x] Add indexes for efficient lookup
   - [x] Update the `Task` model with additional sync fields
   - [x] Update the `Project` model with sync-related fields
   - [x] Create a migration for the schema changes

2. **Core Interfaces and Classes**

   - [x] Create `src/lib/task-sync/providers/task-provider.interface.ts`
   - [x] Create `src/lib/task-sync/task-sync-manager.ts`
   - [x] Create `src/lib/task-sync/task-change-tracker.ts`
   - [x] Create helper utilities for mapping between providers
   - [x] Fix TypeScript type issues in task sync related files

3. **Outlook Provider Implementation**

   - [x] Create `src/lib/task-sync/providers/outlook-provider.ts`
   - [x] Port existing functionality from `OutlookTasksService`
   - [x] Implement the one-way sync from Outlook to FluidCalendar
   - [ ] Add support for task list mapping

4. **API Endpoints**

   - [x] Create provider management endpoints
   - [x] Create mapping management endpoints
   - [x] Create sync trigger endpoints
   - [x] Update API endpoints to follow project authentication patterns
   - [x] Implement task list fetching endpoint for external providers

5. **Background Jobs**

   - [x] Set up BullMQ job queue for task synchronization
   - [x] Create job processor for task sync operations
   - [x] Fix TypeScript issues in task sync processor
   - [x] Implement scheduler for periodic sync jobs

6. **UI Components**

   - [x] Create settings UI for task providers
   - [x] Build task list mapping UI
   - [x] Add provider account email resolution for better user experience
   - [ ] Add sync status indicators
   - [x] Implement comprehensive error handling in UI

7. **Data Migration** (No longer needed - decided to skip migration)

   - ~~[x] Write migration script to move existing Outlook task mappings~~
   - ~~[x] Create admin API endpoint to trigger migration~~
   - ~~[x] Create admin UI for triggering and monitoring migration~~

8. **Next Steps**
   - [x] Test complete workflow from adding provider to auto-syncing tasks
   - [ ] Implement sync status indicators
     - [ ] Add visual indicators for sync status in task components
     - [ ] Display last sync time and status in project details
     - [ ] Create toast notifications for sync events
   - [ ] Implement bi-directional sync (Phase 2)
     - [x] Enhance TaskChangeTracker to record local task changes
     - [x] Create TaskChange database model for change tracking
     - [x] Update API endpoints to track task changes
     - [x] Update TaskSyncManager to support bidirectional sync flow
     - [x] Implement change detection comparing local and remote task states
     - [x] Add methods to push local changes to providers
     - [x] Update OutlookProvider with create/update/delete task methods
     - [x] Update TaskListMapping to respect sync direction setting
     - [ ] Implement conflict detection mechanisms
     - [ ] Create conflict resolution strategies (latest wins, merge, manual)
     - [ ] Add API endpoints for conflict resolution
     - [ ] Test bidirectional sync with various scenarios
   - [ ] Add Google Tasks provider (Phase 2)
   - [x] Verify one-way sync functionality

# FluidCalendar Implementation Plan

# Random Tasks

- [ ] 2-way task sync see [sync document](docs/task-sync.md)
- [ ] add a calculator comparing motion to FC
- [ ] add a sidebar thingy in open to tell them to move to saas
- [ ] auto schedule working hours in settings using 24 instead am/pm
- [ ] improve task lists and focus view see [tasklist](docs/tasklist-enhancements.md)
  - [ ] add view for scheduled tasks and over due or saved views
- [ ] use task-reminder job for sending reminders
- [ ] cron job to cleanup logs
- [ ] cron job to expire waitlist verifications
- [ ] support attendees
- [ ] support event notifications
- [ ] add localization for date formatting
- [ ] share availability
- [ ] use SSE throughout to improve sync performance
- [ ] use database for sysconfig instead of infisical

# CalDAV Implementation

## Phase 3: Calendar Synchronization (Pending)

- [ ] Implement two-way sync with change tracking

## Phase 4: Advanced Features (Pending)

- [ ] Support for CalDAV collections
- [ ] Handle different calendar permissions
- [ ] Implement free/busy status
- [ ] Add support for calendar sharing

# Focus Mode

# Focus Mode

## Focus Mode Implementation

- [ ] fix keyboard shortcuts
- [ ] in taskmodal make the tags more obvious if they are selected
- [ ] Daily Email

# BUG

- [ ] if i have a bunch of tasks that have isautoscheduled false and i click autoschedule the UI updates with a blank list because no tasks are returned. i have to refresh the page to get the tasks.
- [ ] auto scheduling is creating task in the past (it might be off by one day)
- [ ] auto scheduling did not schedule high priority tasks first
- [ ] save task completed date and sync it with outlook
- [ ] deleteing a recurring event from quickview doens't work well and doesn't ask me if i want to delete the series or just the instance.

# Misc

# Misc

## Next Steps

- [ ] Integrate google calendar
  - [ ] auto sync with webhooks
  - [ ] when deleting one event from the series, it deletes all instances locally but google is working fine.
- [ ] prevent adding events to read-only calendars
- [ ] allow changing calendar color
- [ ] allow calendar re-ordering in the UI
- [ ] when deleting a recurring event, it deletes all instances but it shows a random instance which disappears after a sync, also i tried it again and it only deleted the instance locally but the entire series deleted from google.
- [ ] add ability to RSVP
- [ ] show events not RSVPed to
- [ ] show spinner when deleting/creating/updating in event modal
- [ ] Use AI to break down tasks
- [ ] recurring tasks don't indicate that it's recurring
- [ ] Ability to add tasks in calendar view

## Focus Mode Enhancements (Future)

- [ ] Add focus session analytics
  - [ ] Track time spent in focus mode
  - [ ] Record tasks completed per session
  - [ ] Visualize productivity patterns
- [ ] Implement custom focus modes
  - [ ] Deep work mode (2+ hour sessions)
  - [ ] Quick task mode (15-30 minute sessions)
  - [ ] Meeting preparation mode
- [ ] Add Pomodoro technique integration
  - [ ] Configurable work/break intervals
  - [ ] Break reminders
  - [ ] Session statistics

## Outlook sync issues

- [ ] deleting one instance doesn't sync correctly
- [ ] add real-time updates with webhooks
- [ ] implement offline support

## Tasks

- [ ] task dependencies

## 1. Core Calendar Features

- [ ] Calendar Grid Component
  - [ ] Add month view layout
  - [ ] Implement day view layout
  - [ ] Add navigation between days/weeks/months

## 2. Task Management

- [ ] Task Data Structure
  - [ ] Define task interface (title, description, date, duration, status, etc.)
  - [ ] Create task store using Zustand
  - [ ] Implement CRUD operations for tasks
- [ ] Task UI Components
  - [ ] Create task card component
  - [ ] Add task creation modal
  - [ ] Implement task edit modal
  - [ ] Add task details view
  - [ ] Create task list view in sidebar

## 3. Drag and Drop Features

- [ ] Task Rescheduling
  - [ ] Enable drag and drop between time slots
  - [ ] Add visual feedback during drag
  - [ ] Implement time snapping
  - [ ] Handle task duration during drag
- [ ] Task List Reordering
  - [ ] Allow reordering in list view
  - [ ] Sync order changes with store

## 4. Smart Features

- [ ] Task Auto-scheduling
  - [ ] Implement algorithm for finding free time slots
  - [ ] Add priority-based scheduling
  - [ ] Consider task dependencies
- [ ] Time Blocking
  - [ ] Add ability to block out time
  - [ ] Create different block types (focus, meeting, break)
  - [ ] Allow recurring blocks

## 5. Data Persistence

- [ ] Local Storage
  - [ ] Save tasks to localStorage
  - [ ] Implement data migration strategy
- [ ] State Management
  - [ ] Set up Zustand stores
  - [ ] Add undo/redo functionality
  - [ ] Implement data synchronization

## 6. UI/UX Improvements

- [ ] Animations
  - [ ] Add smooth transitions between views
  - [ ] Implement task drag animation
  - [ ] Add loading states
- [ ] Keyboard Shortcuts
  - [ ] Navigation shortcuts
  - [ ] Task creation/editing shortcuts
  - [ ] View switching shortcuts
- [ ] Responsive Design
  - [ ] Mobile-friendly layout
  - [ ] Touch interactions
  - [ ] Adaptive UI based on screen size

## 7. Advanced Features

- [ ] Dark Mode
  - [ ] Implement theme switching
  - [ ] Add system theme detection
- [ ] Calendar Integrations
  - [ ] Google Calendar sync
  - [ ] iCal support
  - [ ] External calendar subscriptions
- [ ] Task Categories
  - [ ] Add custom categories
  - [ ] Color coding
  - [ ] Category-based filtering

## 8. Performance Optimization

- [ ] Component Optimization
  - [ ] Implement virtualization for long lists
  - [ ] Add lazy loading for views
  - [ ] Optimize re-renders
- [ ] State Management
  - [ ] Add request caching
  - [ ] Implement optimistic updates
  - [ ] Add error boundaries

## 9. Testing

- [ ] Unit Tests
  - [ ] Test core utilities
  - [ ] Test state management
  - [ ] Test UI components
- [ ] Integration Tests
  - [ ] Test user flows
  - [ ] Test data persistence
  - [ ] Test drag and drop functionality

## 10. Documentation

- [ ] Code Documentation
  - [ ] Add JSDoc comments
  - [ ] Document component props
  - [ ] Create usage examples
- [ ] User Documentation
  - [ ] Write user guide
  - [ ] Add keyboard shortcut reference
  - [ ] Create onboarding guide

## Implementation Order:

1. Database schema and migrations
2. Core logger service updates
3. API endpoints
4. Settings UI and commands
5. Testing and documentation

## Next Steps

1. Implement the calendar grid component
2. Add basic task management
3. Implement drag and drop functionality
4. Add data persistence
5. Enhance UI with animations and responsive design

## Calendar Sync and Auto-scheduling

- [ ] Implement background sync system
  - [ ] Create useCalendarSync custom hook
  - [ ] Add sync status indicators in UI
  - [ ] Implement error handling and retry logic
  - [ ] Add manual sync trigger to command registry
  - [ ] Add sync preferences to settings
  - [ ] Implement proper cleanup on unmount
  - [ ] Add visual indicators for sync status
  - [ ] Add sync error notifications

## Task Synchronization Phase 2 Next Steps

- [x] Implement bidirectional sync capability (FC ↔ Provider)
- [x] Add UI for changing sync direction
- [x] Update sync controller to handle direction parameter
- [ ] Implement conflict resolution strategies for bidirectional sync
- [ ] Add change tracking for local tasks to support outgoing sync
- [ ] Add TaskSyncManager methods for external task operations
- [ ] Implement full sync logic (vs. incremental sync)
- [ ] Add sync scheduling based on provider settings
- [ ] Implement proper error handling and notification system
- [ ] Add proper status tracking and display in UI

## Lifetime Access Feature

- [ ] Add UI indicator for remaining early bird slots
- [ ] Implement email notifications for successful lifetime access purchases
- [ ] Add admin dashboard metrics for lifetime access conversions
- [ ] Create documentation for lifetime access subscription management
- [ ] Set up monitoring for early bird quota tracking

# tRPC Migration TODO List

## Phase 1: Calendar Business Logic Layer ✅ COMPLETED (Google)

- [x] 1.1 Create shared calendar infrastructure
  - [x] Create `src/lib/api/calendar/shared/types.ts`
  - [x] Create `src/lib/api/calendar/shared/schemas.ts`
- [x] 1.2 Create Google Calendar business logic
  - [x] Create `src/lib/api/calendar/google/index.ts`
  - [x] Create `src/lib/api/calendar/google/events.ts`
  - [x] Create `src/lib/api/calendar/google/schemas.ts`
- [ ] 1.3 Create Outlook Calendar business logic (TODO: Later)
  - [ ] Create `src/lib/api/calendar/outlook/index.ts`
  - [ ] Create `src/lib/api/calendar/outlook/events.ts`
  - [ ] Create `src/lib/api/calendar/outlook/schemas.ts`
- [ ] 1.4 Create CalDAV Calendar business logic (TODO: Later)
  - [ ] Create `src/lib/api/calendar/caldav/index.ts`
  - [ ] Create `src/lib/api/calendar/caldav/events.ts`
  - [ ] Create `src/lib/api/calendar/caldav/schemas.ts`
- [x] 1.5 Create main calendar API exports
  - [x] Create `src/lib/api/calendar/index.ts`

## Phase 2: tRPC Calendar Router ✅ COMPLETED (Google)

- [x] 2.1 Create Google Calendar tRPC router
  - [x] Create `src/server/trpc/routers/calendar/google/router.ts`
  - [x] Create `src/server/trpc/routers/calendar/google/schemas.ts`
- [x] 2.2 Create Google Events tRPC router
  - [x] Create `src/server/trpc/routers/calendar/google/events.ts`
- [ ] 2.3 Create Outlook Calendar tRPC router (TODO: Later)
  - [ ] Create `src/server/trpc/routers/calendar/outlook/router.ts`
  - [ ] Create `src/server/trpc/routers/calendar/outlook/schemas.ts`
- [ ] 2.4 Create Outlook Events tRPC router (TODO: Later)
  - [ ] Create `src/server/trpc/routers/calendar/outlook/events.ts`
- [ ] 2.5 Create CalDAV Calendar tRPC router (TODO: Later)
  - [ ] Create `src/server/trpc/routers/calendar/caldav/router.ts`
  - [ ] Create `src/server/trpc/routers/calendar/caldav/schemas.ts`
- [ ] 2.6 Create CalDAV Events tRPC router (TODO: Later)
  - [ ] Create `src/server/trpc/routers/calendar/caldav/events.ts`
- [x] 2.7 Create main calendar router
  - [x] Create `src/server/trpc/routers/calendar/router.ts`
- [x] 2.8 Add calendar router to root router

## Phase 3: OAuth Flow Integration

- [ ] 3.1 Simplify OAuth callback API routes
  - [ ] Update Google OAuth callback route
  - [ ] Update Outlook OAuth callback route
  - [ ] Update CalDAV auth route
- [ ] 3.2 Test OAuth flows work correctly

## Phase 4: Admin Route Migration ✅ COMPLETED

- [x] 4.1 Add admin check to auth business logic
- [x] 4.2 Add admin check to auth tRPC router
- [x] 4.3 Keep check-admin API route (required for middleware compatibility)

## Phase 5: Frontend tRPC Migration 🚧 IN PROGRESS

### **Current Status**

- **Backend**: 51/54 routes migrated to tRPC (94.4% complete)
- **Frontend**: 6 high-priority components migrated to tRPC
- **Completed**: Task management, core settings components
- **Remaining**: Auth components, calendar components, store migrations

---

## **Phase 1: Simple Component Migrations** ⚡

**Estimated Time**: 2-3 hours | **Risk Level**: Low

### **1.1 Auth Components** (High Priority)

- [x] `src/components/auth/SignInForm.tsx`
  - **Current**: Direct fetch to `/api/auth/register`
  - **Target**: `trpc.auth.register.useMutation()`
- [x] `src/components/auth/PasswordResetForm.tsx`
  - **Current**: Direct fetch to `/api/auth/reset-password/request` and `/api/auth/reset-password/reset`
  - **Target**: `trpc.auth.requestPasswordReset.useMutation()` and `trpc.auth.resetPassword.useMutation()`

### **1.2 Setup Components** (Medium Priority)

- [x] `src/components/setup/SetupForm.tsx`
  - **Current**: Direct fetch to `/api/setup`
  - **Target**: `trpc.setup.perform.useMutation()`

### **1.3 CalDAV Components** (Medium Priority)

- [x] `src/components/settings/CalDAVAccountForm.tsx`
  - **Current**: Direct fetch to `/api/calendar/caldav/test` and `/api/calendar/caldav/auth`
  - **Target**: `trpc.calendar.caldav.testConnection.useQuery()` and `trpc.calendar.caldav.authenticate.useMutation()`
  - **Note**: Authentication migrated successfully, test connection has tRPC client setup issues (TODO: fix query call)

---

## **Phase 2: Settings Store Migration** 🔧

**Estimated Time**: 4-6 hours | **Risk Level**: Medium

### **2.1 Settings Store Refactoring**

**File**: `src/store/settings.ts`

**Current API Calls to Migrate:**

- [ ] User settings: `/api/user-settings` → `trpc.settings.user.*`
- [ ] Calendar settings: `/api/calendar-settings` → `trpc.settings.calendar.*`
- [ ] Notification settings: `/api/notification-settings` → `trpc.settings.notification.*`
- [ ] Integration settings: `/api/integration-settings` → `trpc.settings.integration.*`
- [ ] Data settings: `/api/data-settings` → `trpc.settings.data.*`
- [ ] Auto-schedule settings: `/api/auto-schedule-settings` → `trpc.settings.autoSchedule.*`
- [ ] Accounts: `/api/accounts` → `trpc.accounts.*`

**Components Using Settings Store:**

- [ ] `src/components/settings/UserSettings.tsx`
- [ ] `src/components/settings/CalendarSettings.tsx`
- [ ] `src/components/settings/NotificationSettings.tsx`
- [ ] `src/components/settings/IntegrationSettings.tsx`
- [ ] `src/components/settings/DataSettings.tsx`
- [ ] `src/components/settings/AutoScheduleSettings.tsx`

---

## **Phase 3: Log Viewer Migration** 📊

**Estimated Time**: 2-3 hours | **Risk Level**: Low

### **3.1 Log Viewer Components**

- [ ] `src/components/settings/LogViewer/index.tsx`
  - **Current**: Direct fetch to `/api/logs/cleanup`
  - **Target**: `trpc.logs.cleanup.useMutation()`

### **3.2 Log Store Migration**

- [ ] `src/store/logview.ts`
  - **Current**: Direct fetch to `/api/logs/sources` and `/api/logs`
  - **Target**: `trpc.logs.getSources.useQuery()` and `trpc.logs.get.useQuery()`

---

## **Phase 4: Calendar System Migration** 📅

**Estimated Time**: 12-16 hours | **Risk Level**: High

### **4.1 Calendar Store Migration** (Highest Complexity)

**File**: `src/store/calendar.ts`

**Current API Calls to Migrate (20+ calls):**

- [ ] **Google Calendar**: `/api/calendar/google/*` → `trpc.calendar.google.*`
- [ ] **Outlook Calendar**: `/api/calendar/outlook/*` → `trpc.calendar.outlook.*`
- [ ] **CalDAV Calendar**: `/api/calendar/caldav/*` → `trpc.calendar.caldav.*`
- [ ] **Feeds**: `/api/feeds/*` → `trpc.feeds.*`
- [ ] **Events**: `/api/events/*` → `trpc.events.*`

### **4.2 Calendar Components Migration** (In Order)

- [ ] **FeedManager** (`src/components/calendar/FeedManager.tsx`)
- [ ] **EventModal** (`src/components/calendar/EventModal.tsx`)
- [ ] **Calendar Views**:
  - [ ] `src/components/calendar/WeekView.tsx`
  - [ ] `src/components/calendar/DayView.tsx`
  - [ ] `src/components/calendar/MonthView.tsx`
  - [ ] `src/components/calendar/MultiMonthView.tsx`
- [ ] **Main Calendar** (`src/components/calendar/Calendar.tsx`)

---

## **Phase 5: Focus Mode Migration** 🎯

**Estimated Time**: 3-4 hours | **Risk Level**: Medium

### **5.1 Focus Components**

- [ ] `src/components/focus/QuickActions.tsx`
- [ ] `src/components/focus/TaskQueue.tsx`
- **Dependencies**: Task store (already has tRPC alternatives)

---

## **Phase 6: Project Components Migration** 📁

**Estimated Time**: 2-3 hours | **Risk Level**: Low

### **6.1 Project Components**

- [ ] `src/components/projects/ProjectSidebar.tsx`
- **Dependencies**: Task store, Project store

---

## **Phase 7: DnD Provider Migration** 🔄

**Estimated Time**: 1-2 hours | **Risk Level**: Low

### **7.1 DnD Components**

- [ ] `src/components/dnd/DndProvider.tsx`
- **Dependencies**: Task store

---

## **Phase 8: Store Cleanup and Deprecation** 🧹

**Estimated Time**: 2-3 hours | **Risk Level**: Low

### **8.1 Store Deprecation**

**Stores to Deprecate:**

- [ ] `src/store/task.ts` - Already has deprecation warnings
- [ ] `src/store/project.ts` - Already has deprecation warnings
- [ ] `src/store/calendar.ts` - After migration
- [ ] `src/store/settings.ts` - After migration
- [ ] `src/store/logview.ts` - After migration

---

## **Phase 9: Final Cleanup** ✨

**Estimated Time**: 2-3 hours | **Risk Level**: Low

### **9.1 API Route Cleanup**

- [ ] **Routes to Remove:** All migrated API routes except:
  - `/api/auth/[...nextauth]` (NextAuth requirement)
  - `/api/calendar/google` (OAuth callback)
  - `/api/calendar/outlook` (OAuth callback)

### **9.2 Import/Export Fix**

- [ ] `src/components/settings/ImportExportSettings.tsx`
  - **Issue**: Schema compatibility
  - **Solution**: Fix tRPC schema alignment

---

## **📅 Implementation Timeline**

### **Week 1: Foundation (Phases 1-3)**

- **Days 1-2**: Auth components, Setup components
- **Days 3-4**: Settings store migration
- **Day 5**: Log viewer migration

### **Week 2: Calendar System (Phase 4)**

- **Days 1-3**: Calendar store migration
- **Days 4-5**: Calendar components migration

### **Week 3: Completion (Phases 5-9)**

- **Days 1-2**: Focus mode, Project components, DnD
- **Days 3-4**: Store cleanup and deprecation
- **Day 5**: Final cleanup and testing

---

## Task Sync Phase 1 Tasks

## Calendar View Components tRPC Migration

- [ ] Refactor WeekView.tsx to use tRPC hooks and props, remove all store usage
- [ ] Refactor MonthView.tsx to use tRPC hooks and props, remove all store usage
- [ ] Refactor MultiMonthView.tsx to use tRPC hooks and props, remove all store usage
- [ ] Refactor DayView.tsx to use tRPC hooks and props, remove all store usage
- [ ] Update parent Calendar component to fetch and pass all required data and mutation handlers
- [ ] Test all calendar views for correct CRUD, quick view, and modal behavior
- [ ] Update CHANGELOG.md with migration summary

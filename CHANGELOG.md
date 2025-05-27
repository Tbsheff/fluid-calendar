# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING**: Migrated from Jest to Vitest for unit testing
  - Removed Jest dependencies: `jest`, `@types/jest`, `ts-jest`, `jest-environment-jsdom`
  - Added Vitest dependencies: `vitest`, `@vitest/ui`, `jsdom`, `@vitejs/plugin-react`
  - Updated test configuration from `jest.config.js` to `vitest.config.ts`
  - Updated package.json scripts to use Vitest commands
  - Migrated all test files from Jest to Vitest syntax

### Added
- Vitest configuration with React plugin and jsdom environment
- Comprehensive test setup with mocking for Next.js, tRPC, Zustand, and other dependencies
- Test utilities for authentication and session mocking
- UI test runner available via `npm run test:unit:ui`
- Test coverage reporting via `npm run test:unit:coverage`

### Fixed
- Updated all test files to use Vitest imports and functions
- Fixed tRPC mock to include all required mutations and queries
- Improved test reliability for server components and full HTML pages
- Enhanced error handling in test setup

### Test Status
- **Final Results**: **48 passing tests out of 48 (100% success rate)** ✅
- **Migration Complete**: Successfully migrated from Jest to Vitest with full test coverage
- **All Issues Resolved**:
  - ✅ Fixed error test button click functionality by using `document.querySelector` for full HTML components
  - ✅ Fixed tasks page infinite re-render by mocking Radix UI ScrollArea components
  - ✅ Enhanced server component testing with proper async/await mocking
  - ✅ Improved full HTML page component testing strategies

### Technical Notes
- Server components require special mocking for `getServerSession`, `getToken`, and database calls
- Full HTML page components (error, not-found) render complete HTML structure requiring different testing approaches
- Some async/await warnings in client components are expected due to server component mocking
- Vitest provides better performance and developer experience compared to Jest

## [1.3.0] 2025-03-25

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

# Database Seeding

This directory contains the database seeding script for development and testing purposes.

## Usage

### Seed the database with sample data:

```bash
npm run db:seed
```

### Reset and reseed the database:

```bash
npm run db:reset
# This will prompt for confirmation, then run migrations and seed automatically
```

### Generate Prisma client and schemas:

```bash
npm run db:generate
```

## What's Created

The seed script creates comprehensive sample data including:

### Users (3 total)

- **Admin User** (`admin@fluidcalendar.com`) - Admin role with lifetime subscription
- **John Doe** (`john@example.com`) - Regular user with free subscription
- **Demo User** (`demo@fluidcalendar.com`) - Regular user for demos

### Projects (4 total)

- **Work Project** - Blue color, work-related tasks
- **Personal** - Green color, personal tasks and goals
- **Learning & Development** - Purple color, skill improvement
- **Admin Tasks** - Red color, administrative tasks

### Tags (4 total)

- **urgent** - Red color for high-priority items
- **meeting** - Orange color for meeting-related tasks
- **research** - Purple color for research tasks
- **review** - Blue color for review tasks

### Tasks (7 total)

- Mixed statuses: todo, in_progress, completed
- Various priorities: high, medium, low
- Different energy levels and preferred times
- Some with due dates and recurring patterns
- Realistic descriptions and durations

### Calendar Data

- **2 Calendar Feeds**: Personal and Work calendars
- **3 Calendar Events**: Team meeting, doctor appointment, conference day

### Settings

Complete user settings profiles for all users including:

- User preferences (theme, timezone, view preferences)
- Calendar settings (working hours, default colors)
- Notification preferences
- Integration settings
- Auto-schedule settings

### System Configuration

- System settings with sensible defaults
- Public signup enabled
- Log level set to info

## Test Accounts

All users are created without passwords since this is for development with NextAuth. You can sign in through your configured OAuth providers or modify the seed script to add authentication records if needed.

- **Admin**: `admin@fluidcalendar.com` (has lifetime subscription)
- **Regular User**: `john@example.com` (free plan)
- **Demo User**: `demo@fluidcalendar.com` (free plan)

## Customization

The seed script clears existing data by default. To append data instead of replacing:

1. Comment out the cleanup section at the beginning of `seed.ts`
2. Modify the data as needed
3. Run the seed script

## Notes

- The script uses the global Prisma instance from `@/lib/prisma`
- All timestamps are relative to when the script runs
- Sample tasks include realistic due dates (tomorrow, next week, etc.)
- The script provides detailed console output showing what was created

import { PrismaClient, TaskStatus, Priority, EnergyLevel, TimePreference, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (optional - comment out if you want to append data)
  console.log("🧹 Cleaning existing data...");
  await prisma.taskChange.deleteMany();
  await prisma.taskListMapping.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.calendarFeed.deleteMany();
  await prisma.connectedAccount.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.autoScheduleSettings.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.calendarSettings.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.integrationSettings.deleteMany();
  await prisma.dataSettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create System Settings
  console.log("⚙️ Creating system settings...");
  await prisma.systemSettings.upsert({
    where: { id: "system" },
    update: {},
    create: {
      id: "system",
      logLevel: "info",
      logDestination: "db",
      publicSignup: true,
      disableHomepage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create Users
  console.log("👥 Creating users...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@fluidcalendar.com",
      emailVerified: new Date(),
      role: "admin",
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      emailVerified: new Date(),
      role: "user",
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@fluidcalendar.com",
      emailVerified: new Date(),
      role: "user",
    },
  });

  // Create User Settings for each user
  console.log("🔧 Creating user settings...");
  const users = [adminUser, regularUser, demoUser];

  for (const user of users) {
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        theme: "system",
        defaultView: "week",
        timeZone: "America/New_York",
        weekStartDay: "monday",
        timeFormat: "12h",
      },
    });

    await prisma.calendarSettings.create({
      data: {
        userId: user.id,
        workingHoursEnabled: true,
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        workingHoursDays: "[1,2,3,4,5]",
        defaultDuration: 60,
        defaultColor: "#3b82f6",
        defaultReminder: 30,
        refreshInterval: 5,
      },
    });

    await prisma.notificationSettings.create({
      data: {
        userId: user.id,
        emailNotifications: true,
        dailyEmailEnabled: true,
        eventInvites: true,
        eventUpdates: true,
        eventCancellations: true,
        eventReminders: true,
        defaultReminderTiming: "[30]",
      },
    });

    await prisma.integrationSettings.create({
      data: {
        userId: user.id,
        googleCalendarEnabled: true,
        googleCalendarAutoSync: true,
        googleCalendarInterval: 5,
        outlookCalendarEnabled: true,
        outlookCalendarAutoSync: true,
        outlookCalendarInterval: 5,
      },
    });

    await prisma.dataSettings.create({
      data: {
        userId: user.id,
        autoBackup: true,
        backupInterval: 7,
        retainDataFor: 365,
      },
    });

    await prisma.autoScheduleSettings.create({
      data: {
        userId: user.id,
        workDays: "[1,2,3,4,5]",
        workHourStart: 9,
        workHourEnd: 17,
        selectedCalendars: "[]",
        bufferMinutes: 15,
        highEnergyStart: 9,
        highEnergyEnd: 11,
        mediumEnergyStart: 13,
        mediumEnergyEnd: 15,
        lowEnergyStart: 15,
        lowEnergyEnd: 17,
        groupByProject: false,
      },
    });
  }

  // Create Projects
  console.log("📁 Creating projects...");
  const workProject = await prisma.project.create({
    data: {
      name: "Work Project",
      description: "Main work-related tasks and projects",
      color: "#3b82f6",
      status: ProjectStatus.ACTIVE,
      userId: regularUser.id,
    },
  });

  const personalProject = await prisma.project.create({
    data: {
      name: "Personal",
      description: "Personal tasks and goals",
      color: "#10b981",
      status: ProjectStatus.ACTIVE,
      userId: regularUser.id,
    },
  });

  const learningProject = await prisma.project.create({
    data: {
      name: "Learning & Development",
      description: "Skills improvement and learning goals",
      color: "#8b5cf6",
      status: ProjectStatus.ACTIVE,
      userId: regularUser.id,
    },
  });

  const adminProject = await prisma.project.create({
    data: {
      name: "Admin Tasks",
      description: "Administrative and management tasks",
      color: "#ef4444",
      status: ProjectStatus.ACTIVE,
      userId: adminUser.id,
    },
  });

  // Create Tags
  console.log("🏷️ Creating tags...");
  const urgentTag = await prisma.tag.create({
    data: {
      name: "urgent",
      color: "#ef4444",
      userId: regularUser.id,
    },
  });

  const meetingTag = await prisma.tag.create({
    data: {
      name: "meeting",
      color: "#f59e0b",
      userId: regularUser.id,
    },
  });

  const researchTag = await prisma.tag.create({
    data: {
      name: "research",
      color: "#8b5cf6",
      userId: regularUser.id,
    },
  });

  const reviewTag = await prisma.tag.create({
    data: {
      name: "review",
      color: "#06b6d4",
      userId: regularUser.id,
    },
  });

  // Create Tasks
  console.log("✅ Creating tasks...");
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const tasks = [
    {
      title: "Review quarterly goals",
      description: "Review and update quarterly objectives and key results",
      status: TaskStatus.TODO,
      dueDate: tomorrow,
      priority: Priority.HIGH,
      energyLevel: EnergyLevel.HIGH,
      preferredTime: TimePreference.MORNING,
      duration: 60,
      projectId: workProject.id,
      userId: regularUser.id,
      tags: [urgentTag.id, reviewTag.id],
    },
    {
      title: "Prepare presentation for client meeting",
      description:
        "Create slides and talking points for the upcoming client presentation",
      status: TaskStatus.IN_PROGRESS,
      dueDate: nextWeek,
      priority: Priority.HIGH,
      energyLevel: EnergyLevel.HIGH,
      preferredTime: TimePreference.MORNING,
      duration: 120,
      projectId: workProject.id,
      userId: regularUser.id,
      tags: [meetingTag.id],
    },
    {
      title: "Research new productivity tools",
      description:
        "Investigate and evaluate new tools that could improve team productivity",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      energyLevel: EnergyLevel.MEDIUM,
      preferredTime: TimePreference.AFTERNOON,
      duration: 90,
      projectId: learningProject.id,
      userId: regularUser.id,
      tags: [researchTag.id],
    },
    {
      title: "Weekly grocery shopping",
      description: "Buy groceries for the week",
      status: TaskStatus.TODO,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: Priority.LOW,
      energyLevel: EnergyLevel.LOW,
      preferredTime: TimePreference.EVENING,
      duration: 45,
      projectId: personalProject.id,
      userId: regularUser.id,
      tags: [],
    },
    {
      title: "Complete TypeScript course",
      description:
        "Finish the advanced TypeScript course on online learning platform",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      energyLevel: EnergyLevel.HIGH,
      preferredTime: TimePreference.EVENING,
      duration: 180,
      projectId: learningProject.id,
      userId: regularUser.id,
      tags: [],
    },
    {
      title: "Team standup meeting",
      description: "Daily team synchronization meeting",
      status: TaskStatus.COMPLETED,
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // completed yesterday
      priority: Priority.HIGH,
      energyLevel: EnergyLevel.MEDIUM,
      preferredTime: TimePreference.MORNING,
      duration: 30,
      projectId: workProject.id,
      userId: regularUser.id,
      tags: [meetingTag.id],
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
    },
    {
      title: "System maintenance check",
      description: "Perform routine system maintenance and monitoring",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      energyLevel: EnergyLevel.MEDIUM,
      preferredTime: TimePreference.MORNING,
      duration: 60,
      projectId: adminProject.id,
      userId: adminUser.id,
      tags: [],
    },
  ];

  for (const taskData of tasks) {
    const { tags, ...taskFields } = taskData;
    const task = await prisma.task.create({
      data: {
        ...taskFields,
        tags: {
          connect: tags.map((tagId) => ({ id: tagId })),
        },
      },
    });
    console.log(`  Created task: ${task.title}`);
  }

  // Create Calendar Feeds
  console.log("📅 Creating calendar feeds...");
  const personalCalendar = await prisma.calendarFeed.create({
    data: {
      name: "Personal Calendar",
      type: "LOCAL",
      color: "#10b981",
      enabled: true,
      userId: regularUser.id,
    },
  });

  const workCalendar = await prisma.calendarFeed.create({
    data: {
      name: "Work Calendar",
      type: "LOCAL",
      color: "#3b82f6",
      enabled: true,
      userId: regularUser.id,
    },
  });

  // Create Calendar Events
  console.log("📆 Creating calendar events...");
  const events = [
    {
      title: "Team Meeting",
      description: "Weekly team sync meeting",
      start: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      end: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
      allDay: false,
      feedId: workCalendar.id,
    },
    {
      title: "Doctor Appointment",
      description: "Annual checkup with Dr. Smith",
      start: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // tomorrow at 10 AM
      end: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000), // tomorrow at 11 AM
      allDay: false,
      feedId: personalCalendar.id,
    },
    {
      title: "Conference Day",
      description: "Annual tech conference",
      start: nextWeek,
      end: nextWeek,
      allDay: true,
      feedId: workCalendar.id,
    },
  ];

  for (const eventData of events) {
    const event = await prisma.calendarEvent.create({
      data: eventData,
    });
    console.log(`  Created event: ${event.title}`);
  }

  // Create Subscriptions for demo purposes
  console.log("💳 Creating subscriptions...");
  await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      plan: "LIFETIME",
      status: "ACTIVE",
      amount: 20000, // $200 in cents
      discountApplied: true,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: regularUser.id,
      plan: "FREE",
      status: "ACTIVE",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Created:");
  console.log("  - 3 users (1 admin, 2 regular)");
  console.log("  - 4 projects");
  console.log("  - 4 tags");
  console.log("  - 7 tasks");
  console.log("  - 2 calendar feeds");
  console.log("  - 3 calendar events");
  console.log("  - Complete user settings for all users");
  console.log("  - System settings");
  console.log("  - Sample subscriptions");

  console.log("\n🔐 Test accounts:");
  console.log("  Admin: admin@fluidcalendar.com");
  console.log("  User:  john@example.com");
  console.log("  Demo:  demo@fluidcalendar.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

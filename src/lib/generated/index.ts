import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const ConnectedAccountScalarFieldEnumSchema = z.enum(['id','provider','email','accessToken','refreshToken','expiresAt','createdAt','updatedAt','caldavUrl','caldavUsername','userId']);

export const AccountScalarFieldEnumSchema = z.enum(['id','userId','type','provider','providerAccountId','refresh_token','access_token','expires_at','token_type','scope','id_token','session_state']);

export const SessionScalarFieldEnumSchema = z.enum(['id','sessionToken','userId','expires']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','role']);

export const VerificationTokenScalarFieldEnumSchema = z.enum(['identifier','token','expires']);

export const CalendarFeedScalarFieldEnumSchema = z.enum(['id','name','url','type','color','enabled','createdAt','updatedAt','lastSync','syncToken','error','channelId','resourceId','channelExpiration','userId','accountId','caldavPath','ctag']);

export const CalendarEventScalarFieldEnumSchema = z.enum(['id','feedId','externalEventId','title','description','start','end','location','isRecurring','recurrenceRule','allDay','status','sequence','created','lastModified','organizer','attendees','createdAt','updatedAt','isMaster','masterEventId','recurringEventId']);

export const ProjectScalarFieldEnumSchema = z.enum(['id','name','description','color','status','externalId','externalSource','lastSyncedAt','userId','createdAt','updatedAt']);

export const TaskScalarFieldEnumSchema = z.enum(['id','title','description','status','dueDate','startDate','duration','priority','energyLevel','preferredTime','isAutoScheduled','scheduleLocked','scheduledStart','scheduledEnd','scheduleScore','lastScheduled','postponedUntil','isRecurring','recurrenceRule','lastCompletedDate','completedAt','externalTaskId','source','lastSyncedAt','externalListId','externalCreatedAt','externalUpdatedAt','syncStatus','syncError','syncHash','skipSync','userId','createdAt','updatedAt','projectId']);

export const TagScalarFieldEnumSchema = z.enum(['id','name','color','userId']);

export const AutoScheduleSettingsScalarFieldEnumSchema = z.enum(['id','userId','workDays','workHourStart','workHourEnd','selectedCalendars','bufferMinutes','highEnergyStart','highEnergyEnd','mediumEnergyStart','mediumEnergyEnd','lowEnergyStart','lowEnergyEnd','groupByProject','createdAt','updatedAt']);

export const UserSettingsScalarFieldEnumSchema = z.enum(['id','userId','theme','defaultView','timeZone','weekStartDay','timeFormat','createdAt','updatedAt']);

export const CalendarSettingsScalarFieldEnumSchema = z.enum(['id','userId','defaultCalendarId','workingHoursEnabled','workingHoursStart','workingHoursEnd','workingHoursDays','defaultDuration','defaultColor','defaultReminder','refreshInterval','createdAt','updatedAt']);

export const NotificationSettingsScalarFieldEnumSchema = z.enum(['id','userId','emailNotifications','dailyEmailEnabled','eventInvites','eventUpdates','eventCancellations','eventReminders','defaultReminderTiming','createdAt','updatedAt']);

export const IntegrationSettingsScalarFieldEnumSchema = z.enum(['id','userId','googleCalendarEnabled','googleCalendarAutoSync','googleCalendarInterval','outlookCalendarEnabled','outlookCalendarAutoSync','outlookCalendarInterval','createdAt','updatedAt']);

export const DataSettingsScalarFieldEnumSchema = z.enum(['id','userId','autoBackup','backupInterval','retainDataFor','createdAt','updatedAt']);

export const SystemSettingsScalarFieldEnumSchema = z.enum(['id','googleClientId','googleClientSecret','outlookClientId','outlookClientSecret','outlookTenantId','logLevel','logRetention','logDestination','publicSignup','disableHomepage','resendApiKey','createdAt','updatedAt']);

export const LogScalarFieldEnumSchema = z.enum(['id','timestamp','level','message','metadata','source','expiresAt']);

export const PendingWaitlistScalarFieldEnumSchema = z.enum(['id','email','name','referralCode','verificationToken','verificationExpiry','interestedInLifetime','createdAt','updatedAt']);

export const WaitlistScalarFieldEnumSchema = z.enum(['id','email','name','status','createdAt','updatedAt','invitedAt','registeredAt','invitationToken','invitationExpiry','referralCode','referredBy','referralCount','priorityScore','lastVisitedAt','notes','lastPosition','interestedInLifetime','queueNotificationsEnabled']);

export const BetaSettingsScalarFieldEnumSchema = z.enum(['id','maxActiveUsers','invitationValidDays','autoInviteEnabled','autoInviteCount','autoInviteFrequency','referralBoostAmount','maxReferralBoost','showQueuePosition','showTotalWaitlist','invitationEmailTemplate','waitlistConfirmationTemplate','reminderEmailTemplate']);

export const JobRecordScalarFieldEnumSchema = z.enum(['id','queueName','jobId','name','data','status','result','error','attempts','maxAttempts','createdAt','updatedAt','startedAt','finishedAt','userId']);

export const TaskProviderScalarFieldEnumSchema = z.enum(['id','userId','type','name','enabled','syncEnabled','syncInterval','lastSyncedAt','accessToken','refreshToken','expiresAt','accountId','defaultProjectId','settings','error','createdAt','updatedAt']);

export const TaskListMappingScalarFieldEnumSchema = z.enum(['id','providerId','projectId','externalListId','externalListName','direction','isDefault','syncEnabled','isAutoScheduled','lastSyncedAt','syncStatus','lastError','createdAt','updatedAt']);

export const TaskChangeScalarFieldEnumSchema = z.enum(['id','taskId','providerId','mappingId','changeType','changeData','synced','timestamp','userId','createdAt']);

export const PasswordResetScalarFieldEnumSchema = z.enum(['id','userId','token','expiresAt','usedAt','createdAt']);

export const SubscriptionScalarFieldEnumSchema = z.enum(['id','userId','plan','status','stripeCustomerId','stripePaymentIntentId','amount','discountApplied','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const JobStatusSchema = z.enum(['PENDING','ACTIVE','COMPLETED','FAILED','DELAYED','PAUSED']);

export type JobStatusType = `${z.infer<typeof JobStatusSchema>}`

export const SubscriptionPlanSchema = z.enum(['FREE','LIFETIME']);

export type SubscriptionPlanType = `${z.infer<typeof SubscriptionPlanSchema>}`

export const SubscriptionStatusSchema = z.enum(['ACTIVE','PAYMENT_PENDING','PAYMENT_FAILED']);

export type SubscriptionStatusType = `${z.infer<typeof SubscriptionStatusSchema>}`

export const TaskStatusSchema = z.enum(['TODO','IN_PROGRESS','COMPLETED','CANCELLED']);

export type TaskStatusType = `${z.infer<typeof TaskStatusSchema>}`

export const PrioritySchema = z.enum(['HIGH','MEDIUM','LOW','NONE']);

export type PriorityType = `${z.infer<typeof PrioritySchema>}`

export const EnergyLevelSchema = z.enum(['HIGH','MEDIUM','LOW']);

export type EnergyLevelType = `${z.infer<typeof EnergyLevelSchema>}`

export const TimePreferenceSchema = z.enum(['MORNING','AFTERNOON','EVENING','ANYTIME']);

export type TimePreferenceType = `${z.infer<typeof TimePreferenceSchema>}`

export const ProjectStatusSchema = z.enum(['ACTIVE','ARCHIVED']);

export type ProjectStatusType = `${z.infer<typeof ProjectStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// CONNECTED ACCOUNT SCHEMA
/////////////////////////////////////////

export const ConnectedAccountSchema = z.object({
  id: z.string().cuid(),
  provider: z.string(),
  email: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullish(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  caldavUrl: z.string().nullish(),
  caldavUsername: z.string().nullish(),
  userId: z.string().nullish(),
})

export type ConnectedAccount = z.infer<typeof ConnectedAccountSchema>

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().nullish(),
  access_token: z.string().nullish(),
  expires_at: z.number().int().nullish(),
  token_type: z.string().nullish(),
  scope: z.string().nullish(),
  id_token: z.string().nullish(),
  session_state: z.string().nullish(),
})

export type Account = z.infer<typeof AccountSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string().cuid(),
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  emailVerified: z.coerce.date().nullish(),
  image: z.string().nullish(),
  role: z.string(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// VERIFICATION TOKEN SCHEMA
/////////////////////////////////////////

export const VerificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.coerce.date(),
})

export type VerificationToken = z.infer<typeof VerificationTokenSchema>

/////////////////////////////////////////
// CALENDAR FEED SCHEMA
/////////////////////////////////////////

export const CalendarFeedSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().nullish(),
  type: z.string(),
  color: z.string().nullish(),
  enabled: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastSync: z.coerce.date().nullish(),
  syncToken: z.string().nullish(),
  error: z.string().nullish(),
  channelId: z.string().nullish(),
  resourceId: z.string().nullish(),
  channelExpiration: z.coerce.date().nullish(),
  userId: z.string().nullish(),
  accountId: z.string().nullish(),
  caldavPath: z.string().nullish(),
  ctag: z.string().nullish(),
})

export type CalendarFeed = z.infer<typeof CalendarFeedSchema>

/////////////////////////////////////////
// CALENDAR EVENT SCHEMA
/////////////////////////////////////////

export const CalendarEventSchema = z.object({
  id: z.string().uuid(),
  feedId: z.string(),
  externalEventId: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  location: z.string().nullish(),
  isRecurring: z.boolean(),
  recurrenceRule: z.string().nullish(),
  allDay: z.boolean(),
  status: z.string().nullish(),
  sequence: z.number().int().nullish(),
  created: z.coerce.date().nullish(),
  lastModified: z.coerce.date().nullish(),
  organizer: JsonValueSchema.nullable(),
  attendees: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isMaster: z.boolean(),
  masterEventId: z.string().nullish(),
  recurringEventId: z.string().nullish(),
})

export type CalendarEvent = z.infer<typeof CalendarEventSchema>

/////////////////////////////////////////
// PROJECT SCHEMA
/////////////////////////////////////////

export const ProjectSchema = z.object({
  status: ProjectStatusSchema,
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullish(),
  color: z.string().nullish(),
  externalId: z.string().nullish(),
  externalSource: z.string().nullish(),
  lastSyncedAt: z.coerce.date().nullish(),
  userId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Project = z.infer<typeof ProjectSchema>

/////////////////////////////////////////
// TASK SCHEMA
/////////////////////////////////////////

export const TaskSchema = z.object({
  status: TaskStatusSchema,
  priority: PrioritySchema.nullish(),
  energyLevel: EnergyLevelSchema.nullish(),
  preferredTime: TimePreferenceSchema.nullish(),
  id: z.string().cuid(),
  title: z.string(),
  description: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  startDate: z.coerce.date().nullish(),
  duration: z.number().int().nullish(),
  isAutoScheduled: z.boolean(),
  scheduleLocked: z.boolean(),
  scheduledStart: z.coerce.date().nullish(),
  scheduledEnd: z.coerce.date().nullish(),
  scheduleScore: z.number().nullish(),
  lastScheduled: z.coerce.date().nullish(),
  postponedUntil: z.coerce.date().nullish(),
  isRecurring: z.boolean(),
  recurrenceRule: z.string().nullish(),
  lastCompletedDate: z.coerce.date().nullish(),
  completedAt: z.coerce.date().nullish(),
  externalTaskId: z.string().nullish(),
  source: z.string().nullish(),
  lastSyncedAt: z.coerce.date().nullish(),
  externalListId: z.string().nullish(),
  externalCreatedAt: z.coerce.date().nullish(),
  externalUpdatedAt: z.coerce.date().nullish(),
  syncStatus: z.string().nullish(),
  syncError: z.string().nullish(),
  syncHash: z.string().nullish(),
  skipSync: z.boolean(),
  userId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  projectId: z.string().nullish(),
})

export type Task = z.infer<typeof TaskSchema>

/////////////////////////////////////////
// TAG SCHEMA
/////////////////////////////////////////

export const TagSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  color: z.string().nullish(),
  userId: z.string().nullish(),
})

export type Tag = z.infer<typeof TagSchema>

/////////////////////////////////////////
// AUTO SCHEDULE SETTINGS SCHEMA
/////////////////////////////////////////

export const AutoScheduleSettingsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  workDays: z.string(),
  workHourStart: z.number().int(),
  workHourEnd: z.number().int(),
  selectedCalendars: z.string(),
  bufferMinutes: z.number().int(),
  highEnergyStart: z.number().int().nullish(),
  highEnergyEnd: z.number().int().nullish(),
  mediumEnergyStart: z.number().int().nullish(),
  mediumEnergyEnd: z.number().int().nullish(),
  lowEnergyStart: z.number().int().nullish(),
  lowEnergyEnd: z.number().int().nullish(),
  groupByProject: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AutoScheduleSettings = z.infer<typeof AutoScheduleSettingsSchema>

/////////////////////////////////////////
// USER SETTINGS SCHEMA
/////////////////////////////////////////

export const UserSettingsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  theme: z.string(),
  defaultView: z.string(),
  timeZone: z.string(),
  weekStartDay: z.string(),
  timeFormat: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>

/////////////////////////////////////////
// CALENDAR SETTINGS SCHEMA
/////////////////////////////////////////

export const CalendarSettingsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  defaultCalendarId: z.string().nullish(),
  workingHoursEnabled: z.boolean(),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  workingHoursDays: z.string(),
  defaultDuration: z.number().int(),
  defaultColor: z.string(),
  defaultReminder: z.number().int(),
  refreshInterval: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type CalendarSettings = z.infer<typeof CalendarSettingsSchema>

/////////////////////////////////////////
// NOTIFICATION SETTINGS SCHEMA
/////////////////////////////////////////

export const NotificationSettingsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  emailNotifications: z.boolean(),
  dailyEmailEnabled: z.boolean(),
  eventInvites: z.boolean(),
  eventUpdates: z.boolean(),
  eventCancellations: z.boolean(),
  eventReminders: z.boolean(),
  defaultReminderTiming: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>

/////////////////////////////////////////
// INTEGRATION SETTINGS SCHEMA
/////////////////////////////////////////

export const IntegrationSettingsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  googleCalendarEnabled: z.boolean(),
  googleCalendarAutoSync: z.boolean(),
  googleCalendarInterval: z.number().int(),
  outlookCalendarEnabled: z.boolean(),
  outlookCalendarAutoSync: z.boolean(),
  outlookCalendarInterval: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type IntegrationSettings = z.infer<typeof IntegrationSettingsSchema>

/////////////////////////////////////////
// DATA SETTINGS SCHEMA
/////////////////////////////////////////

export const DataSettingsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  autoBackup: z.boolean(),
  backupInterval: z.number().int(),
  retainDataFor: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DataSettings = z.infer<typeof DataSettingsSchema>

/////////////////////////////////////////
// SYSTEM SETTINGS SCHEMA
/////////////////////////////////////////

export const SystemSettingsSchema = z.object({
  id: z.string().cuid(),
  googleClientId: z.string().nullish(),
  googleClientSecret: z.string().nullish(),
  outlookClientId: z.string().nullish(),
  outlookClientSecret: z.string().nullish(),
  outlookTenantId: z.string().nullish(),
  logLevel: z.string(),
  logRetention: JsonValueSchema.nullable(),
  logDestination: z.string(),
  publicSignup: z.boolean(),
  disableHomepage: z.boolean(),
  resendApiKey: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SystemSettings = z.infer<typeof SystemSettingsSchema>

/////////////////////////////////////////
// LOG SCHEMA
/////////////////////////////////////////

export const LogSchema = z.object({
  id: z.string().cuid(),
  timestamp: z.coerce.date(),
  level: z.string(),
  message: z.string(),
  metadata: JsonValueSchema.nullable(),
  source: z.string().nullish(),
  expiresAt: z.coerce.date(),
})

export type Log = z.infer<typeof LogSchema>

/////////////////////////////////////////
// PENDING WAITLIST SCHEMA
/////////////////////////////////////////

export const PendingWaitlistSchema = z.object({
  id: z.string().cuid(),
  email: z.string(),
  name: z.string().nullish(),
  referralCode: z.string().nullish(),
  verificationToken: z.string(),
  verificationExpiry: z.coerce.date(),
  interestedInLifetime: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type PendingWaitlist = z.infer<typeof PendingWaitlistSchema>

/////////////////////////////////////////
// WAITLIST SCHEMA
/////////////////////////////////////////

export const WaitlistSchema = z.object({
  id: z.string().cuid(),
  email: z.string(),
  name: z.string().nullish(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  invitedAt: z.coerce.date().nullish(),
  registeredAt: z.coerce.date().nullish(),
  invitationToken: z.string().nullish(),
  invitationExpiry: z.coerce.date().nullish(),
  referralCode: z.string(),
  referredBy: z.string().nullish(),
  referralCount: z.number().int(),
  priorityScore: z.number(),
  lastVisitedAt: z.coerce.date().nullish(),
  notes: z.string().nullish(),
  lastPosition: z.number().int().nullish(),
  interestedInLifetime: z.boolean(),
  queueNotificationsEnabled: z.boolean(),
})

export type Waitlist = z.infer<typeof WaitlistSchema>

/////////////////////////////////////////
// BETA SETTINGS SCHEMA
/////////////////////////////////////////

export const BetaSettingsSchema = z.object({
  id: z.string(),
  maxActiveUsers: z.number().int(),
  invitationValidDays: z.number().int(),
  autoInviteEnabled: z.boolean(),
  autoInviteCount: z.number().int(),
  autoInviteFrequency: z.string(),
  referralBoostAmount: z.number(),
  maxReferralBoost: z.number(),
  showQueuePosition: z.boolean(),
  showTotalWaitlist: z.boolean(),
  invitationEmailTemplate: z.string(),
  waitlistConfirmationTemplate: z.string(),
  reminderEmailTemplate: z.string(),
})

export type BetaSettings = z.infer<typeof BetaSettingsSchema>

/////////////////////////////////////////
// JOB RECORD SCHEMA
/////////////////////////////////////////

export const JobRecordSchema = z.object({
  status: JobStatusSchema,
  id: z.string().cuid(),
  queueName: z.string(),
  jobId: z.string(),
  name: z.string(),
  data: JsonValueSchema,
  result: JsonValueSchema.nullable(),
  error: z.string().nullish(),
  attempts: z.number().int(),
  maxAttempts: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  startedAt: z.coerce.date().nullish(),
  finishedAt: z.coerce.date().nullish(),
  userId: z.string().nullish(),
})

export type JobRecord = z.infer<typeof JobRecordSchema>

/////////////////////////////////////////
// TASK PROVIDER SCHEMA
/////////////////////////////////////////

export const TaskProviderSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  type: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  syncEnabled: z.boolean(),
  syncInterval: z.string(),
  lastSyncedAt: z.coerce.date().nullish(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  expiresAt: z.coerce.date().nullish(),
  accountId: z.string().nullish(),
  defaultProjectId: z.string().nullish(),
  settings: JsonValueSchema.nullable(),
  error: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TaskProvider = z.infer<typeof TaskProviderSchema>

/////////////////////////////////////////
// TASK LIST MAPPING SCHEMA
/////////////////////////////////////////

export const TaskListMappingSchema = z.object({
  id: z.string().cuid(),
  providerId: z.string(),
  projectId: z.string(),
  externalListId: z.string(),
  externalListName: z.string(),
  direction: z.string(),
  isDefault: z.boolean(),
  syncEnabled: z.boolean(),
  isAutoScheduled: z.boolean(),
  lastSyncedAt: z.coerce.date().nullish(),
  syncStatus: z.string().nullish(),
  lastError: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TaskListMapping = z.infer<typeof TaskListMappingSchema>

/////////////////////////////////////////
// TASK CHANGE SCHEMA
/////////////////////////////////////////

export const TaskChangeSchema = z.object({
  id: z.string().cuid(),
  taskId: z.string().nullish(),
  providerId: z.string().nullish(),
  mappingId: z.string().nullish(),
  changeType: z.string(),
  changeData: JsonValueSchema.nullable(),
  synced: z.boolean(),
  timestamp: z.coerce.date(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type TaskChange = z.infer<typeof TaskChangeSchema>

/////////////////////////////////////////
// PASSWORD RESET SCHEMA
/////////////////////////////////////////

export const PasswordResetSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  usedAt: z.coerce.date().nullish(),
  createdAt: z.coerce.date(),
})

export type PasswordReset = z.infer<typeof PasswordResetSchema>

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  plan: SubscriptionPlanSchema,
  status: SubscriptionStatusSchema,
  id: z.string().cuid(),
  userId: z.string(),
  stripeCustomerId: z.string().nullish(),
  stripePaymentIntentId: z.string().nullish(),
  amount: z.number().int().nullish(),
  discountApplied: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>

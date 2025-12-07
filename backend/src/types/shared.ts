// User types
export interface User {
  id: number;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  timezone: string;
  notificationTime: string; // HH:MM format (was smsTime)
  messageStyle: string;
  pushoverApiToken: string | null;
  pushoverUserKey: string | null;
  pushoverGroupKey: string | null;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  // Legacy field alias
  smsTime?: string; // Deprecated, use notificationTime
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  timezone: string;
  notificationTime: string;
  messageStyle: string;
  isAdmin: boolean;
  pushoverConfigured: boolean;
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

// Calendar Event types
export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  startTime: string; // ISO 8601 datetime
  endTime: string; // ISO 8601 datetime
  location: string | null;
  isAllDay: boolean;
  source: CalendarSource;
  sourceId: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay?: boolean;
  source: CalendarSource;
  sourceId?: string;
  userId: number;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isAllDay?: boolean;
}

// Family Member types
export interface FamilyMember {
  id: number;
  name: string;
  pushoverUserKey: string;
  relationship: string | null;
  isActive: boolean;
  joinedVia: string | null;
  joinedAt: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyMemberData {
  name: string;
  pushoverUserKey: string;
  relationship?: string;
  userId: number;
  joinedVia?: string;
}

// Notification History types (was SMS History)
export interface NotificationHistory {
  id: number;
  groupKey: string;
  message: string;
  status: NotificationStatus;
  messageStyle: string;
  externalId: string | null; // Pushover request ID (was twilioSid)
  errorCode: string | null;
  errorMessage: string | null;
  userId: number;
  eventCount: number;
  sentAt: string;
  deliveredAt: string | null;
}

export interface CreateNotificationHistoryData {
  groupKey: string;
  message: string;
  status: NotificationStatus;
  messageStyle: string;
  userId: number;
  eventCount?: number;
  externalId?: string;
}

export type NotificationStatus = "sent" | "delivered" | "failed" | "queued";

// Legacy type aliases for backward compatibility
export type SmsHistory = NotificationHistory;
export type SmsStatus = NotificationStatus;
export type CreateSmsHistoryData = CreateNotificationHistoryData;

// Join Code types
export interface JoinCode {
  id: number;
  code: string;
  userId: number;
  isUsed: boolean;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CreateJoinCodeData {
  code: string;
  userId: number;
  expiresAt: Date;
}

// Calendar Integration types
export interface CalendarIntegration {
  id: number;
  provider: CalendarProvider;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: string | null;
  timetreeEmail: string | null;
  timetreePassword: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarIntegrationData {
  provider: CalendarProvider;
  userId: number;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  timetreeEmail?: string;
  timetreePassword?: string;
}

export type CalendarProvider = "google" | "microsoft" | "timetree";

// Admin Settings types
export interface AdminSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminSettingData {
  key: string;
  value: string;
  category: string;
  isSecret?: boolean;
}

// System Setup types
export interface SystemSetup {
  id: number;
  isCompleted: boolean;
  adminEmail: string | null;
  setupCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Message Style types
export interface MessageStyle {
  id: number;
  name: string;
  displayName: string;
  prompt: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageStyleData {
  name: string;
  displayName: string;
  prompt: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateMessageStyleData {
  displayName?: string;
  prompt?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Type unions and helpers
export type MessagePersonality =
  | "professional"
  | "witty"
  | "sarcastic"
  | "mission"
  | "irwin"
  | "tanda"
  | "random";

export type CalendarSource = "manual" | "google" | "microsoft" | "timetree";

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}

export interface RegisterResponse {
  user: UserResponse;
  token: string;
}

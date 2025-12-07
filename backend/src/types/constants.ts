import type { MessagePersonality, CalendarSource, CalendarProvider, NotificationStatus } from "./shared.js";

// Message personality styles
export const MESSAGE_PERSONALITIES: readonly MessagePersonality[] = [
  "professional",
  "witty",
  "sarcastic",
  "mission",
  "irwin",
  "tanda",
  "random",
] as const;

// Calendar sources
export const CALENDAR_SOURCES: readonly CalendarSource[] = [
  "manual",
  "google",
  "microsoft",
  "timetree",
] as const;

// Calendar providers (for integrations)
export const CALENDAR_PROVIDERS: readonly CalendarProvider[] = [
  "google",
  "microsoft",
  "timetree",
] as const;

// Notification statuses (was SMS_STATUSES)
export const NOTIFICATION_STATUSES: readonly NotificationStatus[] = [
  "sent",
  "delivered",
  "failed",
  "queued",
] as const;

// Legacy alias
export const SMS_STATUSES = NOTIFICATION_STATUSES;

// Timezones
export const TIMEZONES: readonly string[] = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
] as const;

// Default values
export const DEFAULTS = {
  TIMEZONE: "America/Los_Angeles",
  NOTIFICATION_TIME: "07:00",
  MESSAGE_STYLE: "professional" as MessagePersonality,
  JWT_EXPIRES_IN: "7d",
  SALT_ROUNDS: 10,
  JOIN_CODE_LENGTH: 6,
  JOIN_CODE_EXPIRY_DAYS: 7,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Admin setting categories
export const ADMIN_SETTING_CATEGORIES = {
  API_KEYS: "api_keys",
  NOTIFICATIONS: "notifications", // was SMS
  EMAIL: "email",
  SYSTEM: "system",
  INTEGRATIONS: "integrations",
} as const;

// Admin setting keys
// Note: Pushover credentials are stored per-user, not as admin settings
export const ADMIN_SETTING_KEYS = {
  ANTHROPIC_API_KEY: "anthropic_api_key",
  GOOGLE_CLIENT_ID: "google_client_id",
  GOOGLE_CLIENT_SECRET: "google_client_secret",
  MICROSOFT_CLIENT_ID: "microsoft_client_id",
  MICROSOFT_CLIENT_SECRET: "microsoft_client_secret",
  SMTP_HOST: "smtp_host",
  SMTP_PORT: "smtp_port",
  SMTP_USER: "smtp_user",
  SMTP_PASS: "smtp_pass",
  SYSTEM_NAME: "system_name",
  SYSTEM_URL: "system_url",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid credentials",
    TOKEN_EXPIRED: "Token expired or invalid",
    NO_TOKEN: "No authentication token provided",
    ACCOUNT_INACTIVE: "Account is deactivated",
    EMAIL_IN_USE: "Email already registered",
    WEAK_PASSWORD: "Password does not meet security requirements",
    ADMIN_REQUIRED: "Admin access required",
  },
  USER: {
    NOT_FOUND: "User not found",
    CREATION_FAILED: "Failed to create user",
    UPDATE_FAILED: "Failed to update user",
  },
  EVENT: {
    NOT_FOUND: "Event not found",
    INVALID_DATES: "End time must be after start time",
    CANNOT_EDIT_SYNCED: "Cannot edit synced events",
    CANNOT_DELETE_SYNCED: "Cannot delete synced events",
    CREATION_FAILED: "Failed to create event",
    UPDATE_FAILED: "Failed to update event",
    DELETE_FAILED: "Failed to delete event",
  },
  FAMILY: {
    NOT_FOUND: "Family member not found",
    CREATION_FAILED: "Failed to add family member",
    UPDATE_FAILED: "Failed to update family member",
    DELETE_FAILED: "Failed to remove family member",
  },
  NOTIFICATION: {
    SEND_FAILED: "Failed to send notification",
    INVALID_USER_KEY: "Invalid Pushover user key format",
    NO_RECIPIENTS: "No active recipients found",
    NOT_CONFIGURED: "Pushover not configured",
  },
  SYSTEM: {
    DATABASE_ERROR: "Database error occurred",
    INTERNAL_ERROR: "Internal server error",
    NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation error",
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    REGISTERED: "Registration successful",
    LOGGED_IN: "Logged in successfully",
    LOGGED_OUT: "Logged out successfully",
  },
  USER: {
    CREATED: "User created successfully",
    UPDATED: "User updated successfully",
    DELETED: "User deleted successfully",
  },
  EVENT: {
    CREATED: "Event created successfully",
    UPDATED: "Event updated successfully",
    DELETED: "Event deleted successfully",
  },
  FAMILY: {
    CREATED: "Family member added successfully",
    UPDATED: "Family member updated successfully",
    DELETED: "Family member removed successfully",
  },
  NOTIFICATION: {
    SENT: "Notification sent successfully",
    TEST_SENT: "Test notification sent successfully",
  },
  SETTINGS: {
    UPDATED: "Settings updated successfully",
    SAVED: "Settings saved successfully",
  },
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_E164: /^\+?[1-9]\d{1,14}$/,
  PUSHOVER_USER_KEY: /^[a-zA-Z0-9]{30}$/,
  PUSHOVER_API_TOKEN: /^[a-zA-Z0-9]{30}$/,
  PUSHOVER_GROUP_KEY: /^g[a-zA-Z0-9]{29}$/,
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
  JOIN_CODE: /^[A-Z0-9]{6}$/,
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Re-export all types
export * from "./shared.js";

// Re-export all constants
export * from "./constants.js";

// Type guards and utility functions

/**
 * Type guard to check if a value is a valid MessagePersonality
 */
export function isMessagePersonality(value: any): value is import("./shared.js").MessagePersonality {
  const { MESSAGE_PERSONALITIES } = require("./constants.js");
  return MESSAGE_PERSONALITIES.includes(value);
}

/**
 * Type guard to check if a value is a valid CalendarSource
 */
export function isCalendarSource(value: any): value is import("./shared.js").CalendarSource {
  const { CALENDAR_SOURCES } = require("./constants.js");
  return CALENDAR_SOURCES.includes(value);
}

/**
 * Type guard to check if a value is a valid CalendarProvider
 */
export function isCalendarProvider(value: any): value is import("./shared.js").CalendarProvider {
  const { CALENDAR_PROVIDERS } = require("./constants.js");
  return CALENDAR_PROVIDERS.includes(value);
}

/**
 * Type guard to check if a value is a valid NotificationStatus
 */
export function isNotificationStatus(value: any): value is import("./shared.js").NotificationStatus {
  const { NOTIFICATION_STATUSES } = require("./constants.js");
  return NOTIFICATION_STATUSES.includes(value);
}

// Legacy alias
export const isSmsStatus = isNotificationStatus;

/**
 * Convert SQLite boolean (0 or 1) to JavaScript boolean
 */
export function sqliteToBoolean(value: number | boolean): boolean {
  if (typeof value === "boolean") return value;
  return value === 1;
}

/**
 * Convert JavaScript boolean to SQLite boolean (0 or 1)
 */
export function booleanToSqlite(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Format date to ISO string for SQLite
 */
export function formatDateForSqlite(date: Date): string {
  return date.toISOString();
}

/**
 * Parse SQLite datetime string to Date object
 */
export function parseSqliteDate(dateString: string): Date {
  return new Date(dateString);
}

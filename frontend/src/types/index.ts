export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  timezone: string;
  smsTime: string;
  messageStyle: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  isAllDay: boolean;
  source: "manual" | "google" | "microsoft" | "timetree";
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string; // REQUIRED
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay?: boolean;
}

export interface SettingsData {
  phoneNumber?: string;
  timezone?: string;
  smsTime?: string;
  messageStyle?: string;
}

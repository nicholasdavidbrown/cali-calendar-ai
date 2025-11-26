import { getApiBaseUrl } from "../utils/api";
import type {
  User,
  CalendarEvent,
  RegisterData,
  CreateEventData,
  SettingsData,
} from "../types";

const API_BASE = getApiBaseUrl();

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include", // Essential for cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authAPI = {
  getSetupStatus: () =>
    apiCall<{ needsSetup: boolean; hasUsers: boolean }>(
      "/api/auth/setup-status"
    ),

  login: (email: string, password: string) =>
    apiCall<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterData) =>
    apiCall<{ user: User; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiCall<{ message: string }>("/api/auth/logout", { method: "POST" }),

  getMe: () => apiCall<User>("/api/auth/me"),
};

export const calendarAPI = {
  getEvents: () => apiCall<CalendarEvent[]>("/api/calendar/events"),

  createEvent: (event: CreateEventData) =>
    apiCall<CalendarEvent>("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(event),
    }),

  updateEvent: (id: number, event: Partial<CreateEventData>) =>
    apiCall<CalendarEvent>(`/api/calendar/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(event),
    }),

  deleteEvent: (id: number) =>
    apiCall<{ message: string }>(`/api/calendar/events/${id}`, {
      method: "DELETE",
    }),
};

export const userAPI = {
  updateSettings: (settings: SettingsData) =>
    apiCall<User>("/api/users/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
};

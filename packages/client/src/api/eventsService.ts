import apiClient from './client';

export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  location?: string;
  isAllDay: boolean;
  formattedTime: string;
  description: string;
}

export interface EventsResponse {
  success: boolean;
  count: number;
  events: CalendarEvent[];
}

/**
 * Fetch calendar events for the next 24 hours
 */
export const fetchEvents24Hours = async (): Promise<EventsResponse> => {
  const response = await apiClient.get<EventsResponse>('/api/v1/calendar/events');
  return response.data;
};

/**
 * Fetch calendar events for the next 7 days
 */
export const fetchEventsWeek = async (): Promise<EventsResponse> => {
  const response = await apiClient.get<EventsResponse>('/api/v1/calendar/events/week');
  return response.data;
};

import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { StoredUser } from './userStorageService';
import * as userStorage from './userStorageService';
import { decryptToken, encryptToken } from '../utils/encryption';
import confidentialClientApp, { SCOPES } from '../config/auth';

/**
 * Microsoft Graph Calendar Service
 *
 * This service provides functions to interact with Microsoft Graph API
 * for fetching calendar events and managing access tokens.
 */

export interface CalendarEvent {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  isAllDay: boolean;
}

export interface FormattedEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  isAllDay: boolean;
  formattedTime: string;
}

/**
 * Creates an authenticated Microsoft Graph client
 * @param accessToken - Decrypted access token
 * @returns Configured Graph client instance
 */
export const getGraphClient = (accessToken: string): Client => {
  return Client.init({
    authProvider: (done: (error: any, token: string) => void) => {
      done(null, accessToken);
    },
  });
};

/**
 * Refreshes the access token using the refresh token
 * @param user - User document with encrypted tokens
 * @returns Updated user with new access token
 */
export const refreshAccessToken = async (user: StoredUser): Promise<StoredUser> => {
  try {
    // For MSAL, we use the silent token acquisition with the account
    // Since MSAL handles refresh tokens internally, we need to use acquireTokenSilent
    const decryptedAccessToken = decryptToken(user.accessToken);

    // Create a cache lookup account
    const silentRequest = {
      scopes: SCOPES,
      account: {
        homeAccountId: user.microsoftId,
        environment: 'login.microsoftonline.com',
        tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
        username: user.email,
        localAccountId: user.microsoftId,
        name: user.email,
        idTokenClaims: {},
      },
      forceRefresh: true,
    };

    const tokenResponse = await confidentialClientApp.acquireTokenSilent(silentRequest);

    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    // Update user with new token
    const updatedUser = await userStorage.updateUser(user.id, {
      accessToken: encryptToken(tokenResponse.accessToken),
      tokenExpiresAt: (tokenResponse.expiresOn || new Date(Date.now() + 3600 * 1000)).toISOString(),
    });

    if (!updatedUser) {
      throw new Error('Failed to update user with new token');
    }

    return updatedUser;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token. User may need to re-authenticate.');
  }
};

/**
 * Ensures the access token is valid, refreshing if necessary
 * @param user - User document
 * @returns User with valid access token
 */
const ensureValidToken = async (user: StoredUser): Promise<StoredUser> => {
  const now = new Date();
  const expiresAt = new Date(user.tokenExpiresAt);

  // Refresh if token expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    return await refreshAccessToken(user);
  }

  return user;
};

/**
 * Fetches calendar events for the next 24 hours
 * @param user - User document with encrypted tokens
 * @returns Array of formatted calendar events
 */
export const getEventsForNext24Hours = async (user: StoredUser): Promise<FormattedEvent[]> => {
  try {
    // Ensure token is valid
    const validUser = await ensureValidToken(user);

    // Decrypt access token
    const accessToken = decryptToken(validUser.accessToken);

    // Create Graph client
    const client = getGraphClient(accessToken);

    // Calculate time range
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Fetch events from Microsoft Graph
    const response = await client
      .api('/me/calendarview')
      .query({
        startDateTime: now.toISOString(),
        endDateTime: tomorrow.toISOString(),
      })
      .select('subject,start,end,location,isAllDay')
      .orderby('start/dateTime')
      .get();

    const events: CalendarEvent[] = response.value || [];

    // Format events
    return events.map((event) => formatEvent(event, validUser.timezone));
  } catch (error) {
    console.error('Error fetching 24-hour events:', error);

    // Check if it's a decryption error
    if (error instanceof Error && error.message.includes('Failed to decrypt token')) {
      throw new Error('TOKEN_DECRYPTION_ERROR');
    }

    throw new Error('Failed to fetch calendar events');
  }
};

/**
 * Fetches calendar events for the next 7 days
 * @param user - User document with encrypted tokens
 * @returns Array of formatted calendar events
 */
export const getEventsForNext7Days = async (user: StoredUser): Promise<FormattedEvent[]> => {
  try {
    // Ensure token is valid
    const validUser = await ensureValidToken(user);

    // Decrypt access token
    const accessToken = decryptToken(validUser.accessToken);

    // Create Graph client
    const client = getGraphClient(accessToken);

    // Calculate time range
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch events from Microsoft Graph
    const response = await client
      .api('/me/calendarview')
      .query({
        startDateTime: now.toISOString(),
        endDateTime: next7Days.toISOString(),
      })
      .select('subject,start,end,location,isAllDay')
      .orderby('start/dateTime')
      .get();

    const events: CalendarEvent[] = response.value || [];

    // Format events
    return events.map((event) => formatEvent(event, validUser.timezone));
  } catch (error) {
    console.error('Error fetching 7-day events:', error);

    // Check if it's a decryption error
    if (error instanceof Error && error.message.includes('Failed to decrypt token')) {
      throw new Error('TOKEN_DECRYPTION_ERROR');
    }

    throw new Error('Failed to fetch calendar events');
  }
};

/**
 * Formats a calendar event with timezone conversion
 * @param event - Raw event from Microsoft Graph
 * @param timezone - User's timezone
 * @returns Formatted event object
 */
const formatEvent = (event: CalendarEvent, timezone: string): FormattedEvent => {
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  // Format time string
  const formattedTime = formatEventTime(start, end, event.isAllDay, timezone);

  return {
    title: event.subject,
    start,
    end,
    location: event.location?.displayName,
    isAllDay: event.isAllDay,
    formattedTime,
  };
};

/**
 * Formats event time for display
 * @param start - Event start time
 * @param end - Event end time
 * @param isAllDay - Whether event is all-day
 * @param timezone - User's timezone
 * @returns Formatted time string
 */
const formatEventTime = (
  start: Date,
  end: Date,
  isAllDay: boolean,
  timezone: string,
): string => {
  if (isAllDay) {
    return 'All Day';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  };

  const startTime = start.toLocaleString('en-US', options);
  const endTime = end.toLocaleString('en-US', options);

  return `${startTime} - ${endTime}`;
};

/**
 * Formats a full event description for SMS
 * @param event - Formatted event
 * @returns Event description string
 */
export const formatEventForSMS = (event: FormattedEvent): string => {
  let description = `${event.formattedTime} - ${event.title}`;

  if (event.location) {
    description += ` (${event.location})`;
  }

  return description;
};

/**
 * Groups events by time of day
 * @param events - Array of formatted events
 * @returns Grouped events by morning/afternoon/evening
 */
const groupEventsByTimeOfDay = (events: FormattedEvent[]): {
  morning: FormattedEvent[];
  afternoon: FormattedEvent[];
  evening: FormattedEvent[];
} => {
  return events.reduce(
    (groups, event) => {
      const hour = event.start.getHours();
      if (hour < 12) {
        groups.morning.push(event);
      } else if (hour < 17) {
        groups.afternoon.push(event);
      } else {
        groups.evening.push(event);
      }
      return groups;
    },
    { morning: [] as FormattedEvent[], afternoon: [] as FormattedEvent[], evening: [] as FormattedEvent[] }
  );
};

/**
 * Creates a calendar event for a user
 * @param user - User document with encrypted tokens
 * @param eventDetails - Event details to create
 * @returns Created event information
 */
export const createCalendarEvent = async (
  user: StoredUser,
  eventDetails: {
    subject: string;
    start: Date;
    end: Date;
    location?: string;
    isAllDay: boolean;
  }
): Promise<CalendarEvent> => {
  try {
    // Ensure token is valid
    const validUser = await ensureValidToken(user);

    // Decrypt access token
    const accessToken = decryptToken(validUser.accessToken);

    // Create Graph client
    const client = getGraphClient(accessToken);

    // Prepare event data for Microsoft Graph
    const event = {
      subject: eventDetails.subject,
      start: {
        dateTime: eventDetails.start.toISOString(),
        timeZone: user.timezone,
      },
      end: {
        dateTime: eventDetails.end.toISOString(),
        timeZone: user.timezone,
      },
      location: eventDetails.location ? {
        displayName: eventDetails.location,
      } : undefined,
      isAllDay: eventDetails.isAllDay,
    };

    // Create the event via Microsoft Graph API
    const response = await client
      .api('/me/events')
      .post(event);

    console.log(`✅ Calendar event created: ${eventDetails.subject} for ${user.email}`);

    return response;
  } catch (error) {
    console.error('Error creating calendar event:', error);

    // Check if it's a decryption error
    if (error instanceof Error && error.message.includes('Failed to decrypt token')) {
      throw new Error('TOKEN_DECRYPTION_ERROR');
    }

    throw new Error('Failed to create calendar event');
  }
};

/**
 * Formats multiple events into a calendar summary for SMS
 * @param events - Array of formatted events
 * @param userName - User's name for greeting
 * @returns Complete SMS message
 */
export const formatCalendarSummary = (events: FormattedEvent[], userName: string): string => {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  if (events.length === 0) {
    return `Good morning${userName ? ` ${userName}` : ''}! Free day ahead - no events scheduled for ${dayName}. Enjoy!`;
  }

  const greeting = `Good morning${userName ? ` ${userName}` : ''}!`;
  const count = events.length === 1 ? '1 event' : `${events.length} events`;
  const firstTime = events[0].formattedTime.split(' - ')[0];
  const lastEvent = events[events.length - 1];
  const lastTime = lastEvent.formattedTime.split(' - ')[1] || lastEvent.formattedTime;

  let message = `${greeting} ${count} today (${firstTime} - ${lastTime}):\n\n`;

  // Group events if more than 4
  if (events.length > 4) {
    const groups = groupEventsByTimeOfDay(events);
    if (groups.morning.length > 0) {
      message += `Morning (${groups.morning.length}):\n`;
      groups.morning.forEach((event) => {
        message += `• ${formatEventForSMS(event)}\n`;
      });
      message += '\n';
    }
    if (groups.afternoon.length > 0) {
      message += `Afternoon (${groups.afternoon.length}):\n`;
      groups.afternoon.forEach((event) => {
        message += `• ${formatEventForSMS(event)}\n`;
      });
      message += '\n';
    }
    if (groups.evening.length > 0) {
      message += `Evening (${groups.evening.length}):\n`;
      groups.evening.forEach((event) => {
        message += `• ${formatEventForSMS(event)}\n`;
      });
    }
  } else {
    // List all events individually
    events.forEach((event, index) => {
      message += `${index + 1}. ${formatEventForSMS(event)}\n`;
    });
  }

  message += '\nHave a great day!';

  return message;
};

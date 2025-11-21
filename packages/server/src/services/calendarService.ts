import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { IUser } from '../models/User';
import User from '../models/User';
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
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
};

/**
 * Refreshes the access token using the refresh token
 * @param user - User document with encrypted tokens
 * @returns Updated user with new access token
 */
export const refreshAccessToken = async (user: IUser): Promise<IUser> => {
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
    user.accessToken = encryptToken(tokenResponse.accessToken);
    user.tokenExpiresAt = tokenResponse.expiresOn || new Date(Date.now() + 3600 * 1000);
    await user.save();

    return user;
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
const ensureValidToken = async (user: IUser): Promise<IUser> => {
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
export const getEventsForNext24Hours = async (user: IUser): Promise<FormattedEvent[]> => {
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
    throw new Error('Failed to fetch calendar events');
  }
};

/**
 * Fetches calendar events for the next 7 days
 * @param user - User document with encrypted tokens
 * @returns Array of formatted calendar events
 */
export const getEventsForNext7Days = async (user: IUser): Promise<FormattedEvent[]> => {
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
 * Formats multiple events into a calendar summary for SMS
 * @param events - Array of formatted events
 * @param userName - User's name for greeting
 * @returns Complete SMS message
 */
export const formatCalendarSummary = (events: FormattedEvent[], userName: string): string => {
  if (events.length === 0) {
    return `Good morning${userName ? ` ${userName}` : ''}! No events scheduled for today.`;
  }

  let message = `Good morning${userName ? ` ${userName}` : ''}! Here's your schedule for today:\n\n`;

  events.forEach((event) => {
    message += `${formatEventForSMS(event)}\n`;
  });

  message += '\nHave a great day!';

  return message;
};

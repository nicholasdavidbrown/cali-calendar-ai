import * as msal from '@azure/msal-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * MSAL Configuration for Microsoft OAuth 2.0
 *
 * This configuration is used to authenticate users via Microsoft personal accounts
 * (Outlook, Hotmail, Live) and obtain access tokens for Microsoft Graph API.
 */

const msalConfig: msal.Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message) {
        if (process.env.NODE_ENV === 'development') {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Info,
    },
  },
};

// Create confidential client application
const confidentialClientApp = new msal.ConfidentialClientApplication(msalConfig);

// Microsoft Graph API scopes
export const SCOPES = [
  'User.Read',
  'Calendars.Read',
  'offline_access',
];

// Redirect URI
export const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3001/auth/callback';

export default confidentialClientApp;

import twilio from 'twilio';
import { StoredUser } from './userStorageService';
import * as userStorage from './userStorageService';
import { getEventsForNext24Hours, formatCalendarSummary } from './calendarService';
import { generateCalendarMessage, isClaudeConfigured } from './claudeService';

/**
 * SMS Service for Twilio Integration
 *
 * This service provides functions to send SMS messages via Twilio,
 * including sending calendar summaries to users.
 */

let twilioClient: twilio.Twilio | null = null;

/**
 * Initializes the Twilio client with credentials from environment variables
 * @returns Configured Twilio client instance
 * @throws Error if required environment variables are missing
 */
export const initializeTwilioClient = (): twilio.Twilio => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.');
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
};

/**
 * Gets or initializes the Twilio client
 * @returns Twilio client instance
 */
const getTwilioClient = (): twilio.Twilio => {
  if (!twilioClient) {
    return initializeTwilioClient();
  }
  return twilioClient;
};

/**
 * Sends an SMS message to a phone number
 * @param to - Recipient phone number (E.164 format, e.g., +1234567890)
 * @param message - Message content to send
 * @returns Message SID from Twilio
 * @throws Error if SMS sending fails
 */
export const sendSMS = async (to: string, message: string): Promise<string> => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      throw new Error('Missing TWILIO_PHONE_NUMBER in environment variables.');
    }

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });

    console.log(`SMS sent successfully to ${to}. Message SID: ${result.sid}`);
    return result.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Sends a daily calendar summary SMS to a user
 * @param user - User document with phone number and calendar access
 * @returns Message SID from Twilio
 * @throws Error if fetching events or sending SMS fails
 */
export const sendDailySummary = async (user: StoredUser): Promise<string> => {
  try {
    // Check if user has a phone number
    if (!user.phone) {
      throw new Error('User does not have a phone number set');
    }

    // Fetch the next 24 hours of events
    const events = await getEventsForNext24Hours(user);

    // Get user's name from email (simple approach)
    const userName = user.email.split('@')[0];

    // Generate message using Claude AI with user's preferred message style
    let message: string;

    if (isClaudeConfigured()) {
      try {
        console.log(`🤖 Generating Claude message for ${user.email} (style: ${user.messageStyle})`);
        message = await generateCalendarMessage(events, userName, user.messageStyle);
        console.log(`✅ Claude message generated successfully`);
      } catch (claudeError) {
        console.error('❌ Claude API error, falling back to default format:', claudeError);
        console.log(`📝 Using default message format as fallback`);
        message = formatCalendarSummary(events, userName);
      }
    } else {
      console.warn('⚠️  Claude API not configured, using default message format');
      message = formatCalendarSummary(events, userName);
    }

    // Send the SMS to the main user
    const messageSid = await sendSMS(user.phone, message);
    console.log(`📱 Daily summary sent to ${user.email} (${user.phone})`);

    // Save to SMS history for main user
    await userStorage.addSmsHistoryEntry(user.id, {
      message,
      recipientPhone: user.phone,
      messageStyle: user.messageStyle,
      eventCount: events.length,
    });

    // Send to active family members
    const familyMembers = user.familyMembers || [];
    const activeFamilyMembers = familyMembers.filter((member) => member.isActive);

    if (activeFamilyMembers.length > 0) {
      console.log(`👨‍👩‍👧‍👦 Sending to ${activeFamilyMembers.length} family member(s)...`);

      for (const member of activeFamilyMembers) {
        try {
          // Personalize message with family member's name
          const familyMessage = message.replace(userName, member.name);
          await sendSMS(member.phone, familyMessage);
          console.log(`  ✅ Sent to ${member.name} (${member.phone})`);

          // Save to SMS history for family member
          await userStorage.addSmsHistoryEntry(user.id, {
            message: familyMessage,
            recipientPhone: member.phone,
            recipientName: member.name,
            messageStyle: user.messageStyle,
            eventCount: events.length,
          });
        } catch (error) {
          console.error(`  ❌ Failed to send to ${member.name} (${member.phone}):`, error);
          // Continue with other family members even if one fails
        }
      }
    }

    // Update last SMS sent date
    await userStorage.updateUser(user.id, {
      lastSmsSentDate: new Date().toISOString(),
    });

    console.log(`✅ SMS notifications completed for ${user.email}`);
    return messageSid;
  } catch (error) {
    console.error(`Error sending daily summary to ${user.email}:`, error);
    throw new Error(`Failed to send daily summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates that Twilio is properly configured
 * @returns true if configured, false otherwise
 */
export const isTwilioConfigured = (): boolean => {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
};

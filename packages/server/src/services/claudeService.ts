import Anthropic from '@anthropic-ai/sdk';
import { MessageStyle } from '../models/User';
import { FormattedEvent } from './calendarService';

/**
 * Claude AI Service for generating SMS messages
 *
 * This service uses Claude API to generate personalized SMS messages
 * based on calendar events and user preferences.
 */

let anthropicClient: Anthropic | null = null;

/**
 * Initializes the Anthropic client with API key from environment variables
 * @returns Configured Anthropic client instance
 * @throws Error if API key is missing
 */
export const initializeClaudeClient = (): Anthropic => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY in environment variables.');
  }

  anthropicClient = new Anthropic({
    apiKey,
  });

  return anthropicClient;
};

/**
 * Gets or initializes the Claude client
 * @returns Anthropic client instance
 */
const getClaudeClient = (): Anthropic => {
  if (!anthropicClient) {
    return initializeClaudeClient();
  }
  return anthropicClient;
};

/**
 * Style-specific prompts for Claude
 */
const stylePrompts: Record<MessageStyle, string> = {
  professional: `Create a professional and concise daily schedule summary. Use a polite, business-appropriate tone. Start with a professional greeting.`,

  witty: `Create a fun and witty daily schedule summary with clever wordplay and light humor. Make the message engaging and upbeat while still being informative. Start with a creative greeting.`,

  sarcastic: `Create a sarcastic but playful daily schedule summary. Use dry humor and witty observations about the day ahead. Keep it light-hearted and entertaining. Start with a sarcastic greeting.`,

  mission: `Create a motivational mission briefing-style schedule summary. Frame the day's events as a mission with objectives to accomplish. Use language like "Today's Mission", "Objectives", and "Mission Timeline". Make it sound epic and motivating.`,
};

/**
 * Formats events into a structured list for Claude
 * @param events - Array of formatted calendar events
 * @returns Formatted string of events
 */
const formatEventsForPrompt = (events: FormattedEvent[]): string => {
  if (events.length === 0) {
    return 'No events scheduled';
  }

  return events
    .map((event) => {
      let eventStr = `- ${event.formattedTime}: ${event.title}`;
      if (event.location) {
        eventStr += ` at ${event.location}`;
      }
      return eventStr;
    })
    .join('\n');
};

/**
 * Generates a personalized SMS message using Claude AI
 * @param events - Array of calendar events
 * @param userName - User's name for personalization
 * @param style - Message style preference
 * @returns Generated SMS message
 * @throws Error if Claude API call fails
 */
export const generateCalendarMessage = async (
  events: FormattedEvent[],
  userName: string,
  style: MessageStyle,
): Promise<string> => {
  try {
    const client = getClaudeClient();

    const hasEvents = events.length > 0;
    const eventsText = formatEventsForPrompt(events);
    const stylePrompt = stylePrompts[style];

    const systemPrompt = `You are a helpful AI assistant that creates personalized daily calendar SMS messages. ${stylePrompt}

Important guidelines:
- Keep the message under 160 characters if possible, maximum 300 characters
- Be concise but engaging
- Include the user's name (${userName}) if it fits naturally
- Format should be SMS-friendly (no markdown, emojis are okay but use sparingly)
- Match the requested tone/style consistently
- If there are no events, create an appropriate message for a free day`;

    const userPrompt = hasEvents
      ? `Create a daily schedule SMS message for ${userName} with these events:\n\n${eventsText}`
      : `Create a daily schedule SMS message for ${userName} who has no events scheduled today.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`,
        },
      ],
    });

    // Extract text from Claude's response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return textContent.text.trim();
  } catch (error) {
    console.error('Error generating message with Claude:', error);
    throw new Error(`Failed to generate message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates that Claude is properly configured
 * @returns true if configured, false otherwise
 */
export const isClaudeConfigured = (): boolean => {
  return !!process.env.ANTHROPIC_API_KEY;
};

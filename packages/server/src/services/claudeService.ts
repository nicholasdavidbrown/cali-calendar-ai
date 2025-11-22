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
  professional: `Create a professional and well-organized daily schedule summary.
- Use a polite, business-appropriate tone
- Start with a professional greeting mentioning the day
- List events in clear chronological order with times
- Highlight any important meetings or time-sensitive items
- End with a brief, professional closing`,

  witty: `Create a fun and engaging daily schedule summary with personality.
- Start with a creative, witty greeting
- Use clever wordplay or light humor when describing events
- Make connections between events if relevant (e.g., "coffee meeting before presentation - good strategy!")
- Keep it upbeat and energetic
- End with an encouraging, fun closing`,

  sarcastic: `Create a playfully sarcastic daily schedule summary.
- Start with a dry, witty greeting
- Add sarcastic commentary about the day's events (e.g., "another thrilling meeting")
- Use irony and understatement
- Keep it light-hearted, not mean-spirited
- End with a sarcastic but supportive closing`,

  mission: `Create an epic mission briefing-style schedule summary.
- Start with "MISSION BRIEFING" or similar dramatic opening
- Frame each event as a mission objective or tactical operation
- Use military/action-movie language ("0900 hours", "objective", "rendezvous")
- Build excitement and motivation
- End with an epic rallying cry or mission completion message`,
};

/**
 * Analyzes events to provide context for Claude
 * @param events - Array of formatted calendar events
 * @returns Analysis object with event insights
 */
const analyzeEvents = (events: FormattedEvent[]): {
  totalEvents: number;
  hasBackToBack: boolean;
  firstEventTime: string;
  lastEventTime: string;
  hasVirtualMeetings: boolean;
  busyPeriods: string[];
} => {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      hasBackToBack: false,
      firstEventTime: '',
      lastEventTime: '',
      hasVirtualMeetings: false,
      busyPeriods: [],
    };
  }

  // Check for back-to-back meetings
  let hasBackToBack = false;
  for (let i = 0; i < events.length - 1; i++) {
    const currentEnd = events[i].end.getTime();
    const nextStart = events[i + 1].start.getTime();
    if (nextStart - currentEnd <= 15 * 60 * 1000) { // 15 minutes or less
      hasBackToBack = true;
      break;
    }
  }

  // Check for virtual meetings
  const virtualKeywords = ['zoom', 'teams', 'meet', 'webex', 'skype', 'virtual', 'online'];
  const hasVirtualMeetings = events.some(
    (e) =>
      e.location &&
      virtualKeywords.some((keyword) => e.location!.toLowerCase().includes(keyword))
  );

  // Find busy periods (3+ events within 4 hours)
  const busyPeriods: string[] = [];
  // Simple busy detection: morning (before 12pm) vs afternoon
  const morningEvents = events.filter((e) => e.start.getHours() < 12);
  const afternoonEvents = events.filter((e) => e.start.getHours() >= 12);

  if (morningEvents.length >= 3) busyPeriods.push('morning');
  if (afternoonEvents.length >= 3) busyPeriods.push('afternoon');

  return {
    totalEvents: events.length,
    hasBackToBack,
    firstEventTime: events[0].formattedTime.split(' - ')[0],
    lastEventTime: events[events.length - 1].formattedTime.split(' - ')[1] || events[events.length - 1].formattedTime,
    hasVirtualMeetings,
    busyPeriods,
  };
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

  let eventList = events
    .map((event, index) => {
      let eventStr = `${index + 1}. ${event.formattedTime} - ${event.title}`;
      if (event.location) {
        eventStr += `\n   Location: ${event.location}`;
      }
      if (event.isAllDay) {
        eventStr += '\n   [All Day Event]';
      }
      return eventStr;
    })
    .join('\n\n');

  // Add context
  const analysis = analyzeEvents(events);
  let context = '\n\nContext:';
  if (analysis.hasBackToBack) {
    context += '\n- You have back-to-back meetings (less than 15 min between events)';
  }
  if (analysis.hasVirtualMeetings) {
    context += '\n- Some meetings are virtual/online';
  }
  if (analysis.busyPeriods.length > 0) {
    context += `\n- Busy ${analysis.busyPeriods.join(' and ')} (3+ events)`;
  }

  return eventList + (context.length > 10 ? context : '');
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

    const analysis = analyzeEvents(events);

    const systemPrompt = `You are an expert at creating personalized daily calendar SMS messages.

STYLE REQUIREMENTS:
${stylePrompt}

MESSAGE STRUCTURE:
1. Greeting - Mention the day and user's name naturally
2. Event List - Present events clearly with times
3. Optional Insight - Add helpful context if relevant (e.g., "pack lunch between meetings", "early start today")
4. Closing - Brief, style-appropriate sign-off

FORMATTING RULES:
- Keep total message 200-400 characters for readability
- Use clear time formats (e.g., "9:00 AM" not "0900")
- List events chronologically
- Use line breaks for clarity
- NO markdown formatting (no **, __, etc.)
- Minimal emojis (1-2 max, only if they fit the style)
- SMS-friendly characters only

CONTENT GUIDELINES:
- Always include event times prominently
- Mention locations when important or interesting
- Note transitions (e.g., "Quick break before 2 PM meeting")
- Highlight what matters: important meetings, tight schedules, free time
- Be conversational and natural, not robotic`;

    let userPrompt = '';
    if (hasEvents) {
      userPrompt = `Create a daily schedule SMS for ${userName}.

Today's Events:
${eventsText}

${analysis.totalEvents > 0 ? `\nSummary: ${analysis.totalEvents} event${analysis.totalEvents > 1 ? 's' : ''} from ${analysis.firstEventTime} to ${analysis.lastEventTime}` : ''}`;
    } else {
      userPrompt = `Create a daily schedule SMS for ${userName} who has no events scheduled today. Make it positive and suggest they enjoy their free day.`;
    }

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

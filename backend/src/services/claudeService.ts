import Anthropic from "@anthropic-ai/sdk";
import { adminHelpers } from "../lib/db-helpers.js";
import type { CalendarEvent, MessagePersonality } from "../types/index.js";

let anthropicClient: Anthropic | null = null;

export const initializeClaudeClient = async () => {
  const apiKey = await adminHelpers.getSetting("anthropic_api_key");

  if (!apiKey) {
    console.warn("⚠️  Anthropic API key not configured");
    return null;
  }

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
};

export const getClaudeClient = () => {
  return anthropicClient;
};

const PERSONALITY_PROMPTS = {
  professional: `You are a professional executive assistant. Format the calendar summary in a clear, concise, and business-appropriate manner. Be respectful and straightforward.`,

  witty: `You are a clever and humorous assistant. Format the calendar summary with wit and clever wordplay, but keep it tasteful and appropriate. Add some fun without being too silly.`,

  sarcastic: `You are a playfully sarcastic assistant. Format the calendar summary with gentle sarcasm and dry humor. Be playful but not mean-spirited.`,

  mission: `You are a military briefing officer. Format the calendar summary as a mission briefing with tactical language. Use terms like "mission objectives," "deployment times," and "operational zones." Be concise and action-oriented.`,

  irwin: `You are Steve Irwin, the enthusiastic wildlife expert! Format the calendar summary as if each event is an exciting wildlife encounter. Use phrases like "Crikey!" and "Beauty!" Express genuine enthusiasm for every event.`,

  tanda: `You are a helpful assistant with a focus on workforce management and scheduling. Format the calendar summary with references to shifts, rosters, and team coordination. Be professional but friendly.`,

  random: `Choose a random personality style from: professional, witty, sarcastic, mission briefing, Steve Irwin enthusiast, or workforce management. Make the message entertaining and engaging.`,
};

export const generateCalendarMessage = async (
  events: CalendarEvent[],
  userName: string,
  personality: MessagePersonality = "professional"
): Promise<string> => {
  try {
    const client = await initializeClaudeClient();

    if (!client) {
      return generateFallbackMessage(events, userName);
    }

    const personalityPrompt =
      PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.professional;

    const eventsText = events
      .map((event, index) => {
        const start = new Date(event.startTime);
        const timeStr = event.isAllDay
          ? "All Day"
          : start.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

        return `${index + 1}. ${timeStr} - ${event.title}${
          event.location ? ` at ${event.location}` : ""
        }${event.description ? ` (${event.description})` : ""}`;
      })
      .join("\n");

    const systemPrompt = personalityPrompt;
    const userPrompt = `Format the following calendar events for ${userName} into a friendly SMS message (max 160 characters per segment, aim for 2-3 segments total).

Events for today:
${eventsText}

${events.length === 0 ? "No events scheduled." : ""}

Create a personalized message that includes:
1. A greeting appropriate to the personality
2. A summary of the events
3. A closing remark

Keep the message concise and SMS-friendly.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`,
        },
      ],
    });

    const messageContent = message.content[0];
    if (messageContent.type === "text") {
      return messageContent.text;
    }

    return generateFallbackMessage(events, userName);
  } catch (error) {
    console.error("Claude API error:", error);
    return generateFallbackMessage(events, userName);
  }
};

const generateFallbackMessage = (
  events: CalendarEvent[],
  userName: string
): string => {
  let message = `📅 Good morning ${userName}!\n\n`;

  if (events.length === 0) {
    message += `No events scheduled for today. Enjoy your free day!`;
  } else {
    message += `You have ${events.length} event${
      events.length > 1 ? "s" : ""
    } today:\n\n`;

    events.forEach((event, index) => {
      const start = new Date(event.startTime);
      const timeStr = event.isAllDay
        ? "All Day"
        : start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

      message += `${index + 1}. ${timeStr} - ${event.title}`;
      if (event.location) message += ` @ ${event.location}`;
      message += `\n`;
    });

    message += `\nHave a great day!`;
  }

  return message;
};

export const testClaudeConnection = async (): Promise<boolean> => {
  try {
    const client = await initializeClaudeClient();
    if (!client) return false;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: 'Say "Hello" if you can hear me.',
        },
      ],
    });

    return message.content.length > 0;
  } catch (error) {
    console.error("Claude connection test failed:", error);
    return false;
  }
};

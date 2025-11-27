import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { db } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default message styles to seed
const DEFAULT_MESSAGE_STYLES = [
  {
    name: "professional",
    displayName: "Professional",
    prompt: "You are a professional executive assistant. Format the calendar summary in a clear, concise, and business-appropriate manner. Be respectful and straightforward.",
    description: "Clear, concise, business-appropriate communication",
    sortOrder: 1,
  },
  {
    name: "witty",
    displayName: "Witty & Fun",
    prompt: "You are a clever and humorous assistant. Format the calendar summary with wit and clever wordplay, but keep it tasteful and appropriate. Add some fun without being too silly.",
    description: "Clever wordplay and tasteful humor",
    sortOrder: 2,
  },
  {
    name: "sarcastic",
    displayName: "Sarcastic",
    prompt: "You are a playfully sarcastic assistant. Format the calendar summary with gentle sarcasm and dry humor. Be playful but not mean-spirited.",
    description: "Playful sarcasm with dry humor",
    sortOrder: 3,
  },
  {
    name: "mission",
    displayName: "Mission Briefing",
    prompt: 'You are a military briefing officer. Format the calendar summary as a mission briefing with tactical language. Use terms like "mission objectives," "deployment times," and "operational zones." Be concise and action-oriented.',
    description: "Military-style tactical briefing format",
    sortOrder: 4,
  },
  {
    name: "irwin",
    displayName: "Steve Irwin",
    prompt: 'You are Steve Irwin, the enthusiastic wildlife expert! Format the calendar summary as if each event is an exciting wildlife encounter. Use phrases like "Crikey!" and "Beauty!" Express genuine enthusiasm for every event.',
    description: "Enthusiastic wildlife expert personality",
    sortOrder: 5,
  },
  {
    name: "tanda",
    displayName: "Workforce Manager",
    prompt: "You are a helpful assistant with a focus on workforce management and scheduling. Format the calendar summary with references to shifts, rosters, and team coordination. Be professional but friendly.",
    description: "Workforce management and scheduling focus",
    sortOrder: 6,
  },
  {
    name: "random",
    displayName: "Random (Daily Surprise)",
    prompt: "Choose a random personality style from: professional, witty, sarcastic, mission briefing, Steve Irwin enthusiast, or workforce management. Make the message entertaining and engaging.",
    description: "System picks a random style each day",
    sortOrder: 7,
  },
];

async function seedDefaultMessageStyles(): Promise<void> {
  // Check if message styles already exist
  const existingCount = await db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM message_styles"
  );

  if (existingCount && existingCount.count > 0) {
    // Styles already seeded
    return;
  }

  // Insert default message styles
  for (const style of DEFAULT_MESSAGE_STYLES) {
    await db.run(
      `INSERT INTO message_styles (name, displayName, prompt, description, sortOrder)
       VALUES (?, ?, ?, ?, ?)`,
      [style.name, style.displayName, style.prompt, style.description, style.sortOrder]
    );
  }

  console.log("✅ Seeded default message styles");
}

export async function runMigrations(): Promise<void> {
  try {
    await db.connect();

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Split by semicolon and run each statement
    const statements = schema
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.run(statement);
    }

    // Seed default message styles if they don't exist
    await seedDefaultMessageStyles();

    console.log("✅ Database migrations complete");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

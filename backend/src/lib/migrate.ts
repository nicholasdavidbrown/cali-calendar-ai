import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { db } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    console.log("✅ Database migrations complete");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

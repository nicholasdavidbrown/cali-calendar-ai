import { beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../lib/database.js';
import { runMigrations } from '../lib/migrate.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use in-memory database for tests
const TEST_DB_PATH = ':memory:';

// Override DB_PATH for tests
process.env.DB_PATH = TEST_DB_PATH;

beforeAll(async () => {
  // Connect to test database
  await db.connect();
  // Run migrations
  await runMigrations();
});

afterAll(async () => {
  // Close database connection
  await db.close();
});

beforeEach(async () => {
  // Clean up all tables before each test
  const tables = [
    'users',
    'calendar_events',
    'family_members',
    'notification_history',
    'join_codes',
    'calendar_integrations',
    'admin_settings',
    'system_setup'
  ];

  for (const table of tables) {
    await db.run(`DELETE FROM ${table}`);
  }
});

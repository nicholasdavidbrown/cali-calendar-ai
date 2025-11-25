# Cali Calendar AI - Simplified Rebuild Plan: Phases 1-4

> **Status:** Git and SERN template already setup ✅
>
> This simplified version removes already completed tasks and adjusts for the current project structure:
> - `backend/` (Express + TypeScript)
> - `frontend/` (React + Vite + TypeScript)
> - SQLite with sqlite3 (not Prisma)
> - Yarn 4 Berry
> - Docker already configured

---

## Project Overview

Transform the Cali Calendar AI into a self-hosted application with:
- Email/password authentication (replace Microsoft OAuth)
- SQLite database with sqlite3
- Admin dashboard for API key management
- Multiple calendar integrations (manual, TimeTree, Google Calendar, optional Microsoft)
- SMS notifications with AI-powered messages

---

# Phase 1: Shared Types Setup

## ✅ Already Complete
- Git repository initialized
- SERN template structure created
- Docker setup complete
- Basic backend and frontend running

## Step 1.1: Create Shared Types Library

Since we don't use a monorepo with workspaces, create a shared types folder in backend that can be imported by both backend and frontend.

**File: `backend/src/types/shared.ts`**

```typescript
// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  source: "manual" | "google" | "microsoft" | "timetree";
  userId: number;
}

export interface FamilyMember {
  id: number;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
  userId: number;
}

export interface SmsHistory {
  id: number;
  phoneNumber: string;
  message: string;
  status: "sent" | "delivered" | "failed" | "queued";
  messageStyle: string;
  userId: number;
  eventCount: number;
  sentAt: string;
}

export type MessagePersonality =
  | "professional"
  | "witty"
  | "sarcastic"
  | "mission"
  | "irwin"
  | "tanda"
  | "random";

export type CalendarSource = "manual" | "google" | "microsoft" | "timetree";
```

**File: `backend/src/types/constants.ts`**

```typescript
export const MESSAGE_PERSONALITIES = [
  "professional",
  "witty",
  "sarcastic",
  "mission",
  "irwin",
  "tanda",
  "random",
] as const;

export const CALENDAR_SOURCES = [
  "manual",
  "google",
  "microsoft",
  "timetree",
] as const;

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Brisbane",
] as const;
```

## Step 1.2: Export Types

**File: `backend/src/types/index.ts`**

```typescript
export * from "./shared";
export * from "./constants";
```

## Phase 1 Checklist

- [ ] Created shared types in `backend/src/types/`
- [ ] Created type definitions for User, CalendarEvent, FamilyMember, SmsHistory
- [ ] Created constants for personalities and calendar sources
- [ ] Types can be imported in backend
- [ ] Types can be copied/imported to frontend as needed

---

# Phase 2: Database Setup (SQLite with sqlite3)

## Goal

Set up SQLite database with raw SQL migrations and create database helper functions.

## Step 2.1: Install Database Dependencies

```bash
cd backend
yarn add sqlite3
yarn add -D @types/sqlite3
```

## Step 2.2: Create Database Service

**File: `backend/src/lib/database.ts`**

```typescript
import sqlite3 from "sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/cali.db");

// Enable verbose mode in development
const sqlite = process.env.NODE_ENV === "development"
  ? sqlite3.verbose()
  : sqlite3;

class Database {
  private db: sqlite3.Database | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("✅ Connected to SQLite database");
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }
}

export const db = new Database();
```

## Step 2.3: Create Database Schema

**File: `backend/src/lib/schema.sql`**

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  phoneNumber TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  smsTime TEXT DEFAULT '07:00',
  messageStyle TEXT DEFAULT 'professional',
  isActive INTEGER DEFAULT 1,
  isAdmin INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt DATETIME
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  startTime DATETIME NOT NULL,
  endTime DATETIME NOT NULL,
  location TEXT,
  isAllDay INTEGER DEFAULT 0,
  source TEXT NOT NULL,
  sourceId TEXT,
  userId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(userId, startTime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phoneNumber TEXT NOT NULL,
  relationship TEXT,
  isActive INTEGER DEFAULT 1,
  joinedVia TEXT,
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  userId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(userId);
CREATE INDEX IF NOT EXISTS idx_family_members_phone ON family_members(phoneNumber);

-- SMS history table
CREATE TABLE IF NOT EXISTS sms_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  messageStyle TEXT NOT NULL,
  twilioSid TEXT UNIQUE,
  errorCode TEXT,
  errorMessage TEXT,
  userId INTEGER NOT NULL,
  eventCount INTEGER DEFAULT 0,
  sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deliveredAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sms_history_user ON sms_history(userId, sentAt);
CREATE INDEX IF NOT EXISTS idx_sms_history_status ON sms_history(status);

-- Join codes table
CREATE TABLE IF NOT EXISTS join_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  userId INTEGER NOT NULL,
  isUsed INTEGER DEFAULT 0,
  usedBy TEXT,
  usedAt DATETIME,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_join_codes_code ON join_codes(code);
CREATE INDEX IF NOT EXISTS idx_join_codes_user ON join_codes(userId);
CREATE INDEX IF NOT EXISTS idx_join_codes_expires ON join_codes(expiresAt);

-- Calendar integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  tokenExpiry DATETIME,
  timetreeEmail TEXT,
  timetreePassword TEXT,
  isActive INTEGER DEFAULT 1,
  lastSyncAt DATETIME,
  syncError TEXT,
  userId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user ON calendar_integrations(userId);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  isSecret INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- System setup table
CREATE TABLE IF NOT EXISTS system_setup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isCompleted INTEGER DEFAULT 0,
  adminEmail TEXT,
  setupCompletedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Step 2.4: Create Migration Runner

**File: `backend/src/lib/migrate.ts`**

```typescript
import fs from "fs";
import path from "path";
import { db } from "./database";

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
```

## Step 2.5: Create Database Helper Functions

**File: `backend/src/lib/db-helpers.ts`**

```typescript
import { db } from "./database";
import type { User, CalendarEvent, FamilyMember } from "../types";

// User helpers
export const userHelpers = {
  findByEmail: async (email: string): Promise<User | undefined> => {
    return db.get<User>("SELECT * FROM users WHERE email = ?", [email]);
  },

  findById: async (id: number): Promise<User | undefined> => {
    return db.get<User>("SELECT * FROM users WHERE id = ?", [id]);
  },

  create: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isAdmin?: boolean;
  }): Promise<User> => {
    const result = await db.run(
      `INSERT INTO users (email, password, firstName, lastName, isAdmin)
       VALUES (?, ?, ?, ?, ?)`,
      [data.email, data.password, data.firstName, data.lastName, data.isAdmin ? 1 : 0]
    );

    return (await db.get<User>("SELECT * FROM users WHERE id = ?", [result.lastID]))!;
  },

  updateLastLogin: async (id: number): Promise<void> => {
    await db.run(
      "UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  },
};

// Calendar event helpers
export const eventHelpers = {
  findByUserId: async (userId: number): Promise<CalendarEvent[]> => {
    return db.all<CalendarEvent>(
      "SELECT * FROM calendar_events WHERE userId = ? ORDER BY startTime ASC",
      [userId]
    );
  },

  findUpcoming: async (userId: number, hours: number = 24): Promise<CalendarEvent[]> => {
    const futureTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    return db.all<CalendarEvent>(
      `SELECT * FROM calendar_events
       WHERE userId = ? AND startTime >= datetime('now') AND startTime <= ?
       ORDER BY startTime ASC`,
      [userId, futureTime]
    );
  },

  create: async (data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    isAllDay?: boolean;
    source: string;
    userId: number;
  }): Promise<CalendarEvent> => {
    const result = await db.run(
      `INSERT INTO calendar_events
       (title, description, startTime, endTime, location, isAllDay, source, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description || null,
        data.startTime.toISOString(),
        data.endTime.toISOString(),
        data.location || null,
        data.isAllDay ? 1 : 0,
        data.source,
        data.userId,
      ]
    );

    return (await db.get<CalendarEvent>(
      "SELECT * FROM calendar_events WHERE id = ?",
      [result.lastID]
    ))!;
  },

  deleteBySource: async (userId: number, source: string): Promise<void> => {
    await db.run(
      "DELETE FROM calendar_events WHERE userId = ? AND source = ?",
      [userId, source]
    );
  },
};

// Family member helpers
export const familyHelpers = {
  findByUserId: async (userId: number): Promise<FamilyMember[]> => {
    return db.all<FamilyMember>(
      "SELECT * FROM family_members WHERE userId = ? ORDER BY createdAt DESC",
      [userId]
    );
  },

  findActive: async (userId: number): Promise<FamilyMember[]> => {
    return db.all<FamilyMember>(
      "SELECT * FROM family_members WHERE userId = ? AND isActive = 1",
      [userId]
    );
  },

  create: async (data: {
    name: string;
    phoneNumber: string;
    relationship?: string;
    userId: number;
  }): Promise<FamilyMember> => {
    const result = await db.run(
      `INSERT INTO family_members (name, phoneNumber, relationship, userId)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.phoneNumber, data.relationship || null, data.userId]
    );

    return (await db.get<FamilyMember>(
      "SELECT * FROM family_members WHERE id = ?",
      [result.lastID]
    ))!;
  },

  toggleActive: async (id: number, isActive: boolean): Promise<void> => {
    await db.run(
      "UPDATE family_members SET isActive = ? WHERE id = ?",
      [isActive ? 1 : 0, id]
    );
  },
};

// SMS history helpers
export const smsHelpers = {
  create: async (data: {
    phoneNumber: string;
    message: string;
    status: string;
    messageStyle: string;
    userId: number;
    eventCount?: number;
    twilioSid?: string;
  }): Promise<void> => {
    await db.run(
      `INSERT INTO sms_history
       (phoneNumber, message, status, messageStyle, userId, eventCount, twilioSid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.phoneNumber,
        data.message,
        data.status,
        data.messageStyle,
        data.userId,
        data.eventCount || 0,
        data.twilioSid || null,
      ]
    );
  },

  findByUserId: async (userId: number, limit: number = 50): Promise<any[]> => {
    return db.all(
      "SELECT * FROM sms_history WHERE userId = ? ORDER BY sentAt DESC LIMIT ?",
      [userId, limit]
    );
  },
};

// Admin settings helpers
export const adminHelpers = {
  getSetting: async (key: string): Promise<string | null> => {
    const result = await db.get<{ value: string }>(
      "SELECT value FROM admin_settings WHERE key = ?",
      [key]
    );
    return result?.value || null;
  },

  setSetting: async (
    key: string,
    value: string,
    category: string = "system",
    isSecret: boolean = false
  ): Promise<void> => {
    await db.run(
      `INSERT INTO admin_settings (key, value, category, isSecret)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         category = excluded.category,
         isSecret = excluded.isSecret,
         updatedAt = CURRENT_TIMESTAMP`,
      [key, value, category, isSecret ? 1 : 0]
    );
  },

  getSettingsByCategory: async (category: string): Promise<any[]> => {
    return db.all(
      "SELECT * FROM admin_settings WHERE category = ?",
      [category]
    );
  },
};
```

## Step 2.6: Create Seed Script

**File: `backend/src/lib/seed.ts`**

```typescript
import bcrypt from "bcrypt";
import { db } from "./database";
import { runMigrations } from "./migrate";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Run migrations first
    await runMigrations();

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await db.run(
      `INSERT OR IGNORE INTO users (email, password, firstName, lastName, isAdmin)
       VALUES (?, ?, ?, ?, ?)`,
      ["admin@localhost", hashedPassword, "Admin", "User", 1]
    );

    console.log("✅ Created admin user: admin@localhost");

    // Initialize system setup
    await db.run(
      `INSERT OR IGNORE INTO system_setup (id, isCompleted) VALUES (1, 0)`
    );

    console.log("✅ System setup initialized");
    console.log("\n📧 Default admin credentials:");
    console.log("   Email: admin@localhost");
    console.log("   Password: admin123");
    console.log("\n⚠️  Please change these credentials after first login!\n");

    await db.close();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
```

## Step 2.7: Update package.json Scripts

**File: `backend/package.json` (add to scripts)**

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:seed": "tsx src/lib/seed.ts",
    "db:migrate": "tsx src/lib/migrate.ts"
  }
}
```

## Step 2.8: Update Server to Initialize Database

**File: `backend/src/index.ts`**

Update to initialize database on startup:

```typescript
import express from "express";
import { db } from "./lib/database";
import { runMigrations } from "./lib/migrate";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Initialize database
async function initDatabase() {
  await db.connect();
  await runMigrations();
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;
```

## Step 2.9: Run Migrations and Seed

```bash
cd backend
yarn db:seed
```

## Phase 2 Checklist

- [ ] Installed sqlite3 dependencies
- [ ] Created database service (`database.ts`)
- [ ] Created database schema (`schema.sql`)
- [ ] Created migration runner
- [ ] Created database helper functions
- [ ] Created seed script with default admin
- [ ] Updated server to initialize database
- [ ] Ran migrations and seed successfully
- [ ] Database file created in `data/` directory

---

# Phase 3: Authentication System (Email/Password with JWT)

## Goal

Implement email/password authentication with bcrypt hashing and JWT-based session management.

## Step 3.1: Install Authentication Dependencies

```bash
cd backend
yarn add bcrypt jsonwebtoken cookie-parser express-validator
yarn add -D @types/bcrypt @types/jsonwebtoken @types/cookie-parser
```

## Step 3.2: Create JWT Utilities

**File: `backend/src/lib/jwt.ts`**

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
```

## Step 3.3: Create Password Utilities

**File: `backend/src/lib/password.ts`**

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const validatePasswordStrength = (
  password: string
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

## Step 3.4: Create Authentication Middleware

**File: `backend/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../lib/jwt";
import { userHelpers } from "../lib/db-helpers";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies?.auth_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "No authentication token provided" });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Fetch user from database
    const user = await userHelpers.findById(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};
```

## Step 3.5: Create Validation Utilities

**File: `backend/src/lib/validation.ts`**

```typescript
import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for registration
export const registerValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
];

// Validation rules for login
export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
```

## Step 3.6: Create Authentication Routes

**File: `backend/src/routes/auth.ts`**

```typescript
import { Router } from "express";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../lib/password";
import { generateToken } from "../lib/jwt";
import { userHelpers } from "../lib/db-helpers";
import {
  registerValidation,
  loginValidation,
  validateRequest,
} from "../lib/validation";
import { authenticate } from "../middleware/auth";

const router = Router();

// Register new user
router.post(
  "/register",
  registerValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user exists
      const existingUser = await userHelpers.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Validate password strength
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ errors: passwordCheck.errors });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await userHelpers.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin: false,
      });

      // Generate JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      });

      // Set cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data (without password)
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Login
router.post("/login", loginValidation, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await userHelpers.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await userHelpers.updateLastLogin(user.id);

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return user data
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Logged out successfully" });
});

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await userHelpers.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      timezone: user.timezone,
      smsTime: user.smsTime,
      messageStyle: user.messageStyle,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Verify token
router.get("/verify", authenticate, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

export default router;
```

## Step 3.7: Update Server with Auth Routes

**File: `backend/src/index.ts`**

```typescript
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { db } from "./lib/database";
import { runMigrations } from "./lib/migrate";
import authRouter from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Initialize database
async function initDatabase() {
  await db.connect();
  await runMigrations();
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);

// 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handler
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;
```

## Step 3.8: Test Authentication

```bash
# Start server
cd backend
yarn dev

# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

## Phase 3 Checklist

- [ ] Installed authentication dependencies
- [ ] Created JWT utilities
- [ ] Created password hashing utilities
- [ ] Created authentication middleware
- [ ] Created validation utilities
- [ ] Created authentication routes
- [ ] Updated server with auth routes and middleware
- [ ] Tested registration endpoint
- [ ] Tested login endpoint
- [ ] Tested /me endpoint with authentication

---

# Phase 4: Manual Calendar Events (CRUD Operations)

## Goal

Implement full CRUD operations for manual calendar events.

## Step 4.1: Create Calendar Event Routes

**File: `backend/src/routes/calendar.ts`**

```typescript
import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../lib/validation";
import { eventHelpers } from "../lib/db-helpers";
import { db } from "../lib/database";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all events for authenticated user
router.get("/events", async (req, res) => {
  try {
    const userId = req.user!.id;
    const events = await eventHelpers.findByUserId(userId);
    res.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get upcoming events
router.get("/events/upcoming", async (req, res) => {
  try {
    const userId = req.user!.id;
    const hours = parseInt(req.query.hours as string) || 24;
    const events = await eventHelpers.findUpcoming(userId, hours);
    res.json(events);
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// Get events by date range
router.get("/events/range", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start and end dates required" });
    }

    const events = await db.all(
      `SELECT * FROM calendar_events
       WHERE userId = ? AND startTime >= ? AND startTime <= ?
       ORDER BY startTime ASC`,
      [userId, startDate, endDate]
    );

    res.json(events);
  } catch (error) {
    console.error("Get events by range error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Create new event
router.post(
  "/events",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("startTime").isISO8601().withMessage("Valid start time required"),
    body("endTime").isISO8601().withMessage("Valid end time required"),
    body("description").optional().trim(),
    body("location").optional().trim(),
    body("isAllDay").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { title, description, startTime, endTime, location, isAllDay } =
        req.body;

      // Validate times
      if (new Date(endTime) <= new Date(startTime)) {
        return res
          .status(400)
          .json({ error: "End time must be after start time" });
      }

      const event = await eventHelpers.create({
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        isAllDay: isAllDay || false,
        source: "manual",
        userId,
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }
);

// Update event
router.put(
  "/events/:id",
  [
    body("title").optional().trim().notEmpty(),
    body("startTime").optional().isISO8601(),
    body("endTime").optional().isISO8601(),
    body("description").optional().trim(),
    body("location").optional().trim(),
    body("isAllDay").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const eventId = parseInt(req.params.id);

      // Check if event exists and belongs to user
      const existingEvent = await db.get(
        "SELECT * FROM calendar_events WHERE id = ? AND userId = ?",
        [eventId, userId]
      );

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Only allow updating manual events
      if ((existingEvent as any).source !== "manual") {
        return res.status(403).json({ error: "Cannot update synced events" });
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (req.body.title) {
        updates.push("title = ?");
        params.push(req.body.title);
      }
      if (req.body.description !== undefined) {
        updates.push("description = ?");
        params.push(req.body.description);
      }
      if (req.body.location !== undefined) {
        updates.push("location = ?");
        params.push(req.body.location);
      }
      if (req.body.isAllDay !== undefined) {
        updates.push("isAllDay = ?");
        params.push(req.body.isAllDay ? 1 : 0);
      }
      if (req.body.startTime) {
        updates.push("startTime = ?");
        params.push(new Date(req.body.startTime).toISOString());
      }
      if (req.body.endTime) {
        updates.push("endTime = ?");
        params.push(new Date(req.body.endTime).toISOString());
      }

      updates.push("updatedAt = CURRENT_TIMESTAMP");
      params.push(eventId);

      await db.run(
        `UPDATE calendar_events SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      const event = await db.get(
        "SELECT * FROM calendar_events WHERE id = ?",
        [eventId]
      );

      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  }
);

// Delete event
router.delete("/events/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);

    // Check if event exists and belongs to user
    const existingEvent = await db.get(
      "SELECT * FROM calendar_events WHERE id = ? AND userId = ?",
      [eventId, userId]
    );

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only allow deleting manual events
    if ((existingEvent as any).source !== "manual") {
      return res.status(403).json({ error: "Cannot delete synced events" });
    }

    await db.run("DELETE FROM calendar_events WHERE id = ?", [eventId]);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
```

## Step 4.2: Update Server with Calendar Routes

**File: `backend/src/index.ts`**

Add calendar routes:

```typescript
import calendarRouter from "./routes/calendar";

// ... existing code ...

app.use("/api/auth", authRouter);
app.use("/api/calendar", calendarRouter);

// ... rest of code ...
```

## Step 4.3: Test Calendar Events

```bash
# Create an event
curl -X POST http://localhost:8080/api/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly sync",
    "startTime": "2024-12-01T10:00:00Z",
    "endTime": "2024-12-01T11:00:00Z",
    "location": "Conference Room A"
  }'

# Get all events
curl http://localhost:8080/api/calendar/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Phase 4 Checklist

- [ ] Created calendar event routes (GET, POST, PUT, DELETE)
- [ ] Integrated calendar routes into server
- [ ] Tested event creation via API
- [ ] Tested event listing
- [ ] Tested event updating
- [ ] Tested event deletion
- [ ] Verified only manual events can be edited/deleted

---

## Phases 1-4 Complete!

You now have:

- ✅ SERN template structure (backend/, frontend/)
- ✅ Shared types system
- ✅ SQLite database with sqlite3 (8 tables)
- ✅ Email/password authentication with JWT
- ✅ Manual calendar events with full CRUD operations

## Next Steps

Continue to **REBUILD_PLAN_PHASES_5-7.md** for:
- Phase 5: SMS Notification System (Twilio)
- Phase 6: AI Messaging with Claude
- Phase 7: Family Sharing Features

---

**Key Differences from Original Plan:**

1. Uses `backend/` and `frontend/` instead of `apps/server/` and `apps/client/`
2. Uses raw SQLite with sqlite3 instead of Prisma ORM
3. Uses Yarn 4 Berry instead of npm workspaces
4. Shared types in `backend/src/types/` instead of separate package
5. Direct SQL queries instead of Prisma client
6. Removed monorepo workspace structure

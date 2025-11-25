# Cali Calendar AI - Rebuild Plan: Phases 1-4

> **📚 Complete Rebuild Documentation**
>
> - **Part 1:** REBUILD_PLAN_PHASES_1-4.md (this file) - Project setup, database, auth, events
> - **Part 2:** REBUILD_PLAN_PHASES_5-7.md - SMS, AI messaging, family sharing
> - **Part 3:** REBUILD_PLAN_PHASES_8-11.md - Admin dashboard, settings, scheduler, navigation
> - **Part 4:** REBUILD_PLAN_PHASES_12-15.md - Calendar integrations, polish

## Project Overview

This rebuild transforms the Cali Calendar AI from a Microsoft OAuth-only system with MongoDB and Azure Blob Storage into a self-hosted application with:

- Email/password authentication
- SQLite database with Prisma ORM
- Admin dashboard for API key management
- Multiple calendar integrations (manual, TimeTree, Google Calendar, optional Microsoft)
- SMS notifications with AI-powered message personalization

## Current Architecture (To Be Replaced)

**Authentication:** Microsoft OAuth only
**Database:** MongoDB
**Storage:** Azure Blob Storage for user data
**Calendar Sources:** Microsoft Graph API + manual events (JSON in Azure)

## Target Architecture

**Authentication:** Email/password with bcrypt + JWT
**Database:** SQLite with Prisma ORM
**Admin Features:** Self-contained admin panel for API keys and settings
**Calendar Sources:** Manual events → TimeTree (Puppeteer) → Google Calendar API → Microsoft Graph (optional)
**Deployment:** Single Docker container or local installation

---

# Phase 1: Project Setup with SERN Template

## Goal

Set up a clean SERN (SQLite, Express, React, Node) monorepo structure using the official SERN template.

## Prerequisites Check

```bash
node --version  # Should be 18+
npm --version   # Should be 9+
git --version
```

## Step 1.1 to 1.6: Manual setup of SERN monorepo

I've done these steps already, so please read the README to workout how the repo functions and then start from creating the shared package.

## Step 1.7: Shared Package Setup

**File: `packages/shared/package.json`**

```json
{
  "name": "@cali/shared",
  "version": "2.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**File: `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**File: `packages/shared/src/index.ts`**

```typescript
// Shared types and utilities
export * from "./types";
export * from "./constants";
```

**File: `packages/shared/src/types.ts`**

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay: boolean;
  source: "manual" | "google" | "microsoft" | "timetree";
  userId: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  userId: string;
}

export type MessagePersonality =
  | "professional"
  | "witty"
  | "sarcastic"
  | "mission"
  | "irwin"
  | "tanda"
  | "random";
```

**File: `packages/shared/src/constants.ts`**

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
] as const;
```

## Step 1.8: Initialize Git and Install Dependencies

```bash
# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.*.local

# Database
prisma/dev.db
prisma/dev.db-journal
*.db
*.db-journal

# Build outputs
dist/
build/
.next/
out/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Temporary
tmp/
temp/
EOF

# Install dependencies
npm install

# Verify installation
npm run typecheck
```

## Step 1.9: Basic Server Setup

**File: `apps/server/src/index.ts`**

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes (will be added in next phases)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});

export default app;
```

## Step 1.10: Basic Client Setup

**File: `apps/client/src/main.tsx`**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**File: `apps/client/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<h1>Cali Calendar AI</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

**File: `apps/client/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**File: `apps/client/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cali Calendar AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Step 1.11: Test the Setup

```bash
# Terminal 1 - Start server
cd apps/server
cp .env.example .env
npm run dev

# Terminal 2 - Start client
cd apps/client
npm run dev

# Terminal 3 - Test health endpoint
curl http://localhost:3001/health
```

Expected output:

- Server: `🚀 Server running on http://localhost:3001`
- Client: Available at `http://localhost:5173`
- Health check: `{"status":"ok","timestamp":"..."}`

## Step 1.12: Docker Setup (Optional for Development)

**File: `docker-compose.yml`**

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
      - "5173:5173"
    volumes:
      - ./apps:/app/apps
      - ./packages:/app/packages
      - ./prisma:/app/prisma
      - ./node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
    env_file:
      - ./apps/server/.env
    command: npm run dev
```

**File: `Dockerfile`**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY apps/client/package*.json ./apps/client/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build shared package
RUN npm run build --workspace=packages/shared

# Generate Prisma client (will be added in Phase 2)
# RUN npm run prisma:generate

EXPOSE 3001 5173

CMD ["npm", "run", "dev"]
```

## Phase 1 Checklist

- [ ] Created SERN monorepo structure
- [ ] Configured root package.json with workspaces
- [ ] Set up TypeScript configurations
- [ ] Created server package with Express
- [ ] Created client package with React + Vite
- [ ] Created shared package for types
- [ ] Installed all dependencies
- [ ] Basic server runs on port 3001
- [ ] Basic client runs on port 5173
- [ ] Health check endpoint works
- [ ] Git repository initialized with proper .gitignore
- [ ] Environment variables configured

## Next Steps

Proceed to **Phase 2: Database Setup (SQLite with Prisma)** to set up the database schema and Prisma ORM.

---

# Phase 2: Database Setup (SQLite with Prisma)

## Goal

Set up SQLite database with Prisma ORM, define schema for users, calendar events, family members, and admin settings.

## Step 2.1: Install Prisma

```bash
# Install Prisma CLI (if not already installed)
npm install -D prisma@latest

# Install Prisma Client
npm install @prisma/client@latest

# Initialize Prisma
npx prisma init --datasource-provider sqlite
```

This creates:

- `prisma/schema.prisma` - Database schema
- `.env` file with `DATABASE_URL` (update if needed)

## Step 2.2: Configure Prisma Schema

**File: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// User model - main user accounts
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String   // bcrypt hashed
  firstName     String
  lastName      String
  phoneNumber   String?  // User's own phone number
  timezone      String   @default("America/Los_Angeles")
  smsTime       String   @default("07:00") // HH:MM format
  messageStyle  String   @default("professional") // professional, witty, sarcastic, etc.
  isActive      Boolean  @default(true)
  isAdmin       Boolean  @default(false)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  // Relations
  calendarEvents CalendarEvent[]
  familyMembers  FamilyMember[]
  smsHistory     SmsHistory[]
  calendarIntegrations CalendarIntegration[]

  @@index([email])
}

// Calendar events - all sources (manual, Google, Microsoft, TimeTree)
model CalendarEvent {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  location    String?
  isAllDay    Boolean  @default(false)

  // Source tracking
  source      String   // manual, google, microsoft, timetree
  sourceId    String?  // External calendar event ID (if from API)

  // User relation
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, startTime])
  @@index([source])
}

// Family members who receive SMS notifications
model FamilyMember {
  id           String   @id @default(cuid())
  name         String
  phoneNumber  String
  relationship String?  // spouse, child, parent, etc.
  isActive     Boolean  @default(true)

  // Join code tracking
  joinedVia    String?  // join code used
  joinedAt     DateTime @default(now())

  // User relation
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([phoneNumber])
}

// SMS history for tracking sent messages
model SmsHistory {
  id          String   @id @default(cuid())
  phoneNumber String
  message     String
  status      String   // sent, delivered, failed, queued
  messageStyle String  // which personality was used

  // Twilio tracking
  twilioSid   String?  @unique
  errorCode   String?
  errorMessage String?

  // User relation
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Event count in message
  eventCount  Int      @default(0)

  // Timestamps
  sentAt      DateTime @default(now())
  deliveredAt DateTime?

  @@index([userId, sentAt])
  @@index([status])
}

// Join codes for family member invitations
model JoinCode {
  id         String   @id @default(cuid())
  code       String   @unique  // 6-character code
  userId     String
  isUsed     Boolean  @default(false)
  usedBy     String?  // Name of person who used it
  usedAt     DateTime?
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([code])
  @@index([userId])
  @@index([expiresAt])
}

// Calendar integrations (Google, Microsoft, TimeTree credentials)
model CalendarIntegration {
  id            String   @id @default(cuid())
  provider      String   // google, microsoft, timetree

  // OAuth tokens (encrypted)
  accessToken   String?
  refreshToken  String?
  tokenExpiry   DateTime?

  // TimeTree specific (if using credentials)
  timetreeEmail    String?
  timetreePassword String?  // encrypted

  // Integration status
  isActive      Boolean  @default(true)
  lastSyncAt    DateTime?
  syncError     String?

  // User relation
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, provider])
  @@index([userId])
}

// Admin settings - system-wide configuration
model AdminSettings {
  id        String   @id @default(cuid())
  key       String   @unique  // anthropic_api_key, twilio_account_sid, etc.
  value     String   // encrypted for sensitive values
  category  String   // api_keys, smtp, system, etc.
  isSecret  Boolean  @default(false)  // whether to encrypt the value

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
}

// First-time setup tracking
model SystemSetup {
  id              String   @id @default(cuid())
  isCompleted     Boolean  @default(false)
  adminEmail      String?
  setupCompletedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Step 2.3: Update DATABASE_URL

**File: `.env` (root level) or `apps/server/.env`**

```bash
DATABASE_URL="file:./prisma/dev.db"
```

Or for absolute path:

```bash
DATABASE_URL="file:/absolute/path/to/cali-calendar-ai/prisma/dev.db"
```

## Step 2.4: Create Initial Migration

```bash
# Create the database and run migrations
npx prisma migrate dev --name init

# This will:
# 1. Create prisma/dev.db
# 2. Create prisma/migrations/ folder
# 3. Generate Prisma Client
```

Expected output:

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./prisma/dev.db"

SQLite database dev.db created at file:./prisma/dev.db

Applying migration `20231215000000_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20231215000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

## Step 2.5: Generate Prisma Client

```bash
# Generate Prisma Client (if not auto-generated)
npx prisma generate
```

## Step 2.6: Create Database Service

**File: `apps/server/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
```

## Step 2.7: Create Database Utilities

**File: `apps/server/src/lib/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@localhost" },
    update: {},
    create: {
      email: "admin@localhost",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
      phoneNumber: "+1234567890",
    },
  });

  console.log("✅ Created admin user:", admin.email);

  // Initialize system setup
  await prisma.systemSetup.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      isCompleted: false,
    },
  });

  console.log("✅ System setup initialized");
  console.log("\n📧 Default admin credentials:");
  console.log("   Email: admin@localhost");
  console.log("   Password: admin123");
  console.log("\n⚠️  Please change these credentials after first login!\n");

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
```

**File: `apps/server/package.json` (add to scripts)**

```json
{
  "scripts": {
    "db:seed": "tsx src/lib/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio"
  }
}
```

## Step 2.8: Run Seed Script

```bash
# Seed the database with admin user
npm run db:seed --workspace=apps/server
```

## Step 2.9: Test Database Connection

**File: `apps/server/src/routes/test.ts`**

```typescript
import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Test database connection
router.get("/db-test", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const eventCount = await prisma.calendarEvent.count();

    res.json({
      status: "connected",
      database: "SQLite",
      users: userCount,
      events: eventCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
```

**Update: `apps/server/src/index.ts`**

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import testRouter from "./routes/test";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test routes
app.use("/api/test", testRouter);

// API routes (will be added in next phases)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 DB test: http://localhost:${PORT}/api/test/db-test`);
});

export default app;
```

## Step 2.10: Test the Database

```bash
# Start the server
npm run dev --workspace=apps/server

# In another terminal, test the database connection
curl http://localhost:3001/api/test/db-test
```

Expected output:

```json
{
  "status": "connected",
  "database": "SQLite",
  "users": 1,
  "events": 0
}
```

## Step 2.11: Explore Database with Prisma Studio

```bash
# Open Prisma Studio (visual database editor)
npx prisma studio

# Access at http://localhost:5555
```

You should see:

- User table with 1 admin user
- Empty CalendarEvent table
- Empty FamilyMember table
- etc.

## Step 2.12: Add Database Helper Functions

**File: `apps/server/src/lib/db-helpers.ts`**

```typescript
import prisma from "./prisma";
import { User, CalendarEvent, FamilyMember } from "@prisma/client";

// User helpers
export const userHelpers = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  create: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isAdmin?: boolean;
  }) => prisma.user.create({ data }),

  updateLastLogin: (id: string) =>
    prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    }),
};

// Calendar event helpers
export const eventHelpers = {
  findByUserId: (userId: string) =>
    prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    }),

  findUpcoming: (userId: string, hours: number = 24) => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: now,
          lte: futureTime,
        },
      },
      orderBy: { startTime: "asc" },
    });
  },

  create: (data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    isAllDay?: boolean;
    source: string;
    userId: string;
  }) => prisma.calendarEvent.create({ data }),

  deleteBySource: (userId: string, source: string) =>
    prisma.calendarEvent.deleteMany({
      where: { userId, source },
    }),
};

// Family member helpers
export const familyHelpers = {
  findByUserId: (userId: string) =>
    prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),

  findActive: (userId: string) =>
    prisma.familyMember.findMany({
      where: { userId, isActive: true },
    }),

  create: (data: {
    name: string;
    phoneNumber: string;
    relationship?: string;
    userId: string;
  }) => prisma.familyMember.create({ data }),

  toggleActive: (id: string, isActive: boolean) =>
    prisma.familyMember.update({
      where: { id },
      data: { isActive },
    }),
};

// SMS history helpers
export const smsHelpers = {
  create: (data: {
    phoneNumber: string;
    message: string;
    status: string;
    messageStyle: string;
    userId: string;
    eventCount?: number;
    twilioSid?: string;
  }) => prisma.smsHistory.create({ data }),

  findByUserId: (userId: string, limit: number = 50) =>
    prisma.smsHistory.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: limit,
    }),

  updateStatus: (twilioSid: string, status: string, deliveredAt?: Date) =>
    prisma.smsHistory.update({
      where: { twilioSid },
      data: {
        status,
        ...(deliveredAt && { deliveredAt }),
      },
    }),
};

// Admin settings helpers
export const adminHelpers = {
  getSetting: async (key: string): Promise<string | null> => {
    const setting = await prisma.adminSettings.findUnique({ where: { key } });
    return setting?.value || null;
  },

  setSetting: (
    key: string,
    value: string,
    category: string = "system",
    isSecret: boolean = false
  ) =>
    prisma.adminSettings.upsert({
      where: { key },
      update: { value, category, isSecret },
      create: { key, value, category, isSecret },
    }),

  getSettingsByCategory: (category: string) =>
    prisma.adminSettings.findMany({ where: { category } }),
};
```

## Phase 2 Checklist

- [ ] Installed Prisma and Prisma Client
- [ ] Created database schema with all models
- [ ] Configured DATABASE_URL
- [ ] Ran initial migration
- [ ] Generated Prisma Client
- [ ] Created database service (`prisma.ts`)
- [ ] Created seed script with default admin
- [ ] Ran seed script successfully
- [ ] Created database helper functions
- [ ] Tested database connection via API
- [ ] Verified database with Prisma Studio

## Database Schema Summary

**Tables Created:**

1. `User` - Main user accounts with auth and preferences
2. `CalendarEvent` - All calendar events (manual, Google, Microsoft, TimeTree)
3. `FamilyMember` - Family members who receive SMS
4. `SmsHistory` - Track all sent SMS messages
5. `JoinCode` - Invitation codes for family members
6. `CalendarIntegration` - OAuth tokens for calendar APIs
7. `AdminSettings` - System-wide configuration
8. `SystemSetup` - First-time setup tracking

## Next Steps

Proceed to **Phase 3: Authentication System (Email/Password with JWT)** to implement user registration, login, and JWT-based authentication.

---

# Phase 3: Authentication System (Email/Password with JWT)

## Goal

Implement email/password authentication with bcrypt hashing and JWT-based session management.

## Step 3.1: Create JWT Utilities

**File: `apps/server/src/lib/jwt.ts`**

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: string;
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

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
```

## Step 3.2: Create Password Hashing Utilities

**File: `apps/server/src/lib/password.ts`**

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

## Step 3.3: Create Authentication Middleware

**File: `apps/server/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../lib/jwt";
import { userHelpers } from "../lib/db-helpers";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
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
      req.cookies.auth_token ||
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

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies.auth_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = await userHelpers.findById(payload.userId);
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
          };
        }
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};
```

## Step 3.4: Create Validation Utilities

**File: `apps/server/src/lib/validation.ts`**

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

// Validation rules for phone number
export const phoneValidation = body("phoneNumber")
  .optional()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage("Invalid phone number format (use E.164 format)");
```

## Step 3.5: Create Authentication Routes

**File: `apps/server/src/routes/auth.ts`**

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

      // Check if user already exists
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (without password)
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

// Verify token (for client-side auth checks)
router.get("/verify", authenticate, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

export default router;
```

## Step 3.6: Update Server to Include Auth Routes

**File: `apps/server/src/index.ts`**

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import testRouter from "./routes/test";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/test", testRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});

export default app;
```

## Step 3.7: Test Authentication Endpoints

```bash
# Start the server
npm run dev --workspace=apps/server

# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Get current user (use token from login response)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 3.8: Create Client-Side Auth Context

**File: `apps/client/src/contexts/AuthContext.tsx`**

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get("/api/auth/me", {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data.user);
  };

  const register = async (data: RegisterData) => {
    const response = await axios.post("/api/auth/register", data, {
      withCredentials: true,
    });
    setUser(response.data.user);
  };

  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

## Step 3.9: Create Login Page

**File: `apps/client/src/pages/Login.tsx`**

```typescript
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Step 3.10: Create Protected Route Component

**File: `apps/client/src/components/ProtectedRoute.tsx`**

```typescript
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

## Step 3.11: Update App with Auth Provider and Routes

**File: `apps/client/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard (Coming in Phase 4)</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Phase 3 Checklist

- [ ] Created JWT utilities for token generation and verification
- [ ] Created password hashing utilities with bcrypt
- [ ] Created authentication middleware
- [ ] Created validation utilities with express-validator
- [ ] Created authentication routes (register, login, logout, me)
- [ ] Integrated auth routes into server
- [ ] Tested authentication endpoints with curl
- [ ] Created client-side AuthContext
- [ ] Created Login/Register page
- [ ] Created ProtectedRoute component
- [ ] Updated App with AuthProvider and routes
- [ ] Verified end-to-end authentication flow

## Authentication Flow Summary

1. **Register**: User creates account → password hashed → user created → JWT generated → cookie set
2. **Login**: User logs in → credentials verified → JWT generated → cookie set
3. **Protected Routes**: Request → middleware extracts token → verifies JWT → fetches user → attaches to request
4. **Logout**: Clear auth cookie

## Next Steps

Proceed to **Phase 4-7: Core Features** to implement calendar events, SMS notifications, and AI messaging.

---

# Phase 4: Manual Calendar Events (CRUD Operations)

## Goal

Implement full CRUD operations for manual calendar events that users can create directly in the application.

## Step 4.1: Create Calendar Event Routes

**File: `apps/server/src/routes/calendar.ts`**

```typescript
import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../lib/validation";
import { eventHelpers } from "../lib/db-helpers";
import prisma from "../lib/prisma";

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

// Get upcoming events (next 24 hours by default)
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

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
      orderBy: { startTime: "asc" },
    });

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

      // Validate that end time is after start time
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
      const eventId = req.params.id;

      // Check if event exists and belongs to user
      const existingEvent = await prisma.calendarEvent.findFirst({
        where: { id: eventId, userId },
      });

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Only allow updating manual events
      if (existingEvent.source !== "manual") {
        return res.status(403).json({ error: "Cannot update synced events" });
      }

      const updateData: any = {};
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.location !== undefined)
        updateData.location = req.body.location;
      if (req.body.isAllDay !== undefined)
        updateData.isAllDay = req.body.isAllDay;
      if (req.body.startTime)
        updateData.startTime = new Date(req.body.startTime);
      if (req.body.endTime) updateData.endTime = new Date(req.body.endTime);

      // Validate times if both are provided
      if (updateData.startTime && updateData.endTime) {
        if (updateData.endTime <= updateData.startTime) {
          return res
            .status(400)
            .json({ error: "End time must be after start time" });
        }
      }

      const event = await prisma.calendarEvent.update({
        where: { id: eventId },
        data: updateData,
      });

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
    const eventId = req.params.id;

    // Check if event exists and belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only allow deleting manual events
    if (existingEvent.source !== "manual") {
      return res.status(403).json({ error: "Cannot delete synced events" });
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
```

## Step 4.2: Update Server to Include Calendar Routes

**File: `apps/server/src/index.ts`**

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import testRouter from "./routes/test";
import authRouter from "./routes/auth";
import calendarRouter from "./routes/calendar";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/test", testRouter);
app.use("/api/auth", authRouter);
app.use("/api/calendar", calendarRouter);

// 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`📅 Calendar endpoints: http://localhost:${PORT}/api/calendar/*`);
});

export default app;
```

## Step 4.3: Create Calendar Service Hook (Client)

**File: `apps/client/src/hooks/useCalendar.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  source: string;
}

interface CreateEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay?: boolean;
}

const calendarApi = {
  getEvents: () =>
    axios.get<CalendarEvent[]>("/api/calendar/events", {
      withCredentials: true,
    }),

  getUpcoming: (hours: number = 24) =>
    axios.get<CalendarEvent[]>(`/api/calendar/events/upcoming?hours=${hours}`, {
      withCredentials: true,
    }),

  getByRange: (startDate: string, endDate: string) =>
    axios.get<CalendarEvent[]>(
      `/api/calendar/events/range?startDate=${startDate}&endDate=${endDate}`,
      { withCredentials: true }
    ),

  createEvent: (data: CreateEventData) =>
    axios.post<CalendarEvent>("/api/calendar/events", data, {
      withCredentials: true,
    }),

  updateEvent: (id: string, data: Partial<CreateEventData>) =>
    axios.put<CalendarEvent>(`/api/calendar/events/${id}`, data, {
      withCredentials: true,
    }),

  deleteEvent: (id: string) =>
    axios.delete(`/api/calendar/events/${id}`, { withCredentials: true }),
};

export const useCalendar = () => {
  const queryClient = useQueryClient();

  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await calendarApi.getEvents();
      return response.data;
    },
  });

  const upcomingEvents = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      const response = await calendarApi.getUpcoming();
      return response.data;
    },
  });

  const createEvent = useMutation({
    mutationFn: calendarApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateEventData>;
    }) => calendarApi.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: calendarApi.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return {
    events: events.data || [],
    upcomingEvents: upcomingEvents.data || [],
    isLoading: events.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: events.refetch,
  };
};
```

## Step 4.4: Create Events Page

**File: `apps/client/src/pages/Events.tsx`**

```typescript
import React, { useState } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { format } from "date-fns";

export const Events: React.FC = () => {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } =
    useCalendar();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    isAllDay: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, data: formData });
      } else {
        await createEvent.mutateAsync(formData);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        isAllDay: false,
      });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      startTime: format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm"),
      location: event.location || "",
      isAllDay: event.isAllDay,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await deleteEvent.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading events...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendar Events</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              title: "",
              description: "",
              startTime: "",
              endTime: "",
              location: "",
              isAllDay: false,
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Event" : "New Event"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) =>
                  setFormData({ ...formData, isAllDay: e.target.checked })
                }
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                All Day Event
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingId ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            No events yet. Create your first event!
          </div>
        ) : (
          events.map((event: any) => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 mt-2">{event.description}</p>
                  )}
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <div>
                      <strong>Start:</strong>{" "}
                      {format(new Date(event.startTime), "PPpp")}
                    </div>
                    <div>
                      <strong>End:</strong>{" "}
                      {format(new Date(event.endTime), "PPpp")}
                    </div>
                    {event.location && (
                      <div>
                        <strong>Location:</strong> {event.location}
                      </div>
                    )}
                    <div>
                      <strong>Source:</strong>{" "}
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {event.source}
                      </span>
                    </div>
                  </div>
                </div>

                {event.source === "manual" && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

## Step 4.5: Update App with React Query and Events Route

**File: `apps/client/src/main.tsx`**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**File: `apps/client/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Events } from "./pages/Events";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Step 4.6: Test Calendar Events

```bash
# Start server and client
npm run dev

# Test creating an event via curl
curl -X POST http://localhost:3001/api/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly sync",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "location": "Conference Room A"
  }'

# Get all events
curl http://localhost:3001/api/calendar/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Phase 4 Checklist

- [ ] Created calendar event routes (GET, POST, PUT, DELETE)
- [ ] Integrated calendar routes into server
- [ ] Created useCalendar hook with React Query
- [ ] Created Events page with CRUD UI
- [ ] Updated App with QueryClientProvider
- [ ] Tested event creation via API
- [ ] Tested event listing in UI
- [ ] Tested event editing in UI
- [ ] Tested event deletion in UI

## Phases 1-4 Complete!

You now have:

- Complete SERN monorepo setup with TypeScript
- SQLite database with Prisma ORM (8 tables)
- Email/password authentication with JWT
- Manual calendar events with full CRUD operations

## Next Steps

Continue to **REBUILD_PLAN_PHASES_5-7.md** for SMS notifications, AI messaging with Claude, and family sharing features.

---

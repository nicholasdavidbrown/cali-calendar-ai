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

-- Message styles table
CREATE TABLE IF NOT EXISTS message_styles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  displayName TEXT NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_styles_active ON message_styles(isActive, sortOrder);

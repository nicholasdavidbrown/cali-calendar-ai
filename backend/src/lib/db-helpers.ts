import { db } from "./database.js";
import type { User, CalendarEvent, FamilyMember } from "../types/index.js";

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

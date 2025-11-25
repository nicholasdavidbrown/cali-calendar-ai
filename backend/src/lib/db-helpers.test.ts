import { describe, it, expect, beforeEach } from 'vitest';
import { userHelpers, eventHelpers, familyHelpers, adminHelpers } from './db-helpers.js';

describe('User Helpers', () => {
  describe('create()', () => {
    it('should create a new user', async () => {
      const user = await userHelpers.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.isAdmin).toBe(0); // SQLite stores false as 0
    });

    it('should create an admin user', async () => {
      const admin = await userHelpers.create({
        email: 'admin@example.com',
        password: 'hashedpassword',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
      });

      expect(admin.isAdmin).toBe(1); // SQLite stores true as 1
    });
  });

  describe('findByEmail()', () => {
    beforeEach(async () => {
      await userHelpers.create({
        email: 'find@example.com',
        password: 'password',
        firstName: 'Find',
        lastName: 'Me',
      });
    });

    it('should find user by email', async () => {
      const user = await userHelpers.findByEmail('find@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('find@example.com');
      expect(user?.firstName).toBe('Find');
    });

    it('should return undefined for non-existent email', async () => {
      const user = await userHelpers.findByEmail('notfound@example.com');

      expect(user).toBeUndefined();
    });
  });

  describe('findById()', () => {
    it('should find user by ID', async () => {
      const created = await userHelpers.create({
        email: 'findbyid@example.com',
        password: 'password',
        firstName: 'Find',
        lastName: 'ById',
      });

      const found = await userHelpers.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe('findbyid@example.com');
    });

    it('should return undefined for non-existent ID', async () => {
      const user = await userHelpers.findById(99999);

      expect(user).toBeUndefined();
    });
  });

  describe('updateLastLogin()', () => {
    it('should update last login timestamp', async () => {
      const user = await userHelpers.create({
        email: 'login@example.com',
        password: 'password',
        firstName: 'Login',
        lastName: 'Test',
      });

      // Initial last login should be null or undefined
      expect(user.lastLoginAt == null).toBe(true); // null or undefined

      // Update last login
      await userHelpers.updateLastLogin(user.id);

      // Verify it was updated
      const updated = await userHelpers.findById(user.id);
      expect(updated?.lastLoginAt).toBeDefined();
    });
  });
});

describe('Event Helpers', () => {
  let userId: number;

  beforeEach(async () => {
    const user = await userHelpers.create({
      email: 'eventuser@example.com',
      password: 'password',
      firstName: 'Event',
      lastName: 'User',
    });
    userId = user.id;
  });

  describe('create()', () => {
    it('should create a new event', async () => {
      const event = await eventHelpers.create({
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
        location: 'Test Location',
        isAllDay: false,
        source: 'manual',
        userId,
      });

      expect(event.id).toBeDefined();
      expect(event.title).toBe('Test Event');
      expect(event.description).toBe('Test Description');
      expect(event.location).toBe('Test Location');
      expect(event.userId).toBe(userId);
    });

    it('should create an all-day event', async () => {
      const event = await eventHelpers.create({
        title: 'All Day Event',
        startTime: new Date('2024-12-01T00:00:00Z'),
        endTime: new Date('2024-12-01T23:59:59Z'),
        isAllDay: true,
        source: 'manual',
        userId,
      });

      expect(event.isAllDay).toBe(1); // SQLite stores true as 1
    });
  });

  describe('findByUserId()', () => {
    beforeEach(async () => {
      await eventHelpers.create({
        title: 'Event 1',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
        source: 'manual',
        userId,
      });
      await eventHelpers.create({
        title: 'Event 2',
        startTime: new Date('2024-12-02T10:00:00Z'),
        endTime: new Date('2024-12-02T11:00:00Z'),
        source: 'manual',
        userId,
      });
    });

    it('should find all events for a user', async () => {
      const events = await eventHelpers.findByUserId(userId);

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1');
      expect(events[1].title).toBe('Event 2');
    });

    it('should return empty array for user with no events', async () => {
      const events = await eventHelpers.findByUserId(99999);

      expect(events).toHaveLength(0);
    });
  });

  describe('deleteBySource()', () => {
    beforeEach(async () => {
      await eventHelpers.create({
        title: 'Manual Event',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
        source: 'manual',
        userId,
      });
      await eventHelpers.create({
        title: 'Google Event',
        startTime: new Date('2024-12-02T10:00:00Z'),
        endTime: new Date('2024-12-02T11:00:00Z'),
        source: 'google',
        userId,
      });
    });

    it('should delete events from specific source', async () => {
      await eventHelpers.deleteBySource(userId, 'google');

      const events = await eventHelpers.findByUserId(userId);

      expect(events).toHaveLength(1);
      expect(events[0].source).toBe('manual');
    });
  });
});

describe('Family Helpers', () => {
  let userId: number;

  beforeEach(async () => {
    const user = await userHelpers.create({
      email: 'familyuser@example.com',
      password: 'password',
      firstName: 'Family',
      lastName: 'User',
    });
    userId = user.id;
  });

  describe('create()', () => {
    it('should create a family member', async () => {
      const member = await familyHelpers.create({
        name: 'John Doe',
        phoneNumber: '+1234567890',
        relationship: 'Father',
        userId,
      });

      expect(member.id).toBeDefined();
      expect(member.name).toBe('John Doe');
      expect(member.phoneNumber).toBe('+1234567890');
      expect(member.relationship).toBe('Father');
      expect(member.isActive).toBe(1); // SQLite stores true as 1
    });
  });

  describe('findByUserId()', () => {
    beforeEach(async () => {
      await familyHelpers.create({
        name: 'Member 1',
        phoneNumber: '+1111111111',
        userId,
      });
      await familyHelpers.create({
        name: 'Member 2',
        phoneNumber: '+2222222222',
        userId,
      });
    });

    it('should find all family members for a user', async () => {
      const members = await familyHelpers.findByUserId(userId);

      expect(members).toHaveLength(2);
    });
  });

  describe('findActive()', () => {
    beforeEach(async () => {
      const member1 = await familyHelpers.create({
        name: 'Active Member',
        phoneNumber: '+1111111111',
        userId,
      });
      const member2 = await familyHelpers.create({
        name: 'Inactive Member',
        phoneNumber: '+2222222222',
        userId,
      });
      // Deactivate second member
      await familyHelpers.toggleActive(member2.id, false);
    });

    it('should find only active family members', async () => {
      const members = await familyHelpers.findActive(userId);

      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Active Member');
    });
  });

  describe('toggleActive()', () => {
    it('should toggle member active status', async () => {
      const member = await familyHelpers.create({
        name: 'Toggle Member',
        phoneNumber: '+1234567890',
        userId,
      });

      // Should be active by default
      expect(member.isActive).toBe(1); // SQLite stores true as 1

      // Deactivate
      await familyHelpers.toggleActive(member.id, false);
      let members = await familyHelpers.findActive(userId);
      expect(members).toHaveLength(0);

      // Reactivate
      await familyHelpers.toggleActive(member.id, true);
      members = await familyHelpers.findActive(userId);
      expect(members).toHaveLength(1);
    });
  });
});

describe('Admin Helpers', () => {
  describe('setSetting() and getSetting()', () => {
    it('should set and retrieve a setting', async () => {
      await adminHelpers.setSetting('test_key', 'test_value', 'system');

      const value = await adminHelpers.getSetting('test_key');

      expect(value).toBe('test_value');
    });

    it('should update existing setting', async () => {
      await adminHelpers.setSetting('update_key', 'original', 'system');
      await adminHelpers.setSetting('update_key', 'updated', 'system');

      const value = await adminHelpers.getSetting('update_key');

      expect(value).toBe('updated');
    });

    it('should return null for non-existent setting', async () => {
      const value = await adminHelpers.getSetting('nonexistent');

      expect(value).toBeNull();
    });
  });

  describe('getSettingsByCategory()', () => {
    beforeEach(async () => {
      await adminHelpers.setSetting('api_key', 'key123', 'api', true);
      await adminHelpers.setSetting('api_url', 'https://api.example.com', 'api');
      await adminHelpers.setSetting('smtp_host', 'smtp.example.com', 'email');
    });

    it('should retrieve all settings in a category', async () => {
      const settings = await adminHelpers.getSettingsByCategory('api');

      expect(settings).toHaveLength(2);
      expect(settings.some(s => s.key === 'api_key')).toBe(true);
      expect(settings.some(s => s.key === 'api_url')).toBe(true);
    });

    it('should return empty array for category with no settings', async () => {
      const settings = await adminHelpers.getSettingsByCategory('nonexistent');

      expect(settings).toHaveLength(0);
    });
  });
});

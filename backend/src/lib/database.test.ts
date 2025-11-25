import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database.js';

describe('Database Service', () => {
  beforeEach(async () => {
    // Clean test table
    await db.run('DROP TABLE IF EXISTS test_table');
  });

  describe('run()', () => {
    it('should execute a SQL statement and return lastID', async () => {
      await db.run('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)');
      const result = await db.run('INSERT INTO test_table (name) VALUES (?)', ['Test']);

      expect(result.lastID).toBe(1);
      expect(result.changes).toBe(1);
    });

    it('should handle multiple inserts', async () => {
      await db.run('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)');

      const result1 = await db.run('INSERT INTO test_table (name) VALUES (?)', ['First']);
      const result2 = await db.run('INSERT INTO test_table (name) VALUES (?)', ['Second']);

      expect(result1.lastID).toBe(1);
      expect(result2.lastID).toBe(2);
    });
  });

  describe('get()', () => {
    beforeEach(async () => {
      await db.run('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)');
      await db.run('INSERT INTO test_table (name) VALUES (?)', ['Test User']);
    });

    it('should retrieve a single row', async () => {
      const row = await db.get<{ id: number; name: string }>(
        'SELECT * FROM test_table WHERE id = ?',
        [1]
      );

      expect(row).toBeDefined();
      expect(row?.id).toBe(1);
      expect(row?.name).toBe('Test User');
    });

    it('should return undefined when no row is found', async () => {
      const row = await db.get('SELECT * FROM test_table WHERE id = ?', [999]);

      expect(row).toBeUndefined();
    });
  });

  describe('all()', () => {
    beforeEach(async () => {
      await db.run('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)');
      await db.run('INSERT INTO test_table (name) VALUES (?)', ['User 1']);
      await db.run('INSERT INTO test_table (name) VALUES (?)', ['User 2']);
      await db.run('INSERT INTO test_table (name) VALUES (?)', ['User 3']);
    });

    it('should retrieve all matching rows', async () => {
      const rows = await db.all<{ id: number; name: string }>(
        'SELECT * FROM test_table ORDER BY id'
      );

      expect(rows).toHaveLength(3);
      expect(rows[0].name).toBe('User 1');
      expect(rows[1].name).toBe('User 2');
      expect(rows[2].name).toBe('User 3');
    });

    it('should return empty array when no rows match', async () => {
      const rows = await db.all('SELECT * FROM test_table WHERE id > ?', [1000]);

      expect(rows).toHaveLength(0);
      expect(rows).toEqual([]);
    });

    it('should filter rows with WHERE clause', async () => {
      const rows = await db.all<{ id: number; name: string }>(
        'SELECT * FROM test_table WHERE id <= ?',
        [2]
      );

      expect(rows).toHaveLength(2);
    });
  });
});

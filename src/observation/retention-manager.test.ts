import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { RetentionManager, prunePatterns } from './retention-manager.js';

describe('RetentionManager', () => {
  const testDir = join(tmpdir(), `retention-test-${Date.now()}`);
  const testFile = join(testDir, 'patterns.jsonl');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('prune by maxEntries', () => {
    it('should keep newest N entries when over limit', async () => {
      const manager = new RetentionManager({ maxEntries: 3, maxAgeDays: 365 });

      // Create 5 entries with recent timestamps, should keep newest 3
      const now = Date.now();
      const entries = [
        { timestamp: now - 5000, category: 'sessions', data: { id: 1 } },
        { timestamp: now - 4000, category: 'sessions', data: { id: 2 } },
        { timestamp: now - 3000, category: 'sessions', data: { id: 3 } },
        { timestamp: now - 2000, category: 'sessions', data: { id: 4 } },
        { timestamp: now - 1000, category: 'sessions', data: { id: 5 } },
      ];

      await writeFile(testFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      const pruned = await manager.prune(testFile);

      expect(pruned).toBe(2);

      const content = await readFile(testFile, 'utf-8');
      const remaining = content.trim().split('\n').map(line => JSON.parse(line));

      expect(remaining).toHaveLength(3);
      expect(remaining.map(e => e.data.id)).toEqual([3, 4, 5]);
    });

    it('should not prune when under limit', async () => {
      const manager = new RetentionManager({ maxEntries: 10, maxAgeDays: 365 });

      const now = Date.now();
      const entries = [
        { timestamp: now - 2000, category: 'sessions', data: { id: 1 } },
        { timestamp: now - 1000, category: 'sessions', data: { id: 2 } },
      ];

      await writeFile(testFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      const pruned = await manager.prune(testFile);

      expect(pruned).toBe(0);
    });
  });

  describe('prune by maxAgeDays', () => {
    it('should remove entries older than maxAgeDays', async () => {
      const manager = new RetentionManager({ maxEntries: 100, maxAgeDays: 1 });

      const now = Date.now();
      const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
      const halfDayAgo = now - (12 * 60 * 60 * 1000);

      const entries = [
        { timestamp: twoDaysAgo, category: 'sessions', data: { id: 'old' } },
        { timestamp: halfDayAgo, category: 'sessions', data: { id: 'recent' } },
      ];

      await writeFile(testFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      const pruned = await manager.prune(testFile);

      expect(pruned).toBe(1);

      const content = await readFile(testFile, 'utf-8');
      const remaining = content.trim().split('\n').map(line => JSON.parse(line));

      expect(remaining).toHaveLength(1);
      expect(remaining[0].data.id).toBe('recent');
    });
  });

  describe('error handling', () => {
    it('should return 0 for missing file', async () => {
      const manager = new RetentionManager();
      const pruned = await manager.prune('/nonexistent/path.jsonl');
      expect(pruned).toBe(0);
    });

    it('should skip corrupted lines', async () => {
      const manager = new RetentionManager({ maxEntries: 100, maxAgeDays: 365 });

      const content = `{"timestamp":${Date.now()},"category":"sessions","data":{"id":1}}
this is not valid json
{"timestamp":${Date.now()},"category":"sessions","data":{"id":2}}`;

      await writeFile(testFile, content);

      const pruned = await manager.prune(testFile);

      // Should process without error, no entries pruned (both are recent)
      expect(pruned).toBe(0);
    });
  });

  describe('shouldPrune', () => {
    it('should return true for existing file', async () => {
      const manager = new RetentionManager();
      await writeFile(testFile, '{}');

      const result = await manager.shouldPrune(testFile);
      expect(result).toBe(true);
    });

    it('should return false for missing file', async () => {
      const manager = new RetentionManager();
      const result = await manager.shouldPrune('/nonexistent/file.jsonl');
      expect(result).toBe(false);
    });
  });

  describe('prunePatterns', () => {
    it('should be a convenience function', async () => {
      const entries = [
        { timestamp: Date.now(), category: 'sessions', data: { id: 1 } },
      ];

      await writeFile(testFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      const pruned = await prunePatterns(testFile, { maxEntries: 10 });
      expect(pruned).toBe(0);
    });
  });
});

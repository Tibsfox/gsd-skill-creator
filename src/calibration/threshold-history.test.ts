import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ThresholdHistory } from './threshold-history.js';

describe('ThresholdHistory', () => {
  const testDir = join(tmpdir(), `threshold-history-test-${Date.now()}`);

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // Helper to create a snapshot input
  const createSnapshotInput = (
    overrides: Partial<Omit<Parameters<ThresholdHistory['save']>[0], never>> = {}
  ) => ({
    globalThreshold: 0.75,
    skillOverrides: {},
    f1Score: 0.85,
    dataPointsUsed: 100,
    reason: 'calibration' as const,
    ...overrides,
  });

  describe('save', () => {
    it('should save a snapshot with auto-generated id and timestamp', async () => {
      const history = new ThresholdHistory(testDir);

      const snapshot = await history.save(createSnapshotInput());

      expect(snapshot.id).toBeDefined();
      expect(snapshot.id.length).toBe(36); // UUID format
      expect(snapshot.timestamp).toBeDefined();
      expect(new Date(snapshot.timestamp).getTime()).toBeGreaterThan(0);
      expect(snapshot.globalThreshold).toBe(0.75);
    });

    it('should persist snapshot to JSON file', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      const content = await readFile(join(testDir, 'thresholds.json'), 'utf-8');
      const data = JSON.parse(content);

      expect(data.snapshots).toHaveLength(1);
      expect(data.snapshots[0].globalThreshold).toBe(0.8);
      expect(data.currentIndex).toBe(0);
    });

    it('should append multiple snapshots', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      const all = await history.listHistory();
      expect(all).toHaveLength(3);
      expect(all[0].globalThreshold).toBe(0.7);
      expect(all[1].globalThreshold).toBe(0.75);
      expect(all[2].globalThreshold).toBe(0.8);
    });

    it('should set currentIndex to latest snapshot', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));

      const current = await history.getCurrent();
      expect(current?.globalThreshold).toBe(0.75);
    });

    it('should save skill overrides', async () => {
      const history = new ThresholdHistory(testDir);

      const snapshot = await history.save(
        createSnapshotInput({
          skillOverrides: { 'git-commit': 0.85, 'file-search': 0.7 },
        })
      );

      expect(snapshot.skillOverrides['git-commit']).toBe(0.85);
      expect(snapshot.skillOverrides['file-search']).toBe(0.7);
    });
  });

  describe('getCurrent', () => {
    it('should return current snapshot', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      const current = await history.getCurrent();
      expect(current?.globalThreshold).toBe(0.8);
    });

    it('should return null for empty history', async () => {
      const history = new ThresholdHistory(testDir);

      const current = await history.getCurrent();
      expect(current).toBeNull();
    });
  });

  describe('rollback', () => {
    it('should rollback to previous snapshot', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      const rolledBack = await history.rollback();
      expect(rolledBack?.globalThreshold).toBe(0.75);

      const current = await history.getCurrent();
      expect(current?.globalThreshold).toBe(0.75);
    });

    it('should rollback multiple steps', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      const rolledBack = await history.rollback(2);
      expect(rolledBack?.globalThreshold).toBe(0.7);

      const current = await history.getCurrent();
      expect(current?.globalThreshold).toBe(0.7);
    });

    it('should return null when at beginning', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));

      const rolledBack = await history.rollback();
      expect(rolledBack).toBeNull();

      // Current should still be first snapshot
      const current = await history.getCurrent();
      expect(current?.globalThreshold).toBe(0.7);
    });

    it('should return null when trying to rollback too many steps', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));

      const rolledBack = await history.rollback(5);
      expect(rolledBack).toBeNull();

      // Current should be unchanged
      const current = await history.getCurrent();
      expect(current?.globalThreshold).toBe(0.75);
    });

    it('should return null for empty history', async () => {
      const history = new ThresholdHistory(testDir);

      const rolledBack = await history.rollback();
      expect(rolledBack).toBeNull();
    });

    it('should not delete history on rollback', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      await history.rollback(2);

      // All snapshots should still exist
      const all = await history.listHistory();
      expect(all).toHaveLength(3);
    });
  });

  describe('listHistory', () => {
    it('should return all snapshots', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      const all = await history.listHistory();
      expect(all).toHaveLength(3);
    });

    it('should return empty array for no history', async () => {
      const history = new ThresholdHistory(testDir);

      const all = await history.listHistory();
      expect(all).toEqual([]);
    });
  });

  describe('getThresholdForSkill', () => {
    it('should return skill override when set', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(
        createSnapshotInput({
          globalThreshold: 0.75,
          skillOverrides: { 'git-commit': 0.85 },
        })
      );

      const threshold = await history.getThresholdForSkill('git-commit');
      expect(threshold).toBe(0.85);
    });

    it('should return global threshold when no override', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(
        createSnapshotInput({
          globalThreshold: 0.75,
          skillOverrides: { 'git-commit': 0.85 },
        })
      );

      const threshold = await history.getThresholdForSkill('file-search');
      expect(threshold).toBe(0.75);
    });

    it('should return default (0.75) when no history', async () => {
      const history = new ThresholdHistory(testDir);

      const threshold = await history.getThresholdForSkill('any-skill');
      expect(threshold).toBe(0.75);
    });
  });

  describe('clear', () => {
    it('should remove all history', async () => {
      const history = new ThresholdHistory(testDir);

      await history.save(createSnapshotInput({ globalThreshold: 0.7 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.75 }));
      await history.save(createSnapshotInput({ globalThreshold: 0.8 }));

      await history.clear();

      const all = await history.listHistory();
      expect(all).toEqual([]);

      const current = await history.getCurrent();
      expect(current).toBeNull();
    });

    it('should handle clearing empty history', async () => {
      const history = new ThresholdHistory(testDir);

      await history.clear();

      const all = await history.listHistory();
      expect(all).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent file', async () => {
      const history = new ThresholdHistory(join(testDir, 'nonexistent'));

      const all = await history.listHistory();
      expect(all).toEqual([]);

      const current = await history.getCurrent();
      expect(current).toBeNull();
    });
  });
});

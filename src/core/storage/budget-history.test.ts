/**
 * Tests for BudgetHistory JSONL storage.
 *
 * Covers:
 * - Append + read single snapshot
 * - Multiple appends preserve order
 * - Retention pruning at 365 entries
 * - Empty/non-existent file returns empty array
 * - Trend calculation with sufficient data
 * - Trend with insufficient data returns null
 * - Corrupted line handling (skip malformed)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { BudgetHistory, type BudgetSnapshot, type DualBudgetTrend } from './budget-history.js';

describe('BudgetHistory', () => {
  const testDir = join(tmpdir(), `budget-history-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  let historyPath: string;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    historyPath = join(testDir, 'budget-history.jsonl');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('append + read', () => {
    it('should append a snapshot and read it back', async () => {
      const history = new BudgetHistory(historyPath);
      const snapshot: BudgetSnapshot = {
        timestamp: '2026-02-12T10:00:00Z',
        totalChars: 5000,
        skillCount: 3,
      };

      await history.append(snapshot);
      const entries = await history.read();

      expect(entries).toHaveLength(1);
      expect(entries[0].timestamp).toBe(snapshot.timestamp);
      expect(entries[0].totalChars).toBe(snapshot.totalChars);
      expect(entries[0].skillCount).toBe(snapshot.skillCount);
      // Migration adds installedTotal/loadedTotal defaulting to totalChars
      expect(entries[0].installedTotal).toBe(snapshot.totalChars);
      expect(entries[0].loadedTotal).toBe(snapshot.totalChars);
    });

    it('should append multiple snapshots and return all in order', async () => {
      const history = new BudgetHistory(historyPath);

      const snapshots: BudgetSnapshot[] = [
        { timestamp: '2026-02-12T10:00:00Z', totalChars: 5000, skillCount: 3 },
        { timestamp: '2026-02-12T11:00:00Z', totalChars: 6000, skillCount: 4 },
        { timestamp: '2026-02-12T12:00:00Z', totalChars: 7000, skillCount: 5 },
      ];

      for (const snap of snapshots) {
        await history.append(snap);
      }

      const entries = await history.read();
      expect(entries).toHaveLength(3);
      expect(entries[0].totalChars).toBe(5000);
      expect(entries[1].totalChars).toBe(6000);
      expect(entries[2].totalChars).toBe(7000);
    });
  });

  describe('retention pruning', () => {
    it('should prune entries over 365 limit', async () => {
      const history = new BudgetHistory(historyPath);

      // Append 370 entries
      for (let i = 0; i < 370; i++) {
        await history.append({
          timestamp: `2026-01-01T${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
          totalChars: 1000 + i,
          skillCount: 1,
        });
      }

      const entries = await history.read();
      expect(entries).toHaveLength(365);
      // Oldest entries should be pruned — first entry should be #5 (index 5)
      expect(entries[0].totalChars).toBe(1005);
    });
  });

  describe('empty file', () => {
    it('should return empty array for non-existent file', async () => {
      const history = new BudgetHistory(join(testDir, 'does-not-exist.jsonl'));
      const entries = await history.read();
      expect(entries).toEqual([]);
    });
  });

  describe('getTrend', () => {
    it('should calculate trend from 7 entries', () => {
      const snapshots: BudgetSnapshot[] = [
        { timestamp: '2026-02-05T10:00:00Z', totalChars: 3000, skillCount: 2 },
        { timestamp: '2026-02-06T10:00:00Z', totalChars: 3200, skillCount: 2 },
        { timestamp: '2026-02-07T10:00:00Z', totalChars: 3400, skillCount: 3 },
        { timestamp: '2026-02-08T10:00:00Z', totalChars: 3600, skillCount: 3 },
        { timestamp: '2026-02-09T10:00:00Z', totalChars: 3800, skillCount: 3 },
        { timestamp: '2026-02-10T10:00:00Z', totalChars: 4000, skillCount: 4 },
        { timestamp: '2026-02-11T10:00:00Z', totalChars: 4200, skillCount: 4 },
      ];

      const trend = BudgetHistory.getTrend(snapshots);
      expect(trend).not.toBeNull();
      expect(trend!.charDelta).toBe(1200); // 4200 - 3000
      expect(trend!.skillDelta).toBe(2);   // 4 - 2
      expect(trend!.periodSnapshots).toBe(7);
    });

    it('should return null with fewer than 2 entries', () => {
      const trend1 = BudgetHistory.getTrend([]);
      expect(trend1).toBeNull();

      const trend2 = BudgetHistory.getTrend([
        { timestamp: '2026-02-12T10:00:00Z', totalChars: 5000, skillCount: 3 },
      ]);
      expect(trend2).toBeNull();
    });

    it('should use last N entries for trend', () => {
      const snapshots: BudgetSnapshot[] = [
        { timestamp: '2026-02-01T10:00:00Z', totalChars: 1000, skillCount: 1 },
        { timestamp: '2026-02-02T10:00:00Z', totalChars: 2000, skillCount: 2 },
        { timestamp: '2026-02-03T10:00:00Z', totalChars: 3000, skillCount: 3 },
        { timestamp: '2026-02-04T10:00:00Z', totalChars: 4000, skillCount: 4 },
        { timestamp: '2026-02-05T10:00:00Z', totalChars: 5000, skillCount: 5 },
        { timestamp: '2026-02-06T10:00:00Z', totalChars: 6000, skillCount: 6 },
        { timestamp: '2026-02-07T10:00:00Z', totalChars: 7000, skillCount: 7 },
        { timestamp: '2026-02-08T10:00:00Z', totalChars: 8000, skillCount: 8 },
        { timestamp: '2026-02-09T10:00:00Z', totalChars: 9000, skillCount: 9 },
        { timestamp: '2026-02-10T10:00:00Z', totalChars: 10000, skillCount: 10 },
      ];

      // Default recentCount=7 means last 7 entries (index 3-9)
      const trend = BudgetHistory.getTrend(snapshots);
      expect(trend).not.toBeNull();
      expect(trend!.charDelta).toBe(6000); // 10000 - 4000
      expect(trend!.skillDelta).toBe(6);   // 10 - 4
      expect(trend!.periodSnapshots).toBe(7);
    });
  });

  describe('corrupted line handling', () => {
    it('should skip corrupted lines and return valid entries', async () => {
      const history = new BudgetHistory(historyPath);

      // Write a valid line and a corrupted line manually
      const { writeFile } = await import('fs/promises');
      const validLine = JSON.stringify({
        timestamp: '2026-02-12T10:00:00Z',
        totalChars: 5000,
        skillCount: 3,
      });
      await writeFile(historyPath, `${validLine}\n{corrupted json\n`, 'utf-8');

      const entries = await history.read();
      expect(entries).toHaveLength(1);
      expect(entries[0].totalChars).toBe(5000);
    });
  });

  // ==========================================================================
  // Dual-dimension snapshots (BF-03)
  // ==========================================================================

  describe('dual-dimension snapshots (BF-03)', () => {
    it('appending snapshot with installedTotal and loadedTotal reads them back', async () => {
      const history = new BudgetHistory(historyPath);
      const snapshot: BudgetSnapshot = {
        timestamp: '2026-02-14T10:00:00Z',
        totalChars: 8000,
        skillCount: 5,
        installedTotal: 8000,
        loadedTotal: 6000,
      };

      await history.append(snapshot);
      const entries = await history.read();

      expect(entries).toHaveLength(1);
      expect(entries[0].installedTotal).toBe(8000);
      expect(entries[0].loadedTotal).toBe(6000);
    });

    it('reading old snapshot (only totalChars/skillCount/timestamp) migrates: installedTotal=totalChars, loadedTotal=totalChars', async () => {
      const history = new BudgetHistory(historyPath);
      // Write an old-format snapshot directly
      const { writeFile: wf } = await import('fs/promises');
      const oldSnapshot = JSON.stringify({
        timestamp: '2026-01-01T10:00:00Z',
        totalChars: 5000,
        skillCount: 3,
      });
      await wf(historyPath, oldSnapshot + '\n', 'utf-8');

      const entries = await history.read();

      expect(entries).toHaveLength(1);
      expect(entries[0].installedTotal).toBe(5000);
      expect(entries[0].loadedTotal).toBe(5000);
    });

    it('mixed old and new snapshots read correctly', async () => {
      const history = new BudgetHistory(historyPath);
      const { writeFile: wf } = await import('fs/promises');
      const oldLine = JSON.stringify({
        timestamp: '2026-01-01T10:00:00Z',
        totalChars: 5000,
        skillCount: 3,
      });
      const newLine = JSON.stringify({
        timestamp: '2026-02-01T10:00:00Z',
        totalChars: 8000,
        skillCount: 5,
        installedTotal: 8000,
        loadedTotal: 6000,
      });
      await wf(historyPath, oldLine + '\n' + newLine + '\n', 'utf-8');

      const entries = await history.read();

      expect(entries).toHaveLength(2);
      // Old snapshot: migrated
      expect(entries[0].installedTotal).toBe(5000);
      expect(entries[0].loadedTotal).toBe(5000);
      // New snapshot: preserved
      expect(entries[1].installedTotal).toBe(8000);
      expect(entries[1].loadedTotal).toBe(6000);
    });
  });

  // ==========================================================================
  // Dual-dimension trend (BF-04)
  // ==========================================================================

  describe('dual-dimension trend (BF-04)', () => {
    it('getDualTrend(snapshots) returns object with installedCharDelta and loadedCharDelta', () => {
      const snapshots: BudgetSnapshot[] = [
        { timestamp: '2026-02-01T10:00:00Z', totalChars: 5000, skillCount: 3, installedTotal: 5000, loadedTotal: 4000 },
        { timestamp: '2026-02-02T10:00:00Z', totalChars: 6000, skillCount: 4, installedTotal: 6000, loadedTotal: 4500 },
        { timestamp: '2026-02-03T10:00:00Z', totalChars: 7000, skillCount: 5, installedTotal: 7000, loadedTotal: 5000 },
      ];

      const trend = BudgetHistory.getDualTrend(snapshots);

      expect(trend).not.toBeNull();
      expect(trend!.installedCharDelta).toBe(2000); // 7000 - 5000
      expect(trend!.loadedCharDelta).toBe(1000);    // 5000 - 4000
      expect(trend!.skillDelta).toBe(2);             // 5 - 3
      expect(trend!.periodSnapshots).toBe(3);
    });

    it('getDualTrend with old-format snapshots uses totalChars for both dimensions', () => {
      const snapshots: BudgetSnapshot[] = [
        { timestamp: '2026-02-01T10:00:00Z', totalChars: 5000, skillCount: 3 },
        { timestamp: '2026-02-02T10:00:00Z', totalChars: 7000, skillCount: 4 },
      ];

      const trend = BudgetHistory.getDualTrend(snapshots);

      expect(trend).not.toBeNull();
      expect(trend!.installedCharDelta).toBe(2000); // 7000 - 5000
      expect(trend!.loadedCharDelta).toBe(2000);    // same, uses totalChars fallback
    });

    it('getDualTrend with mixed snapshots returns correct deltas', () => {
      const snapshots: BudgetSnapshot[] = [
        { timestamp: '2026-02-01T10:00:00Z', totalChars: 5000, skillCount: 3 },
        { timestamp: '2026-02-02T10:00:00Z', totalChars: 7000, skillCount: 4, installedTotal: 7000, loadedTotal: 5500 },
      ];

      const trend = BudgetHistory.getDualTrend(snapshots);

      expect(trend).not.toBeNull();
      expect(trend!.installedCharDelta).toBe(2000); // 7000 - 5000 (old uses totalChars)
      expect(trend!.loadedCharDelta).toBe(500);      // 5500 - 5000 (old uses totalChars)
    });

    it('getDualTrend returns null for < 2 entries', () => {
      expect(BudgetHistory.getDualTrend([])).toBeNull();
      expect(BudgetHistory.getDualTrend([
        { timestamp: '2026-02-01T10:00:00Z', totalChars: 5000, skillCount: 3 },
      ])).toBeNull();
    });
  });
});

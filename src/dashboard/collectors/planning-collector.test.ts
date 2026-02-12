import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlanSummaryDiff } from '../../integration/monitoring/types.js';

// ---------------------------------------------------------------------------
// Mock fs/promises and the differ before importing the module under test
// ---------------------------------------------------------------------------

const { mockReadFile, mockReaddir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockReaddir: vi.fn(),
}));

const { mockDiffPlanVsSummary } = vi.hoisted(() => ({
  mockDiffPlanVsSummary: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
  readdir: mockReaddir,
}));

vi.mock('../../integration/monitoring/plan-summary-differ.js', () => ({
  diffPlanVsSummary: mockDiffPlanVsSummary,
}));

// Import after mocks are set up
import { collectPlanningMetrics } from './planning-collector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock PlanSummaryDiff. */
function buildDiff(phase: number, plan: number, overrides: Partial<PlanSummaryDiff> = {}): PlanSummaryDiff {
  return {
    phase,
    plan,
    planned_files: ['src/a.ts', 'src/b.ts'],
    actual_files: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
    planned_artifacts: ['src/a.ts'],
    actual_accomplishments: ['Implemented feature A', 'Added tests'],
    emergent_work: ['src/c.ts'],
    dropped_items: [],
    deviations: [],
    scope_change: 'expanded',
    ...overrides,
  };
}

/** Create an ENOENT error. */
function makeEnoent(path: string): NodeJS.ErrnoException {
  const err = new Error(`ENOENT: no such file or directory, open '${path}'`) as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('collectPlanningMetrics', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
    mockReaddir.mockReset();
    mockDiffPlanVsSummary.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Reads PLAN/SUMMARY pairs and returns diffs
  // -------------------------------------------------------------------------
  it('reads PLAN/SUMMARY pairs and returns diffs', async () => {
    // Top-level readdir: one phase subdirectory
    mockReaddir.mockImplementation(async (path: string) => {
      if (path.endsWith('/phases')) {
        return [{ name: '87-monitoring', isDirectory: () => true, isFile: () => false }];
      }
      if (path.includes('87-monitoring')) {
        return [
          { name: '87-01-PLAN.md', isDirectory: () => false, isFile: () => true },
          { name: '87-01-SUMMARY.md', isDirectory: () => false, isFile: () => true },
          { name: '87-02-PLAN.md', isDirectory: () => false, isFile: () => true },
          { name: '87-02-SUMMARY.md', isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    mockReadFile.mockResolvedValue('mock file content');
    mockDiffPlanVsSummary
      .mockReturnValueOnce(buildDiff(87, 1))
      .mockReturnValueOnce(buildDiff(87, 2, { scope_change: 'on_track' }));

    const result = await collectPlanningMetrics({
      phasesDir: '/mock/phases',
    });

    expect(result.diffs).toHaveLength(2);
    expect(result.diffs[0].phase).toBe(87);
    expect(result.diffs[0].plan).toBe(1);
    expect(result.diffs[1].phase).toBe(87);
    expect(result.diffs[1].plan).toBe(2);
    expect(result.totalPlans).toBe(2);
    expect(result.totalWithSummary).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 2. Skips plans without matching summaries
  // -------------------------------------------------------------------------
  it('skips plans without matching summaries', async () => {
    mockReaddir.mockImplementation(async (path: string) => {
      if (path.endsWith('/phases')) {
        return [{ name: '87-monitoring', isDirectory: () => true, isFile: () => false }];
      }
      if (path.includes('87-monitoring')) {
        return [
          { name: '87-01-PLAN.md', isDirectory: () => false, isFile: () => true },
          // No 87-01-SUMMARY.md
          { name: '87-02-PLAN.md', isDirectory: () => false, isFile: () => true },
          { name: '87-02-SUMMARY.md', isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    mockReadFile.mockResolvedValue('mock content');
    mockDiffPlanVsSummary.mockReturnValueOnce(buildDiff(87, 2));

    const result = await collectPlanningMetrics({
      phasesDir: '/mock/phases',
    });

    expect(result.diffs).toHaveLength(1);
    expect(result.diffs[0].plan).toBe(2);
    expect(result.totalPlans).toBe(2);
    expect(result.totalWithSummary).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 3. Handles missing phases directory
  // -------------------------------------------------------------------------
  it('handles missing phases directory', async () => {
    mockReaddir.mockRejectedValue(makeEnoent('/mock/phases'));

    const result = await collectPlanningMetrics({
      phasesDir: '/mock/phases',
    });

    expect(result.diffs).toEqual([]);
    expect(result.totalPlans).toBe(0);
    expect(result.totalWithSummary).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 4. Scans all phase subdirectories
  // -------------------------------------------------------------------------
  it('scans all phase subdirectories', async () => {
    mockReaddir.mockImplementation(async (path: string) => {
      if (path.endsWith('/phases')) {
        return [
          { name: '87-monitoring', isDirectory: () => true, isFile: () => false },
          { name: '88-generator-core', isDirectory: () => true, isFile: () => false },
        ];
      }
      if (path.includes('87-monitoring')) {
        return [
          { name: '87-01-PLAN.md', isDirectory: () => false, isFile: () => true },
          { name: '87-01-SUMMARY.md', isDirectory: () => false, isFile: () => true },
        ];
      }
      if (path.includes('88-generator-core')) {
        return [
          { name: '88-01-PLAN.md', isDirectory: () => false, isFile: () => true },
          { name: '88-01-SUMMARY.md', isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    mockReadFile.mockResolvedValue('mock content');
    mockDiffPlanVsSummary
      .mockReturnValueOnce(buildDiff(87, 1))
      .mockReturnValueOnce(buildDiff(88, 1));

    const result = await collectPlanningMetrics({
      phasesDir: '/mock/phases',
    });

    expect(result.diffs).toHaveLength(2);
    expect(result.diffs[0].phase).toBe(87);
    expect(result.diffs[1].phase).toBe(88);
    expect(result.totalPlans).toBe(2);
    expect(result.totalWithSummary).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 5. Returned diffs conform to PlanSummaryDiff interface
  // -------------------------------------------------------------------------
  it('returned diffs conform to PlanSummaryDiff interface', async () => {
    mockReaddir.mockImplementation(async (path: string) => {
      if (path.endsWith('/phases')) {
        return [{ name: '90-charts', isDirectory: () => true, isFile: () => false }];
      }
      if (path.includes('90-charts')) {
        return [
          { name: '90-01-PLAN.md', isDirectory: () => false, isFile: () => true },
          { name: '90-01-SUMMARY.md', isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    mockReadFile.mockResolvedValue('mock content');
    mockDiffPlanVsSummary.mockReturnValueOnce(
      buildDiff(90, 1, {
        scope_change: 'shifted',
        emergent_work: ['new-file.ts'],
        dropped_items: ['old-file.ts'],
      }),
    );

    const result = await collectPlanningMetrics({
      phasesDir: '/mock/phases',
    });

    expect(result.diffs).toHaveLength(1);
    const diff: PlanSummaryDiff = result.diffs[0];

    // Verify PlanSummaryDiff fields exist and have correct types
    expect(typeof diff.phase).toBe('number');
    expect(typeof diff.plan).toBe('number');
    expect(Array.isArray(diff.planned_files)).toBe(true);
    expect(Array.isArray(diff.actual_files)).toBe(true);
    expect(Array.isArray(diff.planned_artifacts)).toBe(true);
    expect(Array.isArray(diff.actual_accomplishments)).toBe(true);
    expect(Array.isArray(diff.emergent_work)).toBe(true);
    expect(Array.isArray(diff.dropped_items)).toBe(true);
    expect(Array.isArray(diff.deviations)).toBe(true);
    expect(['expanded', 'contracted', 'shifted', 'on_track']).toContain(diff.scope_change);
  });
});

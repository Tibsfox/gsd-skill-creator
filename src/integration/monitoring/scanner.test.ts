/**
 * Tests for the scan orchestrator.
 *
 * Covers:
 * - Config-based scan gating (phase_transition_hooks toggle)
 * - Graceful handling of missing STATE.md and ROADMAP.md
 * - STATE.md transition detection across scans
 * - ROADMAP.md structural change detection
 * - Plan-vs-summary diffs when planDir is provided
 * - Scan state persistence (save after scan)
 * - Observation writing for each detected change
 * - First-scan baseline capture (null previous state)
 * - Individual monitor failure isolation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs/promises before importing the module under test
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  appendFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
}));

// Mock the integration config reader
vi.mock('../config/index.js', () => ({
  readIntegrationConfig: vi.fn(),
}));

import { readFile, writeFile, appendFile, access, readdir } from 'fs/promises';
import { readIntegrationConfig } from '../config/index.js';
import { runScan } from './scanner.js';

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockAppendFile = vi.mocked(appendFile);
const mockAccess = vi.mocked(access);
const mockReaddir = vi.mocked(readdir);
const mockReadConfig = vi.mocked(readIntegrationConfig);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a default integration config with all toggles enabled. */
function defaultConfig(overrides: Record<string, unknown> = {}) {
  return {
    integration: {
      auto_load_skills: true,
      observe_sessions: true,
      phase_transition_hooks: true,
      suggest_on_session_start: true,
      install_git_hooks: true,
      wrapper_commands: true,
      ...(overrides.integration as Record<string, unknown> ?? {}),
    },
    token_budget: { max_percent: 5, warn_at_percent: 4 },
    observation: { retention_days: 30, max_entries: 10000, capture_corrections: true },
    suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 },
  };
}

/** Build a minimal STATE.md string. */
function makeStateMd(phase: number, status: string, blockers = ''): string {
  return [
    '# State',
    '',
    '## Current Position',
    '',
    `Phase: ${phase} -- Test Phase`,
    `Status: ${status}`,
    `Plan: 01 of 2`,
    '',
    '### Blockers',
    blockers ? `- ${blockers}` : '- (none)',
  ].join('\n');
}

/** Build a minimal ROADMAP.md with phase entries. */
function makeRoadmap(phases: Array<{ number: number; name: string; status: string }>): string {
  const entries = phases
    .map((p) => `### Phase ${p.number}: ${p.name}\n\n**Status:** ${p.status}`)
    .join('\n\n');
  return `# Roadmap\n\n${entries}`;
}

/** Build a scan-state.json object. */
function makeScanState(
  stateSnapshot: Record<string, string>,
  roadmapPhases: Array<{ number: number; name: string; status: string }>,
): string {
  return JSON.stringify({
    last_scan_timestamp: '2026-02-12T10:00:00Z',
    state_md_snapshot: stateSnapshot,
    roadmap_phases: roadmapPhases,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runScan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: config enabled, directory exists, files writable
    mockReadConfig.mockResolvedValue(defaultConfig() as ReturnType<typeof readIntegrationConfig> extends Promise<infer T> ? T : never);
    mockAccess.mockResolvedValue(undefined);
    mockAppendFile.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  // =========================================================================
  // Config gating
  // =========================================================================

  it('returns empty result when phase_transition_hooks is disabled', async () => {
    mockReadConfig.mockResolvedValue(
      defaultConfig({ integration: { phase_transition_hooks: false } }) as any,
    );

    const result = await runScan();

    expect(result.observations_written).toBe(0);
    expect(result.state_transitions).toEqual([]);
    expect(result.plan_summary_diffs).toEqual([]);
    expect(result.roadmap_diff).toBeNull();
  });

  // =========================================================================
  // Missing files
  // =========================================================================

  it('handles missing STATE.md gracefully', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('STATE.md')) throw enoent;
      if (pathStr.includes('ROADMAP.md')) throw enoent;
      if (pathStr.includes('scan-state.json')) throw enoent;
      return '';
    });

    const result = await runScan();

    // Should not throw, should return result without state transitions
    expect(result.state_transitions).toEqual([]);
  });

  it('handles missing ROADMAP.md gracefully', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('ROADMAP.md')) throw enoent;
      if (pathStr.includes('scan-state.json')) throw enoent;
      if (pathStr.includes('STATE.md')) return makeStateMd(87, 'Executing');
      return '';
    });

    const result = await runScan();

    // Should not throw, roadmap_diff should be null
    expect(result.roadmap_diff).toBeNull();
  });

  // =========================================================================
  // STATE.md transitions
  // =========================================================================

  it('detects state transitions when STATE.md changed', async () => {
    const previousScanState = makeScanState(
      { phase: '86 -- Previous Phase', status: 'Phase 86 complete', blockers: '' },
      [],
    );

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) return previousScanState;
      if (pathStr.includes('STATE.md')) return makeStateMd(87, 'Executing plan 87-01');
      if (pathStr.includes('ROADMAP.md')) {
        const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
        enoent.code = 'ENOENT';
        throw enoent;
      }
      return '';
    });

    const result = await runScan();

    expect(result.state_transitions.length).toBeGreaterThan(0);
    expect(result.observations_written).toBeGreaterThan(0);
  });

  // =========================================================================
  // ROADMAP.md changes
  // =========================================================================

  it('detects roadmap changes when phases added', async () => {
    const previousPhases = [
      { number: 82, name: 'Config', status: 'Complete' },
      { number: 83, name: 'Install', status: 'Complete' },
    ];

    const previousScanState = makeScanState(
      { phase: '83 -- Install', status: 'Phase 83 complete' },
      previousPhases,
    );

    const currentRoadmap = makeRoadmap([
      { number: 82, name: 'Config', status: 'Complete' },
      { number: 83, name: 'Install', status: 'Complete' },
      { number: 84, name: 'Hooks', status: 'In Progress' },
    ]);

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) return previousScanState;
      if (pathStr.includes('STATE.md')) return makeStateMd(84, 'Executing');
      if (pathStr.includes('ROADMAP.md')) return currentRoadmap;
      return '';
    });

    const result = await runScan();

    expect(result.roadmap_diff).not.toBeNull();
    expect(result.roadmap_diff!.phases_added).toHaveLength(1);
    expect(result.roadmap_diff!.phases_added[0].number).toBe(84);
  });

  // =========================================================================
  // Plan-vs-summary diffs
  // =========================================================================

  it('runs plan-summary diff when planDir is provided', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';

    const planContent = [
      '---',
      'phase: 87-monitoring',
      'plan: 01',
      'files_modified:',
      '  - src/a.ts',
      '  - src/b.ts',
      'must_haves:',
      '  artifacts:',
      '    - path: "src/a.ts"',
      '---',
      '',
      'Plan content here',
    ].join('\n');

    const summaryContent = [
      '---',
      'phase: 87-monitoring',
      'plan: 01',
      '---',
      '',
      '## Files Created/Modified',
      '- `src/a.ts` - Created',
      '- `src/b.ts` - Modified',
      '- `src/c.ts` - Created (emergent)',
      '',
      '## Accomplishments',
      '- Built the thing',
      '',
      '## Deviations',
      'None',
    ].join('\n');

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) throw enoent;
      if (pathStr.includes('STATE.md')) throw enoent;
      if (pathStr.includes('ROADMAP.md')) throw enoent;
      if (pathStr.includes('87-01-PLAN.md')) return planContent;
      if (pathStr.includes('87-01-SUMMARY.md')) return summaryContent;
      return '';
    });

    mockReaddir.mockResolvedValue([
      '87-01-PLAN.md',
      '87-01-SUMMARY.md',
    ] as any);

    const result = await runScan({ planDir: '/fake/phases/87-monitoring' });

    expect(result.plan_summary_diffs).toHaveLength(1);
    expect(result.plan_summary_diffs[0].scope_change).toBe('expanded');
    expect(result.observations_written).toBeGreaterThan(0);
  });

  // =========================================================================
  // Scan state persistence
  // =========================================================================

  it('saves updated scan state after successful scan', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) throw enoent;
      if (pathStr.includes('STATE.md')) return makeStateMd(87, 'Executing');
      if (pathStr.includes('ROADMAP.md')) return makeRoadmap([
        { number: 87, name: 'Monitoring', status: 'In Progress' },
      ]);
      return '';
    });

    await runScan();

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('scan-state.json'),
      expect.any(String),
      'utf-8',
    );

    // Verify saved state is valid JSON with expected fields
    const savedContent = mockWriteFile.mock.calls[0][1] as string;
    const savedState = JSON.parse(savedContent);
    expect(savedState).toHaveProperty('last_scan_timestamp');
    expect(savedState).toHaveProperty('state_md_snapshot');
    expect(savedState).toHaveProperty('roadmap_phases');
  });

  // =========================================================================
  // Observation writing
  // =========================================================================

  it('writes observations to sessions.jsonl for each detected change', async () => {
    const previousScanState = makeScanState(
      { phase: '86 -- Previous', status: 'Phase 86 complete', blockers: '' },
      [{ number: 86, name: 'Previous', status: 'Pending' }],
    );

    const currentRoadmap = makeRoadmap([
      { number: 86, name: 'Previous', status: 'Complete' },
      { number: 87, name: 'New Phase', status: 'In Progress' },
    ]);

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) return previousScanState;
      if (pathStr.includes('STATE.md')) return makeStateMd(87, 'Executing plan 87-01');
      if (pathStr.includes('ROADMAP.md')) return currentRoadmap;
      return '';
    });

    const result = await runScan();

    // Should have written observations for state transitions + roadmap changes
    expect(result.observations_written).toBeGreaterThan(0);
    // appendFile is called by appendScanObservation for each observation
    expect(mockAppendFile).toHaveBeenCalled();
  });

  // =========================================================================
  // First scan (baseline)
  // =========================================================================

  it('returns empty result on first scan (null previous state)', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) throw enoent;
      if (pathStr.includes('STATE.md')) return makeStateMd(87, 'Executing');
      if (pathStr.includes('ROADMAP.md')) return makeRoadmap([
        { number: 87, name: 'Monitoring', status: 'In Progress' },
      ]);
      return '';
    });

    const result = await runScan();

    // First scan with null previous state: baseline capture, no transitions
    expect(result.state_transitions).toEqual([]);
    expect(result.observations_written).toBe(0);
  });

  // =========================================================================
  // Error isolation
  // =========================================================================

  it('does not throw when individual monitor fails', async () => {
    const genericError = new Error('Permission denied');

    mockReadFile.mockImplementation(async (path: any) => {
      const pathStr = String(path);
      if (pathStr.includes('scan-state.json')) return makeScanState({}, []);
      if (pathStr.includes('STATE.md')) throw genericError;
      if (pathStr.includes('ROADMAP.md')) throw genericError;
      return '';
    });

    // Should complete without throwing
    const result = await runScan();

    expect(result).toBeDefined();
    expect(result.observations_written).toBe(0);
  });
});

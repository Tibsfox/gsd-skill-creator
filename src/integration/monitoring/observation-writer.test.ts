/**
 * Tests for the observation writer.
 *
 * Covers:
 * - Appending valid JSON lines to sessions.jsonl
 * - Creating .planning/patterns/ directory when missing
 * - Skipping directory creation when it exists
 * - Enforcing source: "scan" and type: "scan" on every entry
 * - Writing compact (single-line) JSON
 * - ISO 8601 timestamp validation
 * - Error propagation from appendFile
 * - Default and custom output paths
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs/promises before importing the module under test
vi.mock('fs/promises', () => ({
  appendFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
}));

import { appendFile, mkdir, access } from 'fs/promises';
import type { ScanObservation } from './types.js';

const mockAppendFile = vi.mocked(appendFile);
const mockMkdir = vi.mocked(mkdir);
const mockAccess = vi.mocked(access);

// Import the module under test (does not exist yet -- RED phase)
import { appendScanObservation } from './observation-writer.js';

describe('appendScanObservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: directory exists
    mockAccess.mockResolvedValue(undefined);
    mockAppendFile.mockResolvedValue(undefined);
  });

  // =========================================================================
  // Core write behavior
  // =========================================================================

  it('appends a valid JSON line to sessions.jsonl', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'plan_summary_diff',
      details: {
        phase: 87,
        plan: 1,
        planned_files: ['a.ts'],
        actual_files: ['a.ts'],
        planned_artifacts: ['a.ts'],
        actual_accomplishments: ['Built a.ts'],
        emergent_work: [],
        dropped_items: [],
        deviations: [],
        scope_change: 'on_track',
      },
    };

    await appendScanObservation(observation);

    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    const [path, data] = mockAppendFile.mock.calls[0];
    expect(path).toContain('sessions.jsonl');
    expect(typeof data).toBe('string');
    // Should end with newline
    expect((data as string).endsWith('\n')).toBe(true);
    // Should be valid JSON (minus the trailing newline)
    const parsed = JSON.parse((data as string).trim());
    expect(parsed.type).toBe('scan');
  });

  // =========================================================================
  // Directory creation
  // =========================================================================

  it('creates .planning/patterns/ directory when it does not exist', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockAccess.mockRejectedValue(err);

    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: null,
      scan_type: 'state_transition',
      details: {
        field: 'status',
        previous_value: 'planning',
        current_value: 'executing',
        transition_type: 'status_change',
      },
    };

    await appendScanObservation(observation);

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('patterns'),
      { recursive: true },
    );
  });

  it('does not create directory when it already exists', async () => {
    mockAccess.mockResolvedValue(undefined);

    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'plan_summary_diff',
      details: {
        phase: 87,
        plan: 1,
        planned_files: [],
        actual_files: [],
        planned_artifacts: [],
        actual_accomplishments: [],
        emergent_work: [],
        dropped_items: [],
        deviations: [],
        scope_change: 'on_track',
      },
    };

    await appendScanObservation(observation);

    expect(mockMkdir).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Field enforcement
  // =========================================================================

  it('includes source: scan in every entry', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'roadmap_diff',
      details: {
        phases_added: [],
        phases_removed: [],
        phases_reordered: false,
        status_changes: [],
      },
    };

    await appendScanObservation(observation);

    const written = (mockAppendFile.mock.calls[0][1] as string).trim();
    const parsed = JSON.parse(written);
    expect(parsed.source).toBe('scan');
  });

  it('includes type: scan in every entry', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'plan_summary_diff',
      details: {
        phase: 87,
        plan: 1,
        planned_files: [],
        actual_files: [],
        planned_artifacts: [],
        actual_accomplishments: [],
        emergent_work: [],
        dropped_items: [],
        deviations: [],
        scope_change: 'on_track',
      },
    };

    await appendScanObservation(observation);

    const written = (mockAppendFile.mock.calls[0][1] as string).trim();
    const parsed = JSON.parse(written);
    expect(parsed.type).toBe('scan');
  });

  // =========================================================================
  // JSON format
  // =========================================================================

  it('writes compact JSON (single line, no pretty printing)', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'plan_summary_diff',
      details: {
        phase: 87,
        plan: 1,
        planned_files: ['a.ts', 'b.ts'],
        actual_files: ['a.ts', 'b.ts', 'c.ts'],
        planned_artifacts: ['a.ts'],
        actual_accomplishments: ['Built features'],
        emergent_work: ['c.ts'],
        dropped_items: [],
        deviations: [],
        scope_change: 'expanded',
      },
    };

    await appendScanObservation(observation);

    const written = mockAppendFile.mock.calls[0][1] as string;
    // The string should have exactly one newline, at the very end
    const newlineCount = (written.match(/\n/g) || []).length;
    expect(newlineCount).toBe(1);
    expect(written.endsWith('\n')).toBe(true);
  });

  it('uses ISO 8601 timestamp', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:30:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'state_transition',
      details: {
        field: 'phase',
        previous_value: '86',
        current_value: '87',
        transition_type: 'phase_started',
      },
    };

    await appendScanObservation(observation);

    const written = (mockAppendFile.mock.calls[0][1] as string).trim();
    const parsed = JSON.parse(written);
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  it('propagates appendFile errors', async () => {
    mockAppendFile.mockRejectedValue(new Error('Disk full'));

    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: null,
      scan_type: 'plan_summary_diff',
      details: {
        phase: 87,
        plan: 1,
        planned_files: [],
        actual_files: [],
        planned_artifacts: [],
        actual_accomplishments: [],
        emergent_work: [],
        dropped_items: [],
        deviations: [],
        scope_change: 'on_track',
      },
    };

    await expect(appendScanObservation(observation)).rejects.toThrow('Disk full');
  });

  // =========================================================================
  // Path handling
  // =========================================================================

  it('uses default path .planning/patterns/sessions.jsonl', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: null,
      scan_type: 'roadmap_diff',
      details: {
        phases_added: [{ number: 88, name: 'new-phase' }],
        phases_removed: [],
        phases_reordered: false,
        status_changes: [],
      },
    };

    await appendScanObservation(observation);

    const path = mockAppendFile.mock.calls[0][0];
    expect(path).toBe('.planning/patterns/sessions.jsonl');
  });

  it('accepts custom output path', async () => {
    const observation: ScanObservation = {
      type: 'scan',
      timestamp: '2026-02-12T15:00:00Z',
      source: 'scan',
      phase: 87,
      scan_type: 'plan_summary_diff',
      details: {
        phase: 87,
        plan: 1,
        planned_files: [],
        actual_files: [],
        planned_artifacts: [],
        actual_accomplishments: [],
        emergent_work: [],
        dropped_items: [],
        deviations: [],
        scope_change: 'on_track',
      },
    };

    await appendScanObservation(observation, { outputPath: '/tmp/custom.jsonl' });

    const path = mockAppendFile.mock.calls[0][0];
    expect(path).toBe('/tmp/custom.jsonl');
  });
});

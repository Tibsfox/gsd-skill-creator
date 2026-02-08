/**
 * Tests for bundle progress tracking from session observations.
 *
 * Covers:
 * - BundleProgressEntrySchema validates entries with required fields
 * - BundleProgressEntrySchema rejects missing required fields
 * - BundleProgressEntrySchema preserves unknown fields via .passthrough()
 * - BundleProgressEntrySchema optional evidence with tool_calls and files_modified
 * - computeSkillStatus returns 'pending' when skill not in any session
 * - computeSkillStatus returns 'loaded' when skill in activeSkills
 * - computeSkillStatus returns 'applied' when loaded + toolCalls > 0 + durationMinutes >= 2
 * - computeSkillStatus returns 'loaded' when toolCalls=0
 * - computeSkillStatus returns 'loaded' when durationMinutes < 2
 * - computeSkillStatus uses highest status across sessions
 * - BundleProgressStore append writes JSONL in pattern envelope format
 * - BundleProgressStore readAll returns empty for non-existent file
 * - BundleProgressStore readAll skips corrupted lines
 * - BundleProgressStore readAll validates entries
 * - BundleProgressStore getProgressForBundle filters by bundle name
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  BundleProgressEntrySchema,
  computeSkillStatus,
  BundleProgressStore,
} from './bundle-progress-tracker.js';
import type { SessionObservation } from '../types/observation.js';

// ============================================================================
// Helpers
// ============================================================================

function createSession(
  id: string,
  activeSkills: string[],
  overrides: Partial<SessionObservation> = {},
): SessionObservation {
  return {
    sessionId: id,
    startTime: Date.now(),
    endTime: Date.now() + 60000,
    durationMinutes: 5,
    source: 'startup',
    reason: 'clear',
    metrics: {
      userMessages: 3,
      assistantMessages: 3,
      toolCalls: 5,
      uniqueFilesRead: 2,
      uniqueFilesWritten: 1,
      uniqueCommandsRun: 1,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bundle_name: 'frontend-dev',
    session_id: 'sess-1',
    skill_name: 'ts',
    status: 'loaded',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// BundleProgressEntrySchema
// ============================================================================

describe('BundleProgressEntrySchema', () => {
  it('validates entry with all required fields', () => {
    const result = BundleProgressEntrySchema.safeParse(makeEntry());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bundle_name).toBe('frontend-dev');
      expect(result.data.session_id).toBe('sess-1');
      expect(result.data.skill_name).toBe('ts');
      expect(result.data.status).toBe('loaded');
    }
  });

  it('validates applied status', () => {
    const result = BundleProgressEntrySchema.safeParse(
      makeEntry({ status: 'applied' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects entry missing required fields', () => {
    const result = BundleProgressEntrySchema.safeParse({
      bundle_name: 'test',
      // missing session_id, skill_name, status, timestamp
    });
    expect(result.success).toBe(false);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = BundleProgressEntrySchema.safeParse(
      makeEntry({ custom_field: 'extra' }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('extra');
    }
  });

  it('validates optional evidence with tool_calls and files_modified', () => {
    const result = BundleProgressEntrySchema.safeParse(
      makeEntry({ evidence: { tool_calls: 5, files_modified: 3 } }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.evidence?.tool_calls).toBe(5);
      expect(result.data.evidence?.files_modified).toBe(3);
    }
  });

  it('evidence preserves unknown fields via passthrough', () => {
    const result = BundleProgressEntrySchema.safeParse(
      makeEntry({ evidence: { tool_calls: 2, custom: true } }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.evidence as Record<string, unknown>).custom).toBe(true);
    }
  });
});

// ============================================================================
// computeSkillStatus
// ============================================================================

describe('computeSkillStatus', () => {
  it('returns pending when skill never appears in any session', () => {
    const sessions = [
      createSession('s1', ['react', 'css']),
      createSession('s2', ['node']),
    ];
    expect(computeSkillStatus('ts', sessions)).toBe('pending');
  });

  it('returns loaded when skill appears in at least one session activeSkills', () => {
    const sessions = [
      createSession('s1', ['ts', 'react'], {
        metrics: {
          userMessages: 1,
          assistantMessages: 1,
          toolCalls: 0,
          uniqueFilesRead: 0,
          uniqueFilesWritten: 0,
          uniqueCommandsRun: 0,
        },
      }),
    ];
    expect(computeSkillStatus('ts', sessions)).toBe('loaded');
  });

  it('returns applied when skill active + toolCalls > 0 + durationMinutes >= 2', () => {
    const sessions = [
      createSession('s1', ['ts'], {
        durationMinutes: 5,
        metrics: {
          userMessages: 3,
          assistantMessages: 3,
          toolCalls: 10,
          uniqueFilesRead: 2,
          uniqueFilesWritten: 1,
          uniqueCommandsRun: 1,
        },
      }),
    ];
    expect(computeSkillStatus('ts', sessions)).toBe('applied');
  });

  it('returns loaded (not applied) when skill active but toolCalls=0', () => {
    const sessions = [
      createSession('s1', ['ts'], {
        durationMinutes: 10,
        metrics: {
          userMessages: 5,
          assistantMessages: 5,
          toolCalls: 0,
          uniqueFilesRead: 0,
          uniqueFilesWritten: 0,
          uniqueCommandsRun: 0,
        },
      }),
    ];
    expect(computeSkillStatus('ts', sessions)).toBe('loaded');
  });

  it('returns loaded (not applied) when skill active + toolCalls > 0 but durationMinutes < 2', () => {
    const sessions = [
      createSession('s1', ['ts'], {
        durationMinutes: 1,
        metrics: {
          userMessages: 2,
          assistantMessages: 2,
          toolCalls: 3,
          uniqueFilesRead: 1,
          uniqueFilesWritten: 0,
          uniqueCommandsRun: 0,
        },
      }),
    ];
    expect(computeSkillStatus('ts', sessions)).toBe('loaded');
  });

  it('uses the highest status achieved across all sessions (applied > loaded > pending)', () => {
    const sessions = [
      // Session 1: skill loaded but not applied (toolCalls=0)
      createSession('s1', ['ts'], {
        durationMinutes: 5,
        metrics: {
          userMessages: 1,
          assistantMessages: 1,
          toolCalls: 0,
          uniqueFilesRead: 0,
          uniqueFilesWritten: 0,
          uniqueCommandsRun: 0,
        },
      }),
      // Session 2: skill not active
      createSession('s2', ['react']),
      // Session 3: skill applied (toolCalls > 0, duration >= 2)
      createSession('s3', ['ts', 'react'], {
        durationMinutes: 3,
        metrics: {
          userMessages: 3,
          assistantMessages: 3,
          toolCalls: 5,
          uniqueFilesRead: 2,
          uniqueFilesWritten: 1,
          uniqueCommandsRun: 1,
        },
      }),
    ];
    expect(computeSkillStatus('ts', sessions)).toBe('applied');
  });

  it('returns pending for empty sessions array', () => {
    expect(computeSkillStatus('ts', [])).toBe('pending');
  });
});

// ============================================================================
// BundleProgressStore
// ============================================================================

describe('BundleProgressStore', () => {
  let tmpDir: string;
  let store: BundleProgressStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'bundle-progress-'));
    store = new BundleProgressStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('append writes JSONL line in pattern envelope format', async () => {
    const entry = {
      bundle_name: 'frontend-dev',
      session_id: 'sess-1',
      skill_name: 'ts',
      status: 'loaded' as const,
      timestamp: new Date().toISOString(),
    };

    await store.append(entry);

    const content = await readFile(
      join(tmpDir, 'bundle-progress.jsonl'),
      'utf-8',
    );
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);

    const envelope = JSON.parse(lines[0]);
    expect(envelope.timestamp).toBeDefined();
    expect(envelope.category).toBe('bundle-progress');
    expect(envelope.data.bundle_name).toBe('frontend-dev');
    expect(envelope.data.skill_name).toBe('ts');
    expect(envelope.data.status).toBe('loaded');
  });

  it('readAll returns empty array for non-existent file', async () => {
    const freshStore = new BundleProgressStore(join(tmpDir, 'nonexistent'));
    const entries = await freshStore.readAll();
    expect(entries).toEqual([]);
  });

  it('readAll returns parsed entries, skipping corrupted lines', async () => {
    // Write valid and corrupted lines manually
    const { appendFile } = await import('node:fs/promises');
    const filePath = join(tmpDir, 'bundle-progress.jsonl');

    const validEnvelope = JSON.stringify({
      timestamp: Date.now(),
      category: 'bundle-progress',
      data: {
        bundle_name: 'test',
        session_id: 'sess-1',
        skill_name: 'ts',
        status: 'loaded',
        timestamp: new Date().toISOString(),
      },
    });

    await appendFile(filePath, validEnvelope + '\n', 'utf-8');
    await appendFile(filePath, 'this is not valid json\n', 'utf-8');
    await appendFile(filePath, validEnvelope + '\n', 'utf-8');

    const entries = await store.readAll();
    expect(entries).toHaveLength(2);
    expect(entries[0].bundle_name).toBe('test');
  });

  it('readAll validates each entry against BundleProgressEntrySchema', async () => {
    const { appendFile } = await import('node:fs/promises');
    const filePath = join(tmpDir, 'bundle-progress.jsonl');

    // Valid entry
    const valid = JSON.stringify({
      timestamp: Date.now(),
      category: 'bundle-progress',
      data: {
        bundle_name: 'test',
        session_id: 'sess-1',
        skill_name: 'ts',
        status: 'loaded',
        timestamp: new Date().toISOString(),
      },
    });

    // Invalid entry (missing required fields)
    const invalid = JSON.stringify({
      timestamp: Date.now(),
      category: 'bundle-progress',
      data: { bundle_name: 'test' },
    });

    await appendFile(filePath, valid + '\n', 'utf-8');
    await appendFile(filePath, invalid + '\n', 'utf-8');

    const entries = await store.readAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].skill_name).toBe('ts');
  });

  it('getProgressForBundle filters entries by bundle name', async () => {
    await store.append({
      bundle_name: 'frontend-dev',
      session_id: 'sess-1',
      skill_name: 'ts',
      status: 'loaded',
      timestamp: new Date().toISOString(),
    });
    await store.append({
      bundle_name: 'backend-dev',
      session_id: 'sess-1',
      skill_name: 'node',
      status: 'applied',
      timestamp: new Date().toISOString(),
    });
    await store.append({
      bundle_name: 'frontend-dev',
      session_id: 'sess-2',
      skill_name: 'react',
      status: 'applied',
      timestamp: new Date().toISOString(),
    });

    const frontendEntries = await store.getProgressForBundle('frontend-dev');
    expect(frontendEntries).toHaveLength(2);
    expect(frontendEntries.every(e => e.bundle_name === 'frontend-dev')).toBe(true);

    const backendEntries = await store.getProgressForBundle('backend-dev');
    expect(backendEntries).toHaveLength(1);
    expect(backendEntries[0].skill_name).toBe('node');
  });

  it('append creates directory if it does not exist', async () => {
    const nestedStore = new BundleProgressStore(join(tmpDir, 'nested', 'dir'));
    await nestedStore.append({
      bundle_name: 'test',
      session_id: 'sess-1',
      skill_name: 'ts',
      status: 'loaded',
      timestamp: new Date().toISOString(),
    });

    const entries = await nestedStore.readAll();
    expect(entries).toHaveLength(1);
  });
});

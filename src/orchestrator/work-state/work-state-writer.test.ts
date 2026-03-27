/**
 * Tests for the WorkStateWriter class.
 *
 * Covers:
 * - save() creates file at specified path with valid YAML
 * - save() creates parent directories if they don't exist
 * - Written YAML round-trips through js-yaml.load() back to equivalent object
 * - Written YAML uses indent: 2, noRefs: true, sortKeys: true
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WorkStateWriter } from './work-state-writer.js';
import type { WorkState } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeTestState(overrides: Partial<WorkState> = {}): WorkState {
  return {
    version: 1,
    session_id: 'sess-test-123',
    saved_at: '2026-02-08T12:00:00Z',
    active_task: 'implement-writer',
    checkpoint: {
      phase: 45,
      plan: '45-01',
      step: 'task-2',
      status: 'in-progress',
      timestamp: '2026-02-08T12:00:00Z',
    },
    loaded_skills: ['typescript', 'git-commit'],
    queued_tasks: [
      {
        id: 'task-1',
        description: 'Build schemas',
        skills_needed: ['zod'],
        priority: 'high',
        created_at: '2026-02-08T11:00:00Z',
      },
    ],
    workflow: {
      name: 'execute-phase',
      current_step: 'task-2',
      completed_steps: ['task-1'],
    },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('WorkStateWriter', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-writer-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('save() creates file at specified path with valid YAML content', async () => {
    const filePath = join(testDir, 'current-work.yaml');
    const writer = new WorkStateWriter(filePath);
    const state = makeTestState();

    await writer.save(state);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);

    // Should be parseable YAML
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const parsed = (yaml as any).load(content);
    expect(parsed).toBeDefined();
    expect(parsed.saved_at).toBe('2026-02-08T12:00:00Z');
  });

  it('save() creates parent directories if they do not exist', async () => {
    const nestedPath = join(testDir, 'deep', 'nested', 'hooks', 'current-work.yaml');
    const writer = new WorkStateWriter(nestedPath);
    const state = makeTestState();

    await writer.save(state);

    // File should exist
    const fileStat = await stat(nestedPath);
    expect(fileStat.isFile()).toBe(true);

    // Parent directory should exist
    const dirStat = await stat(join(testDir, 'deep', 'nested', 'hooks'));
    expect(dirStat.isDirectory()).toBe(true);
  });

  it('written YAML round-trips through js-yaml.load() to equivalent object', async () => {
    const filePath = join(testDir, 'round-trip.yaml');
    const writer = new WorkStateWriter(filePath);
    const state = makeTestState();

    await writer.save(state);

    const content = await readFile(filePath, 'utf-8');
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const parsed = (yaml as any).load(content) as Record<string, unknown>;

    // All top-level fields should round-trip
    expect(parsed.version).toBe(state.version);
    expect(parsed.session_id).toBe(state.session_id);
    expect(parsed.saved_at).toBe(state.saved_at);
    expect(parsed.active_task).toBe(state.active_task);
    expect(parsed.loaded_skills).toEqual(state.loaded_skills);
    expect(parsed.queued_tasks).toEqual(state.queued_tasks);
    expect(parsed.workflow).toEqual(state.workflow);
    expect(parsed.checkpoint).toEqual(state.checkpoint);
  });

  it('written YAML uses sortKeys: true (keys appear alphabetically)', async () => {
    const filePath = join(testDir, 'sorted.yaml');
    const writer = new WorkStateWriter(filePath);
    const state = makeTestState();

    await writer.save(state);

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    // Top-level keys should be sorted alphabetically
    const topKeys = lines
      .filter(l => !l.startsWith(' ') && l.includes(':'))
      .map(l => l.split(':')[0].trim());

    const sortedKeys = [...topKeys].sort();
    expect(topKeys).toEqual(sortedKeys);
  });
});

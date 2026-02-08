/**
 * Tests for the WorkStateReader class.
 *
 * Covers:
 * - read() returns null for non-existent file
 * - read() returns null for empty file
 * - read() returns null for invalid YAML
 * - read() returns null for valid YAML that fails schema validation
 * - read() returns typed WorkState for valid YAML with all fields
 * - read() returns WorkState with defaults filled for minimal valid YAML
 * - read() preserves extra fields via .passthrough()
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WorkStateReader } from './work-state-reader.js';

// ============================================================================
// Tests
// ============================================================================

describe('WorkStateReader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-reader-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns null for non-existent file', async () => {
    const reader = new WorkStateReader(join(testDir, 'nonexistent.yaml'));
    const result = await reader.read();
    expect(result).toBeNull();
  });

  it('returns null for empty file', async () => {
    const filePath = join(testDir, 'empty.yaml');
    await writeFile(filePath, '', 'utf-8');

    const reader = new WorkStateReader(filePath);
    const result = await reader.read();
    expect(result).toBeNull();
  });

  it('returns null for invalid YAML (syntax error)', async () => {
    const filePath = join(testDir, 'invalid.yaml');
    await writeFile(filePath, '!!!invalid yaml content{{{', 'utf-8');

    const reader = new WorkStateReader(filePath);
    const result = await reader.read();
    expect(result).toBeNull();
  });

  it('returns null for valid YAML that fails schema validation (missing saved_at)', async () => {
    const filePath = join(testDir, 'bad-schema.yaml');
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = (yaml as any).dump({
      version: 1,
      session_id: 'sess-123',
      // saved_at is missing -- required field
    });
    await writeFile(filePath, content, 'utf-8');

    const reader = new WorkStateReader(filePath);
    const result = await reader.read();
    expect(result).toBeNull();
  });

  it('returns typed WorkState for valid YAML with all fields', async () => {
    const filePath = join(testDir, 'complete.yaml');
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const state = {
      version: 1,
      session_id: 'sess-abc',
      saved_at: '2026-02-08T12:00:00Z',
      active_task: 'test-reader',
      checkpoint: {
        phase: 45,
        plan: '45-01',
        step: 'task-2',
        status: 'paused',
        timestamp: '2026-02-08T12:00:00Z',
      },
      loaded_skills: ['typescript'],
      queued_tasks: [
        {
          id: 'q1',
          description: 'Queue item',
          skills_needed: [],
          priority: 'low',
          created_at: '2026-02-08T11:00:00Z',
        },
      ],
      workflow: {
        name: 'plan-phase',
        current_step: 'step-2',
        completed_steps: ['step-1'],
      },
    };
    const content = (yaml as any).dump(state, { sortKeys: true });
    await writeFile(filePath, content, 'utf-8');

    const reader = new WorkStateReader(filePath);
    const result = await reader.read();

    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
    expect(result!.session_id).toBe('sess-abc');
    expect(result!.saved_at).toBe('2026-02-08T12:00:00Z');
    expect(result!.active_task).toBe('test-reader');
    expect(result!.checkpoint).not.toBeNull();
    expect(result!.checkpoint!.phase).toBe(45);
    expect(result!.checkpoint!.status).toBe('paused');
    expect(result!.loaded_skills).toEqual(['typescript']);
    expect(result!.queued_tasks).toHaveLength(1);
    expect(result!.queued_tasks[0].id).toBe('q1');
    expect(result!.workflow).not.toBeNull();
    expect(result!.workflow!.name).toBe('plan-phase');
  });

  it('returns WorkState with defaults filled for minimal valid YAML (just saved_at)', async () => {
    const filePath = join(testDir, 'minimal.yaml');
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = (yaml as any).dump({ saved_at: '2026-02-08T13:00:00Z' });
    await writeFile(filePath, content, 'utf-8');

    const reader = new WorkStateReader(filePath);
    const result = await reader.read();

    expect(result).not.toBeNull();
    expect(result!.saved_at).toBe('2026-02-08T13:00:00Z');
    // Defaults
    expect(result!.version).toBe(1);
    expect(result!.session_id).toBeNull();
    expect(result!.active_task).toBeNull();
    expect(result!.checkpoint).toBeNull();
    expect(result!.loaded_skills).toEqual([]);
    expect(result!.queued_tasks).toEqual([]);
    expect(result!.workflow).toBeNull();
  });

  it('preserves extra fields via .passthrough()', async () => {
    const filePath = join(testDir, 'extra-fields.yaml');
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = (yaml as any).dump({
      saved_at: '2026-02-08T13:00:00Z',
      custom_metadata: 'preserved-value',
      nested_extra: { key: 'value' },
    });
    await writeFile(filePath, content, 'utf-8');

    const reader = new WorkStateReader(filePath);
    const result = await reader.read();

    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).custom_metadata).toBe('preserved-value');
    expect((result as Record<string, unknown>).nested_extra).toEqual({ key: 'value' });
  });
});

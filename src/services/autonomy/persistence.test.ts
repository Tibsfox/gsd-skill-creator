/**
 * Persistence layer tests for the autonomy execution engine.
 *
 * Uses real filesystem I/O in temp directories for integration confidence.
 * No mocks — tests actual atomic write/rename and validated reads.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeExecutionState, readExecutionState } from './persistence.js';
import { createExecutionState } from './state-machine.js';
import type { ExecutionState } from './types.js';

describe('persistence', () => {
  let tempDir: string;
  let statePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'autonomy-persist-'));
    statePath = join(tempDir, 'execution-state.json');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // writeExecutionState
  // =========================================================================
  describe('writeExecutionState', () => {
    it('writes valid JSON that round-trips through JSON.parse', async () => {
      const state = createExecutionState('v1.53');
      await writeExecutionState(state, statePath);

      const raw = await readFile(statePath, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.milestone).toBe('v1.53');
      expect(parsed.status).toBe('INITIALIZED');
    });

    it('writes JSON with 2-space indentation', async () => {
      const state = createExecutionState('v1.53');
      await writeExecutionState(state, statePath);

      const raw = await readFile(statePath, 'utf-8');
      // 2-space indent means the second line starts with exactly 2 spaces
      const lines = raw.split('\n');
      expect(lines[1]).toMatch(/^ {2}"/);
    });

    it('creates parent directories if they do not exist', async () => {
      const nestedPath = join(tempDir, 'deep', 'nested', 'execution-state.json');
      const state = createExecutionState('v1.53');

      await writeExecutionState(state, nestedPath);

      const raw = await readFile(nestedPath, 'utf-8');
      expect(JSON.parse(raw).milestone).toBe('v1.53');
    });

    it('overwrites an existing file', async () => {
      const state1 = createExecutionState('v1.53');
      const state2 = createExecutionState('v1.54');

      await writeExecutionState(state1, statePath);
      await writeExecutionState(state2, statePath);

      const raw = await readFile(statePath, 'utf-8');
      expect(JSON.parse(raw).milestone).toBe('v1.54');
    });

    it('does not leave a .tmp file after write', async () => {
      const state = createExecutionState('v1.53');
      await writeExecutionState(state, statePath);

      const { readdir } = await import('node:fs/promises');
      const files = await readdir(tempDir);
      const tmpFiles = files.filter(f => f.endsWith('.tmp'));
      expect(tmpFiles).toHaveLength(0);
    });
  });

  // =========================================================================
  // readExecutionState
  // =========================================================================
  describe('readExecutionState', () => {
    it('returns success with valid ExecutionState for a valid file', async () => {
      const state = createExecutionState('v1.53');
      await writeExecutionState(state, statePath);

      const result = await readExecutionState(statePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.milestone).toBe('v1.53');
        expect(result.data.status).toBe('INITIALIZED');
        expect(result.data.current_subversion).toBe(0);
      }
    });

    it('returns failure with file-not-found message for missing file', async () => {
      const result = await readExecutionState(join(tempDir, 'nonexistent.json'));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toMatch(/not found|ENOENT|no such file/i);
      }
    });

    it('returns failure for invalid JSON content', async () => {
      await writeFile(statePath, '{not valid json!!!', 'utf-8');

      const result = await readExecutionState(statePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toMatch(/parse|json|syntax/i);
      }
    });

    it('returns failure with field errors for valid JSON but invalid schema', async () => {
      await writeFile(statePath, JSON.stringify({
        version: 1,
        milestone: 'v1.53',
        status: 'INVALID_STATUS',
        current_subversion: 0,
        total_subversions: 100,
        started_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }), 'utf-8');

      const result = await readExecutionState(statePath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        // Should mention the invalid status field
        const errorText = result.errors.join(' ');
        expect(errorText).toMatch(/status|INVALID_STATUS/i);
      }
    });

    it('applies Zod defaults on read (empty arrays, null optionals)', async () => {
      // Write minimal valid data directly (without defaults applied)
      await writeFile(statePath, JSON.stringify({
        milestone: 'v1.53',
        status: 'INITIALIZED',
        current_subversion: 0,
        started_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }), 'utf-8');

      const result = await readExecutionState(statePath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_subversions).toBe(100);
        expect(result.data.completed_subversions).toEqual([]);
        expect(result.data.transitions).toEqual([]);
        expect(result.data.checkpoints).toEqual([]);
        expect(result.data.current_phase).toBeNull();
        expect(result.data.resume_from).toBeNull();
        expect(result.data.last_error).toBeNull();
      }
    });
  });

  // =========================================================================
  // Round-trip
  // =========================================================================
  describe('round-trip', () => {
    it('write then read returns equivalent data', async () => {
      const original = createExecutionState('v1.53', {
        total_subversions: 50,
        milestone_type: 'pedagogical',
      });

      await writeExecutionState(original, statePath);
      const result = await readExecutionState(statePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.milestone).toBe(original.milestone);
        expect(result.data.status).toBe(original.status);
        expect(result.data.current_subversion).toBe(original.current_subversion);
        expect(result.data.total_subversions).toBe(50);
        expect(result.data.milestone_type).toBe('pedagogical');
        expect(result.data.started_at).toBe(original.started_at);
        expect(result.data.updated_at).toBe(original.updated_at);
      }
    });

    it('preserves completed_subversions through round-trip', async () => {
      const state = createExecutionState('v1.53');
      (state as any).completed_subversions = [{
        subversion: 0,
        started_at: '2026-01-01T00:00:00.000Z',
        completed_at: '2026-01-01T00:01:00.000Z',
        phase_results: { prepare: true, execute: true, verify: true, journal: true },
      }];

      await writeExecutionState(state, statePath);
      const result = await readExecutionState(statePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed_subversions).toHaveLength(1);
        expect(result.data.completed_subversions[0].subversion).toBe(0);
      }
    });

    it('preserves transitions through round-trip', async () => {
      const state = createExecutionState('v1.53');
      (state as any).transitions = [{
        from: 'INITIALIZED',
        to: 'RUNNING',
        trigger: 'start execution',
        timestamp: '2026-01-01T00:00:00.000Z',
      }];

      await writeExecutionState(state, statePath);
      const result = await readExecutionState(statePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transitions).toHaveLength(1);
        expect(result.data.transitions[0].from).toBe('INITIALIZED');
        expect(result.data.transitions[0].to).toBe('RUNNING');
      }
    });
  });
});

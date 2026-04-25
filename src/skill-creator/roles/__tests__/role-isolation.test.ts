/**
 * HB-04 — Role-isolation runtime invariant.
 *
 * Worker state MUST NOT be visible to Evaluator beyond the designated
 * fields; cross-role state-leakage = test failure. Cross-role writes
 * throw at runtime.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  assertRoleWrite,
  makeRoleView,
  isDesignatedField,
  RoleIsolationError,
  DESIGNATED_FIELDS,
} from '../role-isolation.js';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import { makeEnv } from './test-helpers.js';

describe('Role isolation runtime invariant', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('assertRoleWrite throws when actor != target', () => {
    expect(() => assertRoleWrite('evaluator', 'worker', 'candidates')).toThrow(RoleIsolationError);
    expect(() => assertRoleWrite('evolution', 'evaluator', 'diagnostics')).toThrow(RoleIsolationError);
    expect(() => assertRoleWrite('worker', 'evolution', 'proposals')).toThrow(RoleIsolationError);
  });

  it('assertRoleWrite is silent when actor == target', () => {
    expect(() => assertRoleWrite('worker', 'worker', 'candidates')).not.toThrow();
    expect(() => assertRoleWrite('evaluator', 'evaluator', 'diagnostics')).not.toThrow();
    expect(() => assertRoleWrite('evolution', 'evolution', 'proposals')).not.toThrow();
  });

  it('Worker→Evaluator view EXCLUDES internalNotes (the load-bearing isolation)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'cand', note: 'SECRET worker scratch — must not leak' },
      env.configPath,
    );
    const view = makeRoleView('worker', ws as unknown as Record<string, unknown>);
    expect('candidates' in view).toBe(true);
    expect('internalNotes' in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain('SECRET');
    expect(JSON.stringify(view)).not.toContain('worker scratch');
  });

  it('isDesignatedField mirrors the allow-list', () => {
    expect(isDesignatedField('worker', 'candidates')).toBe(true);
    expect(isDesignatedField('worker', 'internalNotes')).toBe(false);
    expect(isDesignatedField('evaluator', 'diagnostics')).toBe(true);
  });

  it('Evolution snapshot is read-only — writes throw / no-op via Object.freeze', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(emptyWorkerState('t'), { taskId: 't', summary: 'x' }, env.configPath);
    const view = makeRoleView('worker', ws as unknown as Record<string, unknown>);
    expect(Object.isFrozen(view)).toBe(true);
  });

  it('DESIGNATED_FIELDS is itself frozen + matches the documented allow-list', () => {
    expect(Object.isFrozen(DESIGNATED_FIELDS)).toBe(true);
    expect(DESIGNATED_FIELDS.worker).toEqual(['role', 'taskId', 'candidates']);
    expect(DESIGNATED_FIELDS.evaluator).toEqual(['role', 'diagnostics']);
    expect(DESIGNATED_FIELDS.evolution).toEqual(['role', 'proposals']);
  });

  it('RoleIsolationError carries violation metadata for diagnostics', () => {
    try {
      assertRoleWrite('evaluator', 'worker', 'candidates');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RoleIsolationError);
      const err = e as RoleIsolationError;
      expect(err.violation.fromRole).toBe('evaluator');
      expect(err.violation.toRole).toBe('worker');
      expect(err.violation.field).toBe('candidates');
    }
  });
});

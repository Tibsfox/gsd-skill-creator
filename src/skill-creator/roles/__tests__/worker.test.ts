/**
 * HB-04 — Worker role tests.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  workerGenerate,
  emptyWorkerState,
  resetWorkerCounter,
  WORKER_DISABLED_STATE,
} from '../worker.js';
import { makeEnv } from './test-helpers.js';

describe('Worker role', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('generates a candidate appended to state.candidates', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const s0 = emptyWorkerState('task-1');
    const s1 = workerGenerate(
      s0,
      { taskId: 'task-1', summary: 'cartridge scaffolder', payload: { kind: 'cartridge' } },
      env.configPath,
    );
    expect(s1.candidates).toHaveLength(1);
    expect(s1.candidates[0]?.candidateId).toMatch(/^task-1::cand-\d+$/);
    expect(s1.candidates[0]?.summary).toBe('cartridge scaffolder');
    expect(s1.candidates[0]?.payload).toEqual({ kind: 'cartridge' });
  });

  it('records internal notes only when requested; notes accumulate', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const s0 = emptyWorkerState('t');
    const s1 = workerGenerate(s0, { taskId: 't', summary: 'a' }, env.configPath);
    const s2 = workerGenerate(
      s1,
      { taskId: 't', summary: 'b', note: 'consider edge case X' },
      env.configPath,
    );
    expect(s1.internalNotes).toHaveLength(0);
    expect(s2.internalNotes).toEqual(['consider edge case X']);
  });

  it('flag off → returns disabled sentinel; previous state ignored', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const s0 = emptyWorkerState('t');
    const s = workerGenerate(s0, { taskId: 't', summary: 'never used' }, env.configPath);
    expect(s).toBe(WORKER_DISABLED_STATE);
  });

  it('does not mutate the input state (immutability invariant)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const s0 = emptyWorkerState('t');
    const before = JSON.stringify(s0);
    workerGenerate(s0, { taskId: 't', summary: 'x' }, env.configPath);
    expect(JSON.stringify(s0)).toBe(before);
  });
});

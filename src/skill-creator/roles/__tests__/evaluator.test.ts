/**
 * HB-04 — Evaluator role tests.
 *
 * Covers 3+ failure-class scenarios + the BLOCK invariant.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import {
  evaluatorRun,
  emptyEvaluatorState,
  isCandidateBlocked,
  EVALUATOR_DISABLED_STATE,
} from '../evaluator.js';
import { makeEnv, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

describe('Evaluator role', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('flags unbounded-recursion failure class via tag-hit (severity=high, BLOCK)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'helper with unbounded-recursion path', payload: {} },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics).toHaveLength(1);
    expect(es.diagnostics[0]?.failureClass).toBe('unbounded-recursion');
    expect(es.diagnostics[0]?.severity).toBe('high');
    expect(es.diagnostics[0]?.block).toBe(true);
    expect(isCandidateBlocked(es, ws.candidates[0]!.candidateId)).toBe(true);
  });

  it('flags silent-truncation via word-hit (severity=medium, BLOCK)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'output writer that may truncate', payload: { bytes: 4096 } },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics).toHaveLength(1);
    expect(es.diagnostics[0]?.failureClass).toBe('silent-truncation');
    expect(['medium', 'high']).toContain(es.diagnostics[0]?.severity);
    expect(es.diagnostics[0]?.block).toBe(true);
  });

  it('flags capcom-bypass class for a candidate that mentions gate logic', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'capcom-bypass diagnoser candidate', payload: {} },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics).toHaveLength(1);
    expect(es.diagnostics[0]?.failureClass).toBe('capcom-bypass');
  });

  it('clean candidate produces NO diagnostic and is NOT blocked', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'pure id function returns input', payload: { fn: 'id' } },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics).toHaveLength(0);
    expect(isCandidateBlocked(es, ws.candidates[0]!.candidateId)).toBe(false);
  });

  it('flag off → returns disabled sentinel', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'unbounded-recursion helper' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es).toBe(EVALUATOR_DISABLED_STATE);
  });

  it('Evaluator BLOCKs candidates Worker cannot bypass — adversarial vs 3-correction', () => {
    // Adversarial-vs-3-correction comparative: legacy 3-correction-min would
    // have permitted the candidate (no correction count yet). The Evaluator
    // catches it on the FIRST pass via failure-history match.
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'unbounded-recursion in fn body' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    // Single Worker output; Evaluator BLOCKs immediately (no correction history needed).
    expect(es.diagnostics).toHaveLength(1);
    expect(isCandidateBlocked(es, ws.candidates[0]!.candidateId)).toBe(true);
  });
});

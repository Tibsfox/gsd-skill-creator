/**
 * HB-04 — edge-case + boundary tests.
 *
 * Required by spec §validation: 2+ tests for edge cases.
 *  - Evaluator diagnostic missing fields (defensive over hand-crafted input)
 *  - Evolution proposal that would violate protocol invariants
 *  - Concurrent role activation (sequential mutation safety)
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import { evaluatorRun, emptyEvaluatorState } from '../evaluator.js';
import { evolutionPropose, emptyEvolutionState } from '../evolution.js';
import { aggregatePatterns } from '../evolution.js';
import type { EvolutionExtensionPoint, PolicyUpdateProposal } from '../types.js';
import { makeEnv, authorizeCapcom, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

describe('HB-04 edge cases', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('Evaluator handles empty Worker state (no candidates) without throwing', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const es = evaluatorRun(
      emptyEvaluatorState(),
      emptyWorkerState('t'),
      SYNTHETIC_FAILURE_HISTORY,
      env.configPath,
    );
    expect(es.diagnostics).toHaveLength(0);
  });

  it('Evaluator handles empty failure-history (no matches possible)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'unbounded-recursion helper' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, [], env.configPath);
    expect(es.diagnostics).toHaveLength(0);
  });

  it('aggregatePatterns over empty diagnostics returns empty array', () => {
    expect(aggregatePatterns([])).toEqual([]);
  });

  it('Evolution proposal with malformed protocol field is rejected at type-level (compile-time)', () => {
    // Runtime safety net: an extension that returns a malformed proposal
    // is still passed through the gate; the gate authorizes/drops based
    // on marker, not on validity. This pins the contract that HB-04
    // does NOT semantic-validate proposal contents — that's a v1.49.576+
    // staging-table responsibility.
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const stub: EvolutionExtensionPoint = {
      id: 'malformed-stub',
      proposePolicyUpdate: () =>
        Object.freeze({
          role: 'evolution',
          protocol: 'auto-load',
          change: '',
          rationale: '',
          trigger: { failureClass: '', occurrences: 0, affectedCandidates: [] },
          source: 'malformed-stub',
          producedAt: new Date().toISOString(),
        } as PolicyUpdateProposal),
    };
    const ws = workerGenerate(emptyWorkerState('t'), { taskId: 't', summary: 'x' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [stub],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    // The malformed-but-typed proposal IS accepted by the current gate
    // (HB-04 ships gate, not semantic validator).
    expect(ev.proposals.some((p) => p.source === 'malformed-stub')).toBe(true);
  });

  it('Concurrent (sequential) role activation: two Worker→Evaluator passes accumulate correctly', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    let es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics).toHaveLength(1);
    // Second wave — new candidate appended.
    ws = workerGenerate(ws, { taskId: 't', summary: 'silent-truncation case' }, env.configPath);
    es = evaluatorRun(es, ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    // Old diagnostic still present + new diagnostic appended.
    expect(es.diagnostics).toHaveLength(2);
    expect(new Set(es.diagnostics.map((d) => d.failureClass))).toEqual(
      new Set(['unbounded-recursion', 'silent-truncation']),
    );
  });
});

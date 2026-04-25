/**
 * HB-04 — single-role default behavior test.
 *
 * Per concern (c): when the flag is on but no CAPCOM authorization is
 * recorded, behavior MUST degrade to single-role: only the Worker is
 * exercised; no adversarial Evaluator-blocked cycles, no Evolution
 * proposals committed. The existing six-step loop runs unchanged.
 *
 * This test pins that contract.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import { evaluatorRun, emptyEvaluatorState, isCandidateBlocked } from '../evaluator.js';
import { evolutionPropose, emptyEvolutionState } from '../evolution.js';
import type { EvolutionExtensionPoint } from '../types.js';
import { makeEnv, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

describe('Single-role default (flag on, no auth)', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('Worker still runs (single-role behavior); produces candidates', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    // No authorizeCapcom call — gate is unauthorized.
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'unbounded-recursion helper' },
      env.configPath,
    );
    expect(ws.candidates).toHaveLength(1);
  });

  it('Evaluator still runs (read-only adversarial diagnosis is safe — just observation)', () => {
    // The Evaluator is read-only over Worker state. Running it with no
    // CAPCOM auth produces a diagnostic record but the *consequences*
    // (BLOCK enforcement, role-split commit) are reserved for the gated
    // path. In single-role default mode, callers ignore the diagnostic
    // and let the existing 3-correction-min path run.
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const ws = workerGenerate(
      emptyWorkerState('t'),
      { taskId: 't', summary: 'unbounded-recursion helper' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics).toHaveLength(1);
    // Caller-side single-role discipline: when gate is unauthorized, the
    // BLOCK is advisory, not enforcing.
    expect(isCandidateBlocked(es, ws.candidates[0]!.candidateId)).toBe(true); // Evaluator says BLOCK
    // ...but caller (single-role consumer) ignores it. We pin only that
    // the Evolution role does NOT take any action without auth.
  });

  it('Evolution proposes nothing (commits nothing) without CAPCOM auth', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    let ws = emptyWorkerState('t');
    for (const summary of ['truncate A', 'truncate B', 'truncate C']) {
      ws = workerGenerate(ws, { taskId: 't', summary }, env.configPath);
    }
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    // Single-role default: no proposals committed.
    expect(ev.proposals).toHaveLength(0);
  });

  it('Extension (HB-07 stub) is NOT invoked in single-role default mode', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    let invocations = 0;
    const stub: EvolutionExtensionPoint = {
      id: 'hb07-stub',
      proposePolicyUpdate: () => {
        invocations += 1;
        return null;
      },
    };
    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [stub],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(invocations).toBe(0);
  });
});

/**
 * HB-04 — Evolution extension-point tests.
 *
 * Verifies that a stub HB-07-shape adapter satisfies
 * {@link EvolutionExtensionPoint} and that its `proposePolicyUpdate` is
 * called only after the role-split CAPCOM gate is authorized.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import { evaluatorRun, emptyEvaluatorState } from '../evaluator.js';
import { evolutionPropose, emptyEvolutionState } from '../evolution.js';
import type {
  EvolutionExtensionPoint,
  EvolutionSnapshot,
  PolicyUpdateProposal,
} from '../types.js';
import { makeEnv, authorizeCapcom, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

/** A stub adapter shaped like the future HB-07 AEL bandit. */
class StubAelBandit implements EvolutionExtensionPoint {
  readonly id = 'hb07-ael-bandit-stub';
  invocations = 0;
  readonly snapshots: EvolutionSnapshot[] = [];

  proposePolicyUpdate(snapshot: EvolutionSnapshot): PolicyUpdateProposal | null {
    this.invocations += 1;
    this.snapshots.push(snapshot);
    if (snapshot.patterns.length === 0) return null;
    return Object.freeze({
      role: 'evolution',
      protocol: 'auto-load',
      change: 'lower auto-load threshold for failureClass=' + snapshot.patterns[0]!.failureClass,
      rationale: 'AEL bandit reflection-step proposal (stub)',
      trigger: snapshot.patterns[0]!,
      source: this.id,
      producedAt: new Date().toISOString(),
    });
  }
}

describe('Evolution extension-point (HB-07 boundary)', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('extension is NOT invoked without CAPCOM auth (role-split unauthorized)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const bandit = new StubAelBandit();
    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(bandit.invocations).toBe(0);
  });

  it('extension IS invoked once authorized; its proposal is gated separately', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const bandit = new StubAelBandit();
    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(bandit.invocations).toBe(1);
    // The bandit's proposal targets auto-load.
    const banditProposal = ev.proposals.find((p) => p.source === bandit.id);
    expect(banditProposal).toBeDefined();
    expect(banditProposal?.protocol).toBe('auto-load');
  });

  it('extension receives a frozen snapshot — cannot mutate worker/evaluator state', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const bandit = new StubAelBandit();
    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(bandit.snapshots).toHaveLength(1);
    expect(Object.isFrozen(bandit.snapshots[0])).toBe(true);
  });
});

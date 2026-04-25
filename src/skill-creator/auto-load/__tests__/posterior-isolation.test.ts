/**
 * HB-07 — posterior-isolation invariant.
 *
 * The bandit posterior is **private** to the AelBandit extension. HB-04
 * deliberately exposes no shared store (per its concern flagged for HB-07).
 * This file pins the contract by attempting several read paths and
 * verifying none of them surface the posterior.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  workerGenerate,
  emptyWorkerState,
  resetWorkerCounter,
} from '../../roles/worker.js';
import { evaluatorRun, emptyEvaluatorState } from '../../roles/evaluator.js';
import { evolutionPropose, emptyEvolutionState } from '../../roles/evolution.js';
import type { EvolutionState } from '../../roles/types.js';
import { AelBandit } from '../extension.js';
import {
  makeBanditEnv,
  authorizeBanditCapcom,
  authorizeRolesCapcom,
  makeSeededPrng,
} from './test-helpers.js';
import type { ReflectionFn } from '../types.js';
import type { FailureHistoryEntry } from '../../roles/types.js';

const FAILURE_HISTORY: ReadonlyArray<FailureHistoryEntry> = Object.freeze([
  Object.freeze({
    id: 'fh-001',
    failureClass: 'unbounded-recursion',
    summary: 'recursive helper without depth limit blew the stack',
    recordedAt: '2026-04-01T00:00:00Z',
  }),
]);

describe('posterior isolation (HB-04 surface cannot read bandit posterior)', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetWorkerCounter();
  });

  it('EvolutionState contains no posterior / policy fields', () => {
    const env = makeBanditEnv(true, true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    authorizeRolesCapcom(env);

    const mockReflect: ReflectionFn = ({ patterns }) =>
      patterns.length > 0
        ? [{ failureClass: patterns[0]!.failureClass, rootCausePattern: 'r', proposedPolicyChange: 'c', confidence: 0.9, producedAt: 't' }]
        : [];
    const bandit = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(21),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });

    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion bug 2' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);
    const ev: EvolutionState = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // EvolutionState has only `role` and `proposals` — no posterior.
    const fields = Object.keys(ev);
    expect(fields.sort()).toEqual(['proposals', 'role']);

    // Walk every proposal — none should leak Beta(α,β) numbers.
    const json = JSON.stringify(ev);
    expect(json).not.toMatch(/alpha/);
    expect(json).not.toMatch(/beta/);
    expect(json).not.toMatch(/posterior/);
  });

  it('bandit private state is not enumerable on the public extension surface', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const bandit = new AelBandit({
      arms: ['p1'],
      config: { random: makeSeededPrng(22) },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    // Public surface: id + proposePolicyUpdate + the two `_test*` escape
    // hatches. No `state` / `policies` / `posterior` enumerable property.
    const enumerable = Object.keys(bandit);
    for (const key of enumerable) {
      expect(key).not.toMatch(/state|polic|posterior/i);
    }
    // The TypeScript `#state` private field is not accessible at runtime.
    expect((bandit as unknown as Record<string, unknown>)['#state']).toBeUndefined();
    expect((bandit as unknown as Record<string, unknown>).state).toBeUndefined();
    expect((bandit as unknown as Record<string, unknown>).policies).toBeUndefined();
  });

  it('reflection insights do NOT mutate posterior — verified by state read after reflection', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);

    let invocations = 0;
    const mockReflect: ReflectionFn = ({ patterns }) => {
      invocations += 1;
      // Try to mutate — return mass insight; this should NOT touch the posterior.
      return patterns.map((p) => ({
        failureClass: p.failureClass,
        rootCausePattern: 'attempt-mutate',
        proposedPolicyChange: 'should-only-flow-via-proposal',
        confidence: 0.99,
        producedAt: 't',
      }));
    };
    const bandit = new AelBandit({
      arms: ['p1'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(23),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });

    const snap = {
      workerState: { role: 'worker' as const, taskId: 't', candidates: [], internalNotes: [] },
      evaluatorState: {
        role: 'evaluator' as const,
        diagnostics: [
          {
            role: 'evaluator' as const,
            candidateId: 'c0',
            failureClass: 'fc',
            severity: 'high' as const,
            rootCause: 'r',
            block: true,
            cited: [],
            producedAt: 't',
          },
        ],
      },
      patterns: [{ failureClass: 'fc', occurrences: 2, affectedCandidates: ['c0', 'c1'] }],
    } as const;
    const before = bandit._testGetStateClone();
    bandit.proposePolicyUpdate(snap as any);
    const after = bandit._testGetStateClone();

    expect(invocations).toBe(1);
    // Posterior was updated by observeReward (fast loop), NOT by reflection.
    // The reward path is the ONLY way to update posteriors. We confirm by
    // checking that exactly one Beta entry exists (one observation) and
    // that its alpha+beta = priorAlpha + priorBeta + 1 = 1+1+1 = 3.
    expect(Object.keys(before.policies).length).toBe(0);
    const arms = Object.keys(after.policies);
    expect(arms).toHaveLength(1);
    const post = after.policies[arms[0]!]!;
    expect(post.alpha + post.beta).toBe(3);
  });
});

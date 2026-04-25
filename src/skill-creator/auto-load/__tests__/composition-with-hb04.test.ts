/**
 * HB-07 — composition-with-HB04 integration test.
 *
 * Full lifecycle: HB-04 evolution role authorized → AelBandit registered as
 * extension → bandit-engagement authorized → bandit proposes → HB-04 stages
 * or activates per `'protocol-update'` gate auth.
 *
 * Verifies:
 *   - extension is NOT invoked when HB-04's role-split gate is unauthorized
 *   - extension IS invoked once role-split is authorized
 *   - bandit's proposal is gated SEPARATELY by HB-04 (double-gate)
 *   - bandit posterior remains private (separate test file enforces this)
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  workerGenerate,
  emptyWorkerState,
  resetWorkerCounter,
} from '../../roles/worker.js';
import { evaluatorRun, emptyEvaluatorState } from '../../roles/evaluator.js';
import { evolutionPropose, emptyEvolutionState } from '../../roles/evolution.js';
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

describe('HB-07 × HB-04 composition', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetWorkerCounter();
  });

  it('extension NOT invoked when HB-04 role-split CAPCOM gate is unauthorized', () => {
    // Both flags on; bandit-marker on; but HB-04 marker absent.
    const env = makeBanditEnv(true, true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    // NOTE: roles capcom NOT authorized.

    let invocations = 0;
    const mockReflect: ReflectionFn = () => {
      invocations += 1;
      return [];
    };
    const bandit = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(11),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });

    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);
    evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // No reflection ran because the bandit was never invoked.
    expect(invocations).toBe(0);
    const s = bandit._testGetStateClone();
    expect(s.episode).toBe(0);
  });

  it('extension IS invoked when HB-04 role-split AND bandit gates BOTH authorized', () => {
    const env = makeBanditEnv(true, true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    authorizeRolesCapcom(env);

    const mockReflect: ReflectionFn = ({ patterns }) => {
      if (patterns.length === 0) return [];
      return [
        {
          failureClass: patterns[0]!.failureClass,
          rootCausePattern: 'composed-mock',
          proposedPolicyChange: 'switch retrieval to long-context',
          confidence: 0.85,
          producedAt: 't',
        },
      ];
    };
    const bandit = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(12),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });

    // Generate enough Worker output to produce ≥2 evaluator diagnostics
    // (HB-04 in-house heuristic threshold + the bandit's pattern need).
    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    ws = workerGenerate(ws, { taskId: 't', summary: 'recursive helper unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);

    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // Bandit invocation happened — its private state advanced.
    const s = bandit._testGetStateClone();
    expect(s.episode).toBe(1);
    expect(s.lastSelection).not.toBeNull();

    // The bandit's proposal made it through HB-04's protocol-update gate
    // because the same marker authorizes both `role-split-activation` and
    // `protocol-update` (HB-04 v1.49.575 design).
    const banditProposal = ev.proposals.find((p) => p.source === 'ael-bandit-v1');
    expect(banditProposal).toBeDefined();
    expect(banditProposal?.protocol).toBe('auto-load');
    expect(banditProposal?.change).toBe('switch retrieval to long-context');
  });

  it('HB-04 protocol-update gate STAGES (drops) bandit proposals when its marker is absent', () => {
    // Bandit-engagement auth present, HB-04 role-split + protocol-update
    // marker absent — but flag on. The bandit should not even be invoked
    // because HB-04 gates the extension on role-split-activation auth.
    const env = makeBanditEnv(true, true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);

    const mockReflect: ReflectionFn = ({ patterns }) =>
      patterns.length > 0
        ? [{ failureClass: patterns[0]!.failureClass, rootCausePattern: 'r', proposedPolicyChange: 'c', confidence: 0.9, producedAt: 't' }]
        : [];
    const bandit = new AelBandit({
      arms: ['p1'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(13),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });

    let ws = emptyWorkerState('t');
    ws = workerGenerate(ws, { taskId: 't', summary: 'unbounded-recursion' }, env.configPath);
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // No bandit-source proposal slipped through.
    const banditProposal = ev.proposals.find((p) => p.source === 'ael-bandit-v1');
    expect(banditProposal).toBeUndefined();
  });
});

/**
 * HB-07 — extension tests. Verifies AelBandit implements
 * EvolutionExtensionPoint, honors the snapshot-frozen invariant, and
 * returns null when not authorized at the bandit-engagement gate.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { AelBandit } from '../extension.js';
import type {
  EvolutionExtensionPoint,
  EvolutionSnapshot,
} from '../../roles/types.js';
import { makeBanditEnv, authorizeBanditCapcom, makeSeededPrng } from './test-helpers.js';
import type { ReflectionFn } from '../types.js';

function makeSnapshot(opts: { failures: number }): EvolutionSnapshot {
  const diagnostics = [];
  for (let i = 0; i < opts.failures; i++) {
    diagnostics.push(
      Object.freeze({
        role: 'evaluator' as const,
        candidateId: `c${i}`,
        failureClass: 'unbounded-recursion',
        severity: 'high' as const,
        rootCause: 'no depth limit',
        block: true,
        cited: Object.freeze([]),
        producedAt: '2026-04-25T00:00:00Z',
      }),
    );
  }
  return Object.freeze({
    workerState: Object.freeze({
      role: 'worker' as const,
      taskId: 't',
      candidates: Object.freeze([]),
      internalNotes: Object.freeze([]),
    }),
    evaluatorState: Object.freeze({
      role: 'evaluator' as const,
      diagnostics: Object.freeze(diagnostics),
    }),
    patterns: Object.freeze([
      Object.freeze({
        failureClass: 'unbounded-recursion',
        occurrences: opts.failures,
        affectedCandidates: Object.freeze(diagnostics.map((d) => d.candidateId)),
      }),
    ]),
  });
}

describe('AelBandit extension', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('implements EvolutionExtensionPoint with stable id', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    const ext: EvolutionExtensionPoint = new AelBandit({
      arms: ['p1', 'p2'],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(ext.id).toBe('ael-bandit-v1');
    expect(typeof ext.proposePolicyUpdate).toBe('function');
  });

  it('returns null without bandit-engagement auth (existing auto-load runs unchanged)', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    const ext = new AelBandit({
      arms: ['p1', 'p2'],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    const r = ext.proposePolicyUpdate(makeSnapshot({ failures: 6 }));
    expect(r).toBeNull();
    // No posterior was written — bandit refused to engage.
    const state = ext._testGetStateClone();
    expect(state.episode).toBe(0);
    expect(Object.keys(state.policies).length).toBe(0);
  });

  it('returns null with flag off even if marker is somehow present', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const ext = new AelBandit({
      arms: ['p1', 'p2'],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    const r = ext.proposePolicyUpdate(makeSnapshot({ failures: 10 }));
    expect(r).toBeNull();
  });

  it('engages when authorized; produces proposal once reflection fires', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);

    // Force the slow loop to fire by lowering threshold to 1; force a
    // concrete insight via mocked reflectFn.
    const mockReflect: ReflectionFn = ({ patterns }) => {
      if (patterns.length === 0) return [];
      return [
        {
          failureClass: patterns[0]!.failureClass,
          rootCausePattern: 'mock-root',
          proposedPolicyChange: 'mock-change',
          confidence: 0.9,
          producedAt: '2026-04-25T00:00:00Z',
        },
      ];
    };

    const ext = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(1),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });

    // Single failure-rich snapshot crosses threshold immediately.
    const proposal = ext.proposePolicyUpdate(makeSnapshot({ failures: 3 }));
    expect(proposal).not.toBeNull();
    expect(proposal!.protocol).toBe('auto-load');
    expect(proposal!.source).toBe('ael-bandit-v1');
    expect(proposal!.change).toBe('mock-change');
    // Posterior was written.
    const s = ext._testGetStateClone();
    expect(s.episode).toBe(1);
    expect(s.lastSelection).not.toBeNull();
  });

  it('honors frozen-snapshot invariant — extension does not mutate snapshot', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const ext = new AelBandit({
      arms: ['p1'],
      config: { random: makeSeededPrng(2) },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    const snap = makeSnapshot({ failures: 1 });
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.evaluatorState)).toBe(true);
    expect(Object.isFrozen(snap.patterns)).toBe(true);
    ext.proposePolicyUpdate(snap);
    // Still frozen, still same patterns.
    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap.patterns.length).toBe(1);
  });
});

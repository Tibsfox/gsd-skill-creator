/**
 * HB-07 — boundary tests for unusual inputs.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { AelBandit } from '../extension.js';
import { selectPolicy, observeReward, emptyBanditState, maybeReflect } from '../bandit.js';
import { posteriorMean, makePosterior, sampleBeta, thompsonSelect, EMPTY_POSTERIORS } from '../posterior.js';
import { defaultReflectionFn, runReflection } from '../reflection.js';
import {
  makeBanditEnv,
  authorizeBanditCapcom,
  makeSeededPrng,
} from './test-helpers.js';
import type { ReflectionFn } from '../types.js';

describe('boundary cases', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('all-success episodes keep failuresSinceReflection at 0', () => {
    let s = emptyBanditState();
    for (let i = 0; i < 50; i++) s = observeReward(s, 'p1', 1);
    expect(s.failuresSinceReflection).toBe(0);
    const r = maybeReflect(s, [
      { failureClass: 'fc', occurrences: 3, affectedCandidates: ['x', 'y'] },
    ]);
    expect(r.insights).toHaveLength(0);
  });

  it('empty failure history → reflection produces no insights', () => {
    const insights = runReflection(defaultReflectionFn, [], 'p1', 0);
    expect(insights).toHaveLength(0);
  });

  it('extreme posterior values — Beta(1000, 1) mean ≈ 1, sample is high', () => {
    const post = makePosterior(1000, 1);
    expect(posteriorMean(post)).toBeGreaterThan(0.99);
    const rand = makeSeededPrng(99);
    let max = 0;
    for (let i = 0; i < 20; i++) {
      max = Math.max(max, sampleBeta(post, rand));
    }
    expect(max).toBeGreaterThan(0.9);
  });

  it('thompsonSelect on empty arms returns null', () => {
    const rand = makeSeededPrng(5);
    expect(thompsonSelect(EMPTY_POSTERIORS, [], rand)).toBeNull();
  });

  it('selectPolicy on bandit with no arms returns null', () => {
    const r = selectPolicy(emptyBanditState(), [], { random: makeSeededPrng(1) });
    expect(r).toBeNull();
  });

  it('reflection on non-actionable patterns (single occurrence, single candidate) yields no insight', () => {
    const insights = runReflection(
      defaultReflectionFn,
      [{ failureClass: 'fc', occurrences: 1, affectedCandidates: ['c'] }],
      'p',
      0,
    );
    expect(insights).toHaveLength(0);
  });

  it('AelBandit with empty arms returns null even when fully authorized', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const ext = new AelBandit({
      arms: [],
      config: { random: makeSeededPrng(2) },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    const snap = {
      workerState: { role: 'worker' as const, taskId: 't', candidates: [], internalNotes: [] },
      evaluatorState: { role: 'evaluator' as const, diagnostics: [] },
      patterns: [],
    } as const;
    expect(ext.proposePolicyUpdate(snap as any)).toBeNull();
  });

  it('reflection insight without matching pattern still produces a proposal with synthetic trigger', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const mockReflect: ReflectionFn = () => [
      {
        failureClass: 'unmatched-class',
        rootCausePattern: 'orphan',
        proposedPolicyChange: 'do-something',
        confidence: 0.7,
        producedAt: 't',
      },
    ];
    const ext = new AelBandit({
      arms: ['p1'],
      config: { reflectionThreshold: 1, reflectFn: mockReflect, random: makeSeededPrng(3) },
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
            failureClass: 'other',
            severity: 'low' as const,
            rootCause: 'r',
            block: false,
            cited: [],
            producedAt: 't',
          },
        ],
      },
      patterns: [{ failureClass: 'other', occurrences: 1, affectedCandidates: ['c0'] }],
    } as const;
    const r = ext.proposePolicyUpdate(snap as any);
    expect(r).not.toBeNull();
    expect(r!.trigger.failureClass).toBe('other');
    expect(r!.change).toBe('do-something');
  });
});

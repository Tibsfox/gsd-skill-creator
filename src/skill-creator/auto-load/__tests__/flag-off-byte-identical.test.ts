/**
 * HB-07 — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.ael-bandit.enabled=false` (or block absent, or file
 * absent), every public-surface entry point must:
 *   - return a stable disabled-result sentinel (or no-op),
 *   - not initialise a bandit posterior,
 *   - not emit a CAPCOM gate record,
 *   - not invoke the reflection function.
 *
 * Mirrors HB-03's `flag-off-byte-identical.test.ts` and HB-04's same-named
 * pattern.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import {
  AEL_BANDIT_GATE_DISABLED_RESULT,
  emitBanditEngagementGate,
  emitReflectionPolicyUpdateGate,
  AelBandit,
  isAelBanditEnabled,
} from '../index.js';
import { makeBanditEnv, authorizeBanditCapcom } from './test-helpers.js';
import type { ReflectionFn } from '../types.js';

describe('AEL bandit — flag-off byte-identical', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('flag absent → isAelBanditEnabled is false', () => {
    const env = makeBanditEnv(undefined);
    cleanups.push(env.cleanup);
    expect(isAelBanditEnabled(env.configPath)).toBe(false);
  });

  it('flag false → engagement gate is disabled sentinel (no record)', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    const r = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(AEL_BANDIT_GATE_DISABLED_RESULT);
    expect(JSON.stringify(r)).toBe(
      '{"emitted":false,"authorized":false,"disabled":true,"record":null}',
    );
  });

  it('flag false → reflection-policy-update gate is disabled sentinel', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    const r = emitReflectionPolicyUpdateGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(AEL_BANDIT_GATE_DISABLED_RESULT);
  });

  it('flag false → AelBandit.proposePolicyUpdate is no-op (posterior not initialised)', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    // Even if the marker is somehow present, flag-false short-circuits.
    authorizeBanditCapcom(env);

    let reflectInvoked = 0;
    const mockReflect: ReflectionFn = () => {
      reflectInvoked += 1;
      return [];
    };
    const bandit = new AelBandit({
      arms: ['p1', 'p2'],
      config: { reflectionThreshold: 1, reflectFn: mockReflect },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    const snap = {
      workerState: { role: 'worker' as const, taskId: 't', candidates: [], internalNotes: [] },
      evaluatorState: { role: 'evaluator' as const, diagnostics: [] },
      patterns: [{ failureClass: 'fc', occurrences: 5, affectedCandidates: ['x'] }],
    } as const;
    const r = bandit.proposePolicyUpdate(snap as any);
    expect(r).toBeNull();
    expect(reflectInvoked).toBe(0);
    const s = bandit._testGetStateClone();
    expect(s.episode).toBe(0);
    expect(Object.keys(s.policies).length).toBe(0);
  });

  it('flag false → no CAPCOM marker file is created by the module', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(existsSync(env.capcomMarkerPath)).toBe(false);
  });

  it('disabled sentinels are deterministically equal across calls', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    const a = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    const b = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(a).toBe(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

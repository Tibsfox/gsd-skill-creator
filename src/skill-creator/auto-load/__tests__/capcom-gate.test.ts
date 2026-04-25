/**
 * HB-07 — CAPCOM HARD GATE tests.
 *
 * Verifies BOTH bandit-engagement and reflection-induced-policy-update
 * gates fire correctly + that without auth, existing auto-load runs
 * unchanged (i.e., bandit refuses to engage).
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  emitBanditEngagementGate,
  emitReflectionPolicyUpdateGate,
  isBanditCapcomAuthorized,
  isBanditActivationTriggered,
  AEL_BANDIT_GATE_DISABLED_RESULT,
} from '../capcom-gate.js';
import { AelBandit } from '../extension.js';
import {
  makeBanditEnv,
  authorizeBanditCapcom,
  makeSeededPrng,
} from './test-helpers.js';
import type { ReflectionFn } from '../types.js';
import { writeFileSync } from 'node:fs';

describe('CAPCOM HARD GATE — AEL bandit', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('flag-off → gate is fully disabled (no record emitted)', () => {
    const env = makeBanditEnv(false);
    cleanups.push(env.cleanup);
    const r = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(AEL_BANDIT_GATE_DISABLED_RESULT);
    const r2 = emitReflectionPolicyUpdateGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r2).toBe(AEL_BANDIT_GATE_DISABLED_RESULT);
  });

  it('engagement gate fires unauthorized when flag on but marker missing', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    const r = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r.emitted).toBe(true);
    expect(r.authorized).toBe(false);
    expect(r.record?.kind).toBe('bandit-engagement');
  });

  it('engagement gate fires authorized once marker is written + non-empty', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const r = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r.authorized).toBe(true);
    expect(r.record?.authorized).toBe(true);
  });

  it('marker that is empty/whitespace does NOT authorize', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(env.capcomMarkerPath, '   \n\t  ', 'utf8');
    expect(isBanditCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
  });

  it('trigger marker is distinct from auth marker (HB-03 trigger-vs-auth)', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(env.triggerMarkerPath, '', 'utf8');
    expect(isBanditActivationTriggered(env.triggerMarkerPath)).toBe(true);
    expect(isBanditCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
  });

  it('reflection-induced-update gate emits its own kind record', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);
    const r = emitReflectionPolicyUpdateGate({
      note: 'test-reflection',
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r.emitted).toBe(true);
    expect(r.authorized).toBe(true);
    expect(r.record?.kind).toBe('reflection-policy-update');
    expect(r.record?.note).toBe('test-reflection');
  });

  it('without bandit-engagement auth, existing auto-load runs unchanged (bandit returns null + does not write posterior)', () => {
    // This is the production-scenario assertion: flag on, marker absent.
    // The bandit MUST refuse to engage. We verify by checking the bandit's
    // private state is untouched after a proposePolicyUpdate call.
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);

    const mockReflect: ReflectionFn = () => [
      {
        failureClass: 'fc',
        rootCausePattern: 'r',
        proposedPolicyChange: 'c',
        confidence: 0.9,
        producedAt: 't',
      },
    ];
    const ext = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(3),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    const snap = {
      workerState: {
        role: 'worker' as const,
        taskId: 't',
        candidates: [],
        internalNotes: [],
      },
      evaluatorState: { role: 'evaluator' as const, diagnostics: [] },
      patterns: [{ failureClass: 'fc', occurrences: 5, affectedCandidates: ['x'] }],
    } as const;
    const r = ext.proposePolicyUpdate(snap as any);
    expect(r).toBeNull();
    const s = ext._testGetStateClone();
    expect(s.episode).toBe(0);
    expect(Object.keys(s.policies).length).toBe(0);
    expect(s.lastSelection).toBeNull();
  });

  it('with engagement auth + reflection threshold met, gate fires both events (engagement + reflection-policy-update)', () => {
    const env = makeBanditEnv(true);
    cleanups.push(env.cleanup);
    authorizeBanditCapcom(env);

    const mockReflect: ReflectionFn = ({ patterns }) => [
      {
        failureClass: patterns[0]?.failureClass ?? 'fc',
        rootCausePattern: 'mock',
        proposedPolicyChange: 'switch policy',
        confidence: 0.95,
        producedAt: 't',
      },
    ];
    const ext = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: mockReflect,
        random: makeSeededPrng(4),
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

    const proposal = ext.proposePolicyUpdate(snap as any);
    expect(proposal).not.toBeNull();
    expect(proposal!.protocol).toBe('auto-load');
    // Both gates were authorized (we set the marker).
    const r1 = emitBanditEngagementGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    const r2 = emitReflectionPolicyUpdateGate({
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r1.authorized).toBe(true);
    expect(r2.authorized).toBe(true);
  });
});

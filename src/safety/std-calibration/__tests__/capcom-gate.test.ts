/**
 * HB-03 — CAPCOM HARD GATE tests.
 *
 * The gate fires in two production scenarios:
 *   1. Calibration update — when a new STD value would replace existing.
 *   2. Fail-closed activation — when bootstrap defaults are about to take
 *      effect at a critical decision point.
 *
 * Without authorization (the `.planning/safety/std-calibration.capcom`
 * marker), neither scenario activates the calibration value or the
 * fail-closed default.
 *
 * Mirrors the v1.49.574 megakernel-substrate adapter-selection-schema
 * CAPCOM-gate-test pattern.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { emitCapcomGate, isCapcomAuthorized, CAPCOM_GATE_DISABLED_RESULT } from '../capcom-gate.js';
import { evaluateBootstrap, resetBootstrapLatch } from '../bootstrap.js';
import { stageCalibration, promoteStaged, EMPTY_CALIBRATION_TABLE } from '../calibration-table.js';
import { makeEnv, recordTrigger, authorizeCapcom } from './test-helpers.js';

describe('STD CAPCOM HARD GATE', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetBootstrapLatch();
  });

  it('fires on calibration-update; without auth, authorized=false (caller MUST refuse activation)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const result = emitCapcomGate('calibration-update', {
      model: 'opus',
      proposedStd: 14,
      previousStd: 11,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(result.emitted).toBe(true);
    expect(result.authorized).toBe(false);
    expect(result.disabled).toBe(false);
    expect(result.record?.reason).toBe('calibration-update');
    expect(result.record?.proposedStd).toBe(14);
    expect(result.record?.previousStd).toBe(11);
    // Caller-side invariant: without auth, the proposed std MUST stay staged.
    // Demonstrate by staging and refusing to promote.
    const staged = stageCalibration(EMPTY_CALIBRATION_TABLE, {
      model: 'opus',
      std: 14,
      measuredAt: '2026-04-25T00:00:00Z',
      trialCount: 1,
      complianceAtStd: 0.4,
    });
    const promoted = result.authorized ? promoteStaged(staged, 'opus') : staged;
    expect(promoted.entries).toHaveLength(0);
    expect(promoted.staged).toHaveLength(1);
  });

  it('fires on fail-closed activation; without auth, authorized=false; system stays conservative', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    recordTrigger(env);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // Bootstrap path triggers the fail-closed-activation gate internally
      // because the explicit trigger marker is present.
      const state = evaluateBootstrap({
        tablePath: env.tablePath,
        triggerMarkerPath: env.triggerMarkerPath,
        capcomMarkerPath: env.capcomMarkerPath,
        settingsPath: env.configPath,
        silent: true,
      });
      expect(state.engaged).toBe(true);
      // The gate's authorization is also reachable via the public surface.
      expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
      // And it can be queried directly to confirm the gate-record shape.
      const direct = emitCapcomGate('fail-closed-activation', {
        model: null,
        proposedStd: state.conservativeStd,
        markerPath: env.capcomMarkerPath,
        settingsPath: env.configPath,
      });
      expect(direct.emitted).toBe(true);
      expect(direct.authorized).toBe(false);
      expect(direct.record?.reason).toBe('fail-closed-activation');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('with auth recorded → authorized=true on both reasons', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const a = emitCapcomGate('calibration-update', {
      model: 'sonnet',
      proposedStd: 9,
      previousStd: null,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(a.authorized).toBe(true);
    const b = emitCapcomGate('fail-closed-activation', {
      model: null,
      proposedStd: 5,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(b.authorized).toBe(true);
  });

  it('flag off → disabled sentinel; gate does NOT emit + isCapcomAuthorized irrelevant', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    authorizeCapcom(env); // even with marker present, flag off blocks emit
    const r = emitCapcomGate('calibration-update', {
      model: 'opus',
      proposedStd: 11,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(CAPCOM_GATE_DISABLED_RESULT);
    expect(r.disabled).toBe(true);
    expect(r.emitted).toBe(false);
    expect(r.record).toBeNull();
  });

  it('isCapcomAuthorized rejects empty marker file', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(env.capcomMarkerPath, '   \n  ', 'utf8');
    expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
  });
});

/**
 * HB-03 — fail-closed bootstrap exception (impact.md §4 #2).
 *
 * Confirms the exception path:
 *   - explicit `std-calibrate` trigger advances the system into a state
 *     where fail-closed activation is *attempted* (CAPCOM gate fires);
 *   - absence of trigger preserves the conservative-floor advisory mode
 *     (no autonomous fail-closed switch).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { evaluateBootstrap, resetBootstrapLatch } from '../bootstrap.js';
import { decideReInjection } from '../re-injection.js';
import { isCapcomAuthorized } from '../capcom-gate.js';
import { BOOTSTRAP_STD_FLOOR } from '../types.js';
import { makeEnv, recordTrigger, authorizeCapcom } from './test-helpers.js';

describe('STD fail-closed bootstrap exception', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetBootstrapLatch();
  });

  it('absence of trigger → bootstrap stays in conservative advisory mode (no autonomous fail-closed)', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const state = evaluateBootstrap({
      tablePath: env.tablePath,
      triggerMarkerPath: env.triggerMarkerPath,
      capcomMarkerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      silent: true,
    });
    expect(state.engaged).toBe(true);
    expect(state.explicitTriggerRecorded).toBe(false);
    // Re-injection must use the bootstrap floor, not a real STD.
    const decision = decideReInjection('opus', BOOTSTRAP_STD_FLOOR, ['x'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(decision.usedBootstrapFloor).toBe(true);
    // CAPCOM marker absent → not authorized.
    expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
  });

  it('explicit trigger present + no CAPCOM auth → gate fires but stays unauthorized; system stays conservative', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    recordTrigger(env);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const state = evaluateBootstrap({
        tablePath: env.tablePath,
        triggerMarkerPath: env.triggerMarkerPath,
        capcomMarkerPath: env.capcomMarkerPath,
        settingsPath: env.configPath,
        silent: true,
      });
      expect(state.engaged).toBe(true);
      expect(state.explicitTriggerRecorded).toBe(true);
      expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('explicit trigger + CAPCOM auth recorded → authorization is detected', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    recordTrigger(env);
    authorizeCapcom(env);
    const state = evaluateBootstrap({
      tablePath: env.tablePath,
      triggerMarkerPath: env.triggerMarkerPath,
      capcomMarkerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      silent: true,
    });
    expect(state.explicitTriggerRecorded).toBe(true);
    expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(true);
  });
});

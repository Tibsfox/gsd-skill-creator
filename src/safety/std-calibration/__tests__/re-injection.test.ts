/**
 * HB-03 — re-injection middleware tests.
 *
 * Trigger contract: depth = std-1 → no fire; depth >= std → fire.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { decideReInjection } from '../re-injection.js';
import { writeTable, EMPTY_CALIBRATION_TABLE, stageCalibration, promoteStaged } from '../calibration-table.js';
import { BOOTSTRAP_STD_FLOOR } from '../types.js';
import { makeEnv } from './test-helpers.js';

describe('STD re-injection middleware', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  function withCalibration(std: number) {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const staged = stageCalibration(EMPTY_CALIBRATION_TABLE, {
      model: 'opus',
      std,
      measuredAt: '2026-04-25T00:00:00Z',
      trialCount: 64,
      complianceAtStd: 0.45,
    });
    const promoted = promoteStaged(staged, 'opus');
    writeTable(promoted, env.tablePath, env.configPath);
    return env;
  }

  it('does NOT fire at depth = STD-1', () => {
    const env = withCalibration(11);
    const r = decideReInjection('opus', 10, ['no-pii', 'no-secrets'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r.disabled).toBe(false);
    expect(r.triggered).toBe(false);
    expect(r.constraintsReinjected).toEqual([]);
  });

  it('fires at depth = STD and includes the active constraints', () => {
    const env = withCalibration(11);
    const r = decideReInjection('opus', 11, ['no-pii', 'no-secrets'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r.triggered).toBe(true);
    expect(r.std).toBe(11);
    expect(r.constraintsReinjected).toEqual(['no-pii', 'no-secrets']);
    expect(r.usedBootstrapFloor).toBe(false);
  });

  it('fires past STD as well (decay continues)', () => {
    const env = withCalibration(8);
    const r = decideReInjection('opus', 16, ['x'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r.triggered).toBe(true);
  });

  it('uses bootstrap conservative floor when no calibration for the model', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const r = decideReInjection('haiku', BOOTSTRAP_STD_FLOOR, ['rule-A'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r.usedBootstrapFloor).toBe(true);
    expect(r.std).toBe(BOOTSTRAP_STD_FLOOR);
    expect(r.triggered).toBe(true);
  });

  it('flag off → disabled decision; never fires', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = decideReInjection('opus', 999, ['x'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r.disabled).toBe(true);
    expect(r.triggered).toBe(false);
  });
});

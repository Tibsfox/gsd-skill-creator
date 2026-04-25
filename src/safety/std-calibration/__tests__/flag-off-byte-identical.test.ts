/**
 * HB-03 STD Calibration — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.std-calibration.enabled=false` (or block absent, or
 * file absent), every public-surface entry point must:
 *   - return a stable disabled-result sentinel (or empty-state),
 *   - not produce a calibration table,
 *   - not emit a CAPCOM gate record,
 *   - not fire re-injection.
 *
 * This mirrors the v1.49.574 megakernel-substrate `disabled-byte-identical`
 * pattern + the v1.49.575 HB-02 `flag-off-byte-identical` pattern.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import {
  decideReInjection,
  RE_INJECTION_DISABLED_DECISION,
  measureDecay,
  DECAY_MEASUREMENT_DISABLED_RESULT,
  emitCapcomGate,
  CAPCOM_GATE_DISABLED_RESULT,
  evaluateBootstrap,
  BOOTSTRAP_DISABLED_STATE,
  writeTable,
  EMPTY_CALIBRATION_TABLE,
  resetBootstrapLatch,
} from '../index.js';
import { makeEnv, makeMissingConfigEnv } from './test-helpers.js';

describe('STD calibration — flag-off byte-identical', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetBootstrapLatch();
  });

  it('re-injection returns frozen disabled sentinel (config missing)', () => {
    const env = makeMissingConfigEnv();
    cleanups.push(env.cleanup);
    const r = decideReInjection('opus', 999, ['x'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(RE_INJECTION_DISABLED_DECISION);
    expect(JSON.stringify(r)).toBe(
      '{"triggered":false,"depth":0,"std":0,"model":null,"constraintsReinjected":[],"usedBootstrapFloor":false,"disabled":true}',
    );
  });

  it('re-injection returns frozen disabled sentinel (flag false)', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = decideReInjection('opus', 999, ['x'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(RE_INJECTION_DISABLED_DECISION);
  });

  it('decay measurement returns frozen disabled sentinel when flag off', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = measureDecay('opus', [], 0.5, env.configPath);
    expect(r).toBe(DECAY_MEASUREMENT_DISABLED_RESULT);
  });

  it('CAPCOM gate returns frozen disabled sentinel when flag off', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = emitCapcomGate('calibration-update', {
      model: 'opus',
      proposedStd: 11,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(CAPCOM_GATE_DISABLED_RESULT);
  });

  it('bootstrap returns frozen disabled state when flag off', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const s = evaluateBootstrap({
      tablePath: env.tablePath,
      triggerMarkerPath: env.triggerMarkerPath,
      capcomMarkerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      silent: true,
    });
    expect(s).toBe(BOOTSTRAP_DISABLED_STATE);
  });

  it('writeTable does NOT create the calibration file when flag off', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = writeTable(EMPTY_CALIBRATION_TABLE, env.tablePath, env.configPath);
    expect(r).toBeNull();
    expect(existsSync(env.tablePath)).toBe(false);
  });

  it('JSON disabled-result fingerprints match the v1.49.575 fixture (flag off)', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    expect(
      JSON.stringify(
        decideReInjection('opus', 1, [], { tablePath: env.tablePath, settingsPath: env.configPath }),
      ),
    ).toBe('{"triggered":false,"depth":0,"std":0,"model":null,"constraintsReinjected":[],"usedBootstrapFloor":false,"disabled":true}');
    expect(JSON.stringify(measureDecay('opus', [], 0.5, env.configPath))).toBe(
      '{"model":"opus","std":0,"trialCount":0,"complianceAtStd":0,"perTurnCompliance":[],"disabled":true}',
    );
    expect(
      JSON.stringify(
        emitCapcomGate('calibration-update', { settingsPath: env.configPath, markerPath: env.capcomMarkerPath }),
      ),
    ).toBe('{"emitted":false,"authorized":false,"disabled":true,"record":null}');
    expect(
      JSON.stringify(
        evaluateBootstrap({
          tablePath: env.tablePath,
          triggerMarkerPath: env.triggerMarkerPath,
          capcomMarkerPath: env.capcomMarkerPath,
          settingsPath: env.configPath,
          silent: true,
        }),
      ),
    ).toBe('{"engaged":false,"conservativeStd":0,"warned":false,"explicitTriggerRecorded":false,"disabled":true}');
  });

  it('disabled sentinels are deterministically equal across calls', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const a = decideReInjection('opus', 1, [], { tablePath: env.tablePath, settingsPath: env.configPath });
    const b = decideReInjection('opus', 999, ['x', 'y'], { tablePath: env.tablePath, settingsPath: env.configPath });
    expect(a).toBe(b); // same frozen reference
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

/**
 * HB-03 — bootstrap fail-closed exception tests.
 *
 * Disposition: impact.md §4 #2.
 *
 * First run with no calibration → conservative STD ≤5 + one-time WARN +
 * requires explicit `npx skill-creator safety std-calibrate <model>`
 * trigger before fail-closed activates.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { evaluateBootstrap, resetBootstrapLatch } from '../bootstrap.js';
import { writeTable, stageCalibration, promoteStaged, EMPTY_CALIBRATION_TABLE } from '../calibration-table.js';
import { BOOTSTRAP_STD_FLOOR } from '../types.js';
import { makeEnv, recordTrigger } from './test-helpers.js';

describe('STD bootstrap fail-closed', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetBootstrapLatch();
  });

  it('engages conservative STD floor when no calibration data exists', () => {
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
    expect(state.disabled).toBe(false);
    expect(state.engaged).toBe(true);
    expect(state.conservativeStd).toBe(BOOTSTRAP_STD_FLOOR);
    expect(state.conservativeStd).toBeLessThanOrEqual(5);
    expect(state.explicitTriggerRecorded).toBe(false);
  });

  it('emits WARN diagnostic exactly once per process', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const a = evaluateBootstrap({
        tablePath: env.tablePath,
        triggerMarkerPath: env.triggerMarkerPath,
        capcomMarkerPath: env.capcomMarkerPath,
        settingsPath: env.configPath,
      });
      const b = evaluateBootstrap({
        tablePath: env.tablePath,
        triggerMarkerPath: env.triggerMarkerPath,
        capcomMarkerPath: env.capcomMarkerPath,
        settingsPath: env.configPath,
      });
      expect(a.engaged).toBe(true);
      expect(b.engaged).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does NOT engage bootstrap when calibration data is present', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const staged = stageCalibration(EMPTY_CALIBRATION_TABLE, {
      model: 'opus',
      std: 12,
      measuredAt: '2026-04-25T00:00:00Z',
      trialCount: 64,
      complianceAtStd: 0.45,
    });
    writeTable(promoteStaged(staged, 'opus'), env.tablePath, env.configPath);
    const state = evaluateBootstrap({
      tablePath: env.tablePath,
      triggerMarkerPath: env.triggerMarkerPath,
      capcomMarkerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      silent: true,
    });
    expect(state.engaged).toBe(false);
    expect(state.conservativeStd).toBe(0);
  });

  it('reports explicitTriggerRecorded true after CLI trigger marker is recorded', () => {
    resetBootstrapLatch();
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    recordTrigger(env);
    const state = evaluateBootstrap({
      tablePath: env.tablePath,
      triggerMarkerPath: env.triggerMarkerPath,
      capcomMarkerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      silent: true,
    });
    expect(state.explicitTriggerRecorded).toBe(true);
  });

  it('flag off → disabled state; no bootstrap engages', () => {
    resetBootstrapLatch();
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const state = evaluateBootstrap({
      tablePath: env.tablePath,
      triggerMarkerPath: env.triggerMarkerPath,
      capcomMarkerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      silent: true,
    });
    expect(state.disabled).toBe(true);
    expect(state.engaged).toBe(false);
  });
});

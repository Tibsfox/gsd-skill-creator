/**
 * MD-4 — Read API tests.
 *
 * Gates: currentTemperature() read API; cache invalidation; warm-restart;
 * sentinel on disabled; module-level functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TemperatureApi,
  defaultApi,
  currentTemperature,
  currentEta0,
  ETA0_SCALE,
} from '../api.js';
import { SENTINEL_TEMPERATURE } from '../settings.js';
import type { QuintessenceSnapshot } from '../../types/symbiosis.js';
import type { SkillMixEntry } from '../tract-tempering.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSnapshot(stabilityVsNovelty: number, fatefulEncounters = 0): QuintessenceSnapshot {
  return {
    ts: Date.now(),
    selfVsNonSelf: 0.5,
    essentialTensions: 0.2,
    growthAndEnergyFlow: 1200,
    stabilityVsNovelty,
    fatefulEncounters,
  };
}

function tractableMix(n: number): SkillMixEntry[] {
  return Array.from({ length: n }, (_, i) => ({ skillId: `t${i}`, tractability: 'tractable' as const }));
}

function coinFlipMix(n: number): SkillMixEntry[] {
  return Array.from({ length: n }, (_, i) => ({ skillId: `c${i}`, tractability: 'coin-flip' as const }));
}

// ─── TemperatureApi — disabled (default) ─────────────────────────────────────

describe('TemperatureApi — disabled (default OFF)', () => {
  let api: TemperatureApi;

  beforeEach(() => {
    api = new TemperatureApi();
  });

  it('currentTemperature() returns sentinel before any update', () => {
    expect(api.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
  });

  it('currentTemperature() returns sentinel after update when disabled', () => {
    api.update(makeSnapshot(0.2, 0), tractableMix(5));
    expect(api.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
  });

  it('currentEta0() returns sentinel × ETA0_SCALE when disabled', () => {
    expect(api.currentEta0()).toBeCloseTo(SENTINEL_TEMPERATURE * ETA0_SCALE, 10);
  });

  it('lastResult() returns null before first update', () => {
    expect(api.lastResult()).toBeNull();
  });
});

// ─── TemperatureApi — enabled ─────────────────────────────────────────────────

describe('TemperatureApi — enabled', () => {
  let api: TemperatureApi;

  beforeEach(() => {
    api = new TemperatureApi({ enabled: true });
  });

  it('currentTemperature() returns sentinel before first update', () => {
    // Cache is empty; returns sentinel regardless of enabled
    expect(api.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
  });

  it('after update, currentTemperature() returns computed T_session', () => {
    const snapshot = makeSnapshot(0.5, 0);
    const result = api.update(snapshot, tractableMix(5));
    expect(api.currentTemperature()).toBe(result.T_session);
    expect(result.T_session).not.toBe(SENTINEL_TEMPERATURE);
    expect(result.enabled).toBe(true);
  });

  it('cache invalidates on update — new snapshot produces new value', () => {
    api.update(makeSnapshot(0.8, 0), tractableMix(5)); // stable → low T
    const first = api.currentTemperature();
    api.update(makeSnapshot(0.2, 0), tractableMix(5)); // novel → high T
    const second = api.currentTemperature();
    expect(second).toBeGreaterThan(first);
  });

  it('currentEta0() = currentTemperature() × ETA0_SCALE', () => {
    api.update(makeSnapshot(0.5, 0), tractableMix(5));
    expect(api.currentEta0()).toBeCloseTo(api.currentTemperature() * ETA0_SCALE, 10);
  });

  it('lastResult() matches the result returned by update()', () => {
    const result = api.update(makeSnapshot(0.6, 1), coinFlipMix(3));
    const last = api.lastResult();
    expect(last).not.toBeNull();
    expect(last!.T_session).toBe(result.T_session);
    expect(last!.tract_tempering).toBe(result.tract_tempering);
  });
});

// ─── Cache invalidation ───────────────────────────────────────────────────────

describe('cache invalidation', () => {
  it('successive updates reflect the most recent snapshot', () => {
    const api = new TemperatureApi({ enabled: true });
    const snapshotA = makeSnapshot(0.7, 0); // stable
    const snapshotB = makeSnapshot(0.2, 0); // novel
    api.update(snapshotA, []);
    const tempA = api.currentTemperature();
    api.update(snapshotB, []);
    const tempB = api.currentTemperature();
    expect(tempB).toBeGreaterThan(tempA);
  });

  it('different skill mixes on same snapshot produce different cached values', () => {
    const api = new TemperatureApi({ enabled: true });
    const snapshot = makeSnapshot(0.4, 0);
    api.update(snapshot, tractableMix(10));
    const tractable = api.currentTemperature();
    api.update(snapshot, coinFlipMix(10));
    const coinFlip = api.currentTemperature();
    expect(tractable).toBeGreaterThan(coinFlip);
  });
});

// ─── warmRestart ─────────────────────────────────────────────────────────────

describe('warmRestart', () => {
  it('resets T_session to T_base', () => {
    const api = new TemperatureApi({ enabled: true });
    api.update(makeSnapshot(0.2, 0), tractableMix(10)); // high T
    api.warmRestart();
    expect(api.currentTemperature()).toBe(api.settings.T_base);
  });

  it('warmRestart result has tract_tempering=1.0', () => {
    const api = new TemperatureApi({ enabled: true });
    const result = api.warmRestart();
    expect(result.tract_tempering).toBe(1.0);
  });

  it('warmRestart is reflected in lastResult()', () => {
    const api = new TemperatureApi({ enabled: true });
    api.update(makeSnapshot(0.5, 0), []);
    api.warmRestart();
    const last = api.lastResult();
    expect(last!.T_session).toBe(api.settings.T_base);
  });
});

// ─── configure ───────────────────────────────────────────────────────────────

describe('configure', () => {
  it('configure(enabled: true) activates schedule for subsequent updates', () => {
    const api = new TemperatureApi({ enabled: false });
    api.configure({ enabled: true });
    const result = api.update(makeSnapshot(0.5, 0), tractableMix(5));
    expect(result.enabled).toBe(true);
    expect(result.T_session).not.toBe(SENTINEL_TEMPERATURE);
  });

  it('settings getter reflects configured overrides', () => {
    const api = new TemperatureApi();
    api.configure({ T_base: 0.8, lambda1: 1.0 });
    expect(api.settings.T_base).toBe(0.8);
    expect(api.settings.lambda1).toBe(1.0);
  });
});

// ─── ETA0_SCALE ──────────────────────────────────────────────────────────────

describe('ETA0_SCALE', () => {
  it('at T_base=0.5 (default), η_0_effective = 0.01 (MD-3 default η_0)', () => {
    // η_0_effective = T_base * ETA0_SCALE = 0.5 * 0.02 = 0.01
    expect(0.5 * ETA0_SCALE).toBeCloseTo(0.01, 10);
  });

  it('ETA0_SCALE is 0.02', () => {
    expect(ETA0_SCALE).toBe(0.02);
  });
});

// ─── Module-level defaultApi ──────────────────────────────────────────────────

describe('module-level defaultApi and functions', () => {
  it('defaultApi.currentTemperature() matches currentTemperature()', () => {
    // Both should return same value (module-level wraps defaultApi)
    expect(currentTemperature()).toBe(defaultApi.currentTemperature());
  });

  it('currentEta0() matches defaultApi.currentEta0()', () => {
    expect(currentEta0()).toBe(defaultApi.currentEta0());
  });

  it('defaultApi is disabled by default (sentinel)', () => {
    // defaultApi starts with DEFAULT_SETTINGS (enabled: false)
    // It may have been updated by other tests, but a fresh one starts disabled
    const freshApi = new TemperatureApi();
    expect(freshApi.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
  });
});

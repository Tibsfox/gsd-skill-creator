/**
 * MD-4 — Schedule composition tests.
 *
 * Gates: CF-MD4-01 (bounds on T_session), CF-MD4-02 (monotone response),
 * CF-MD4-04 (tractT correctness in composed result), SC-MD4-01 (flag-off sentinel).
 */

import { describe, it, expect } from 'vitest';
import { computeTemperature, resetTemperature, SENTINEL_TEMPERATURE } from '../schedule.js';
import { createSettings, DEFAULT_SETTINGS } from '../settings.js';
import type { SkillMixEntry } from '../tract-tempering.js';
import type { QuintessenceSnapshot } from '../../types/symbiosis.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSnapshot(
  stabilityVsNovelty: number,
  fatefulEncounters: number = 0,
): QuintessenceSnapshot {
  return {
    ts: 1000,
    selfVsNonSelf: 0.5,
    essentialTensions: 0.2,
    growthAndEnergyFlow: 1200,
    stabilityVsNovelty,
    fatefulEncounters,
  };
}

function makeMix(
  tractable: number,
  coinFlip: number,
  unknown = 0,
): SkillMixEntry[] {
  const entries: SkillMixEntry[] = [];
  for (let i = 0; i < tractable; i++) entries.push({ skillId: `t${i}`, tractability: 'tractable' });
  for (let i = 0; i < coinFlip; i++) entries.push({ skillId: `c${i}`, tractability: 'coin-flip' });
  for (let i = 0; i < unknown; i++) entries.push({ skillId: `u${i}`, tractability: 'unknown' });
  return entries;
}

const ENABLED = createSettings({ enabled: true });

// ─── SC-MD4-01: flag-off returns sentinel ────────────────────────────────────

describe('SC-MD4-01 — flag-off returns sentinel', () => {
  it('disabled schedule returns T_session = SENTINEL_TEMPERATURE (1.0)', () => {
    const result = computeTemperature(makeSnapshot(0.2, 0), makeMix(5, 0), DEFAULT_SETTINGS);
    expect(result.enabled).toBe(false);
    expect(result.T_session).toBe(SENTINEL_TEMPERATURE);
    expect(SENTINEL_TEMPERATURE).toBe(1.0);
  });

  it('disabled result has tract_tempering=1.0 and raw=1.0 (neutral sentinel)', () => {
    const result = computeTemperature(makeSnapshot(0.5, 1), [], DEFAULT_SETTINGS);
    expect(result.tract_tempering).toBe(1.0);
    expect(result.raw).toBe(SENTINEL_TEMPERATURE);
  });
});

// ─── CF-MD4-01: T_session ∈ [T_min, T_max] ───────────────────────────────────

describe('CF-MD4-01 — T_session stays within [T_min, T_max]', () => {
  it('never exceeds T_max even at maximum novelty', () => {
    const result = computeTemperature(makeSnapshot(0.0, 0), makeMix(10, 0), ENABLED);
    expect(result.T_session).toBeLessThanOrEqual(ENABLED.T_max);
  });

  it('never goes below T_min even at maximum stability + coin-flip', () => {
    const result = computeTemperature(makeSnapshot(1.0, 100), makeMix(0, 10), ENABLED);
    expect(result.T_session).toBeGreaterThanOrEqual(ENABLED.T_min);
  });

  it('stays in bounds across 1000 random axis triples (CF-MD4-01 sweep)', () => {
    // Deterministic pseudo-random sweep (Math.random not used — fixed seed via index)
    const n = 1000;
    for (let i = 0; i < n; i++) {
      // Deterministic generation: stability from 0..1, fateful 0..20
      const stability = (i % 101) / 100;
      const fateful = (i * 7) % 21;
      const result = computeTemperature(makeSnapshot(stability, fateful), [], ENABLED);
      expect(result.T_session).toBeGreaterThanOrEqual(ENABLED.T_min);
      expect(result.T_session).toBeLessThanOrEqual(ENABLED.T_max);
      expect(Number.isFinite(result.T_session)).toBe(true);
    }
  });

  it('bounds hold at pathological stability → 0 (divide-by-zero guard)', () => {
    for (let i = 0; i <= 10; i++) {
      const stability = i / 1000; // 0.000..0.010
      const result = computeTemperature(makeSnapshot(stability, 0), [], ENABLED);
      expect(result.T_session).toBeLessThanOrEqual(ENABLED.T_max);
      expect(Number.isFinite(result.T_session)).toBe(true);
    }
  });
});

// ─── CF-MD4-02: monotone response in novelty ─────────────────────────────────

describe('CF-MD4-02 — monotone response', () => {
  it('T_session increases as novelty increases (stability decreases), tractT fixed', () => {
    const stabilities = [0.9, 0.7, 0.5, 0.3, 0.15, 0.05];
    const mix = makeMix(5, 0); // fixed tractT = 1.0
    const temps = stabilities.map((s) =>
      computeTemperature(makeSnapshot(s, 0), mix, ENABLED).T_session,
    );
    for (let i = 0; i < temps.length - 1; i++) {
      expect(temps[i]).toBeLessThanOrEqual(temps[i + 1]);
    }
  });

  it('T_session decreases as fateful encounters increase, other axes fixed', () => {
    const fatefulCounts = [0, 1, 3, 7, 15, 30];
    const mix = makeMix(5, 0);
    const temps = fatefulCounts.map((f) =>
      computeTemperature(makeSnapshot(0.5, f), mix, ENABLED).T_session,
    );
    for (let i = 0; i < temps.length - 1; i++) {
      expect(temps[i]).toBeGreaterThanOrEqual(temps[i + 1]);
    }
  });
});

// ─── tract_tempering composition ─────────────────────────────────────────────

describe('tractT composition in T_session', () => {
  it('coin-flip mix produces lower T_session than tractable mix, same quintessence', () => {
    const snapshot = makeSnapshot(0.4, 0);
    const tractable = computeTemperature(snapshot, makeMix(10, 0), ENABLED);
    const coinFlip = computeTemperature(snapshot, makeMix(0, 10), ENABLED);
    expect(coinFlip.T_session).toBeLessThan(tractable.T_session);
  });

  it('tractT value returned in result matches expected class mean', () => {
    const snapshot = makeSnapshot(0.5, 0);
    const mix = makeMix(5, 5); // 50/50 tractable + coin-flip → mean 0.65
    const result = computeTemperature(snapshot, mix, ENABLED);
    expect(result.tract_tempering).toBeCloseTo(0.65, 10);
  });

  it('enabled flag is true when settings.enabled=true', () => {
    const result = computeTemperature(makeSnapshot(0.5, 0), [], ENABLED);
    expect(result.enabled).toBe(true);
  });
});

// ─── resetTemperature ────────────────────────────────────────────────────────

describe('resetTemperature', () => {
  it('returns T_base with tractT=1.0 and raw=T_base', () => {
    const result = resetTemperature(ENABLED);
    expect(result.T_session).toBe(ENABLED.T_base);
    expect(result.tract_tempering).toBe(1.0);
    expect(result.raw).toBe(ENABLED.T_base);
  });

  it('uses default settings when no argument supplied', () => {
    const result = resetTemperature();
    expect(result.T_session).toBe(DEFAULT_SETTINGS.T_base);
  });

  it('enabled flag reflects settings.enabled', () => {
    const enabled = resetTemperature(ENABLED);
    const disabled = resetTemperature(DEFAULT_SETTINGS);
    expect(enabled.enabled).toBe(true);
    expect(disabled.enabled).toBe(false);
  });
});

// ─── Representative scenario outputs ─────────────────────────────────────────

describe('representative scenario outputs', () => {
  it('[tractable × high-novelty]: T_session elevated, at T_max', () => {
    // High novelty (stability=0.1) + tractable → maximum exploration
    const result = computeTemperature(makeSnapshot(0.1, 0), makeMix(10, 0), ENABLED);
    // Should be clamped at T_max since quintDrive is very large
    expect(result.T_session).toBe(ENABLED.T_max);
  });

  it('[tractable × high-fateful]: T_session reduced from high-novelty baseline', () => {
    const highFateful = computeTemperature(makeSnapshot(0.1, 20), makeMix(10, 0), ENABLED);
    const lowFateful = computeTemperature(makeSnapshot(0.1, 0), makeMix(10, 0), ENABLED);
    expect(highFateful.T_session).toBeLessThanOrEqual(lowFateful.T_session);
  });

  it('[coin-flip × high-novelty]: coin-flip suppresses even novel session', () => {
    // stability=0.2 drives quintDrive very high; both may clamp to T_max.
    // Use stability=0.6 (mid-range) so tractable result is not clamped and the
    // coin-flip suppression is observable.
    const tractable = computeTemperature(makeSnapshot(0.6, 0), makeMix(10, 0), ENABLED);
    const coinFlip = computeTemperature(makeSnapshot(0.6, 0), makeMix(0, 10), ENABLED);
    expect(coinFlip.T_session).toBeLessThan(tractable.T_session);
  });

  it('[coin-flip × high-fateful]: lowest temperature scenario, above T_min', () => {
    const result = computeTemperature(makeSnapshot(1.0, 50), makeMix(0, 10), ENABLED);
    expect(result.T_session).toBeGreaterThanOrEqual(ENABLED.T_min);
    // Should be near T_min given both stability and coin-flip suppress temperature
    expect(result.T_session).toBeLessThan(0.5);
  });
});

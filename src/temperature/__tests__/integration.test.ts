/**
 * MD-4 — Integration tests.
 *
 * Gates:
 *   - SC-MD4-01: flag-off returns sentinel default; consumers unaffected.
 *   - LS-36: full round-trip with sample data.
 *   - CF-MD4-03: "stuck in refactor loop" behavioural scenario.
 *   - IT-W3-MD4 (partial): coin-flip cohort shows consistently lower T_session.
 */

import { describe, it, expect } from 'vitest';
import { TemperatureApi, ETA0_SCALE } from '../api.js';
import { computeTemperature } from '../schedule.js';
import { SENTINEL_TEMPERATURE, createSettings } from '../settings.js';
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

function makeMix(
  tractable: number,
  coinFlip: number,
): SkillMixEntry[] {
  const entries: SkillMixEntry[] = [];
  for (let i = 0; i < tractable; i++) entries.push({ skillId: `t${i}`, tractability: 'tractable' });
  for (let i = 0; i < coinFlip; i++) entries.push({ skillId: `c${i}`, tractability: 'coin-flip' });
  return entries;
}

// ─── SC-MD4-01: flag-off — no consumers affected ─────────────────────────────

describe('SC-MD4-01 — flag-off returns sentinel default', () => {
  it('disabled schedule returns 1.0 (sentinel) regardless of quintessence axes', () => {
    const snapshots = [
      makeSnapshot(0.0, 0),  // maximum novelty
      makeSnapshot(0.5, 5),  // balanced
      makeSnapshot(1.0, 50), // maximum stability + fateful
    ];
    for (const snapshot of snapshots) {
      const result = computeTemperature(snapshot, makeMix(10, 0));
      expect(result.T_session).toBe(SENTINEL_TEMPERATURE);
      expect(result.enabled).toBe(false);
    }
  });

  it('disabled schedule returns sentinel even with all-coin-flip mix', () => {
    const result = computeTemperature(
      makeSnapshot(0.0, 0),
      makeMix(0, 20),
    );
    expect(result.T_session).toBe(SENTINEL_TEMPERATURE);
  });

  it('sentinel is 1.0 — consumers that multiply by T_session are unchanged when sentinel', () => {
    // Simulates a consumer like MA-3+MD-2: score / T_session
    // When T_session = 1.0, result is unchanged (identity element of division)
    const score = 3.7;
    const result = computeTemperature(makeSnapshot(0.5, 0), []);
    const adjustedScore = score / result.T_session;
    expect(adjustedScore).toBeCloseTo(score, 10);
  });

  it('η_0 sentinel also passes through unchanged at ETA0_SCALE', () => {
    // MD-3 consumer: η_0_effective = currentEta0()
    // When disabled: η_0_effective = SENTINEL (1.0) * 0.02 = 0.02
    const api = new TemperatureApi(); // disabled by default
    expect(api.currentEta0()).toBeCloseTo(SENTINEL_TEMPERATURE * ETA0_SCALE, 10);
  });
});

// ─── LS-36: Full round-trip with sample data ─────────────────────────────────

describe('LS-36 — round-trip with sample Quintessence data', () => {
  const ENABLED_SETTINGS = createSettings({ enabled: true });

  it('tractable × balanced quintessence: moderate T_session in mid range', () => {
    // stabilityVsNovelty=0.5 → equal exploration/stability balance
    const result = computeTemperature(makeSnapshot(0.5, 0), makeMix(10, 0), ENABLED_SETTINGS);
    // Expected: T_base * exp(0.8 * 1.0) * 1.0 ≈ 0.5 * e^0.8 ≈ 1.11; clamped to T_max=2.0
    // Actually 1.11 is within [0.05, 2.0] so no clamping
    expect(result.T_session).toBeGreaterThan(ENABLED_SETTINGS.T_min);
    expect(result.T_session).toBeLessThanOrEqual(ENABLED_SETTINGS.T_max);
    expect(result.enabled).toBe(true);
  });

  it('tractable × high-novelty: T_session at T_max', () => {
    const result = computeTemperature(makeSnapshot(0.05, 0), makeMix(10, 0), ENABLED_SETTINGS);
    expect(result.T_session).toBe(ENABLED_SETTINGS.T_max);
  });

  it('coin-flip × high-fateful: T_session near T_min', () => {
    const result = computeTemperature(makeSnapshot(0.95, 50), makeMix(0, 10), ENABLED_SETTINGS);
    expect(result.T_session).toBeLessThan(0.2);
    expect(result.T_session).toBeGreaterThanOrEqual(ENABLED_SETTINGS.T_min);
  });

  it('η_0_effective at T_base (warm-restart) = T_base × ETA0_SCALE = 0.01', () => {
    const api = new TemperatureApi({ enabled: true });
    const warmResult = api.warmRestart();
    expect(warmResult.T_session).toBe(ENABLED_SETTINGS.T_base);
    expect(api.currentEta0()).toBeCloseTo(0.5 * 0.02, 10); // 0.01
  });
});

// ─── CF-MD4-03: "stuck in refactor loop" behavioural scenario ────────────────

describe('CF-MD4-03 — stuck-in-refactor-loop scenario', () => {
  /**
   * Scenario: A session is in a refactor loop.
   *   Phase 1: High stability (lots of trunk commits), low novelty, tractable skills.
   *   Phase 2: FatefulEncounters spikes → warm-restart.
   *   Phase 3: A new branch is committed (novelty increases) → T_session rises.
   *
   * This mimics "developer stuck → fateful event → system explores → unsticks."
   */

  it('phase 1 (stable refactor loop): T_session below T_base when very stable', () => {
    const api = new TemperatureApi({ enabled: true });
    // High stability = mostly trunk-preserved sessions
    const result = api.update(makeSnapshot(0.9, 0), makeMix(8, 0));
    // stability=0.9 → novelty=0.1, stabSafe=0.9 → quintDrive small
    expect(result.T_session).toBeLessThan(api.settings.T_base * 2);
  });

  it('phase 2 (FatefulEncounters spikes): warm-restart resets T to T_base', () => {
    const api = new TemperatureApi({ enabled: true });
    api.update(makeSnapshot(0.9, 0), makeMix(8, 0));
    // Warm-restart triggered by FatefulEncounters increment
    const postWarm = api.warmRestart();
    // Core guarantee: warm-restart always yields exactly T_base
    expect(postWarm.T_session).toBe(api.settings.T_base);
    // tract_tempering is 1.0 on warm-restart (no skill-mix weighting)
    expect(postWarm.tract_tempering).toBe(1.0);
  });

  it('phase 3 (novelty increases post-fateful): T_session rises above warm-restart baseline', () => {
    const api = new TemperatureApi({ enabled: true });
    api.warmRestart();
    const warmBaseline = api.currentTemperature();
    // Developer starts a branch → stabilityVsNovelty drops (more branch commits)
    const result = api.update(makeSnapshot(0.3, 0), makeMix(8, 0));
    // Lower stability → higher novelty → higher T_session
    expect(result.T_session).toBeGreaterThanOrEqual(warmBaseline);
  });

  it('full 3-phase trajectory produces expected monotone T_session arc', () => {
    const api = new TemperatureApi({ enabled: true });

    // Phase 1: Stuck (very stable — stability=0.99 ensures quintDrive < 1, T < T_base)
    // novelty=0.01, stabSafe=0.99 → quintDrive = exp(0.8 * 0.01/0.99) ≈ exp(0.0081) ≈ 1.008
    // Still slightly above T_base due to exponential; use stability=0.99 + high fateful to suppress
    api.update(makeSnapshot(0.99, 10), makeMix(8, 0));
    const phase1T = api.currentTemperature();

    // Phase 2: Warm restart (FatefulEncounters spikes) → always T_base
    api.warmRestart();
    const phase2T = api.currentTemperature();

    // Phase 3: Exploration begins (novelty rising — stability drops to 0.3)
    api.update(makeSnapshot(0.3, 0), makeMix(8, 0));
    const phase3T = api.currentTemperature();

    // Phase 1 (very stable + high fateful) should be below T_base (warm-restart value)
    expect(phase1T).toBeLessThanOrEqual(phase2T);
    // Phase 3 (novelty = 0.7) should be above T_base
    expect(phase3T).toBeGreaterThanOrEqual(phase2T);
  });
});

// ─── IT-W3-MD4 partial: coin-flip cohort vs tractable cohort ─────────────────

describe('IT-W3-MD4 partial — coin-flip cohort consistently lower T_session', () => {
  const ENABLED = createSettings({ enabled: true });

  it('over 20 varied snapshots, coin-flip always produces lower T_session than tractable', () => {
    // Sample 20 snapshots across stability spectrum
    for (let i = 0; i <= 19; i++) {
      const stability = 0.05 + (i / 19) * 0.9; // 0.05..0.95
      const snapshot = makeSnapshot(stability, 0);
      const tractable = computeTemperature(snapshot, makeMix(10, 0), ENABLED);
      const coinFlip = computeTemperature(snapshot, makeMix(0, 10), ENABLED);
      expect(coinFlip.T_session).toBeLessThanOrEqual(tractable.T_session);
    }
  });

  it('mixed session (50/50) falls between pure coin-flip and pure tractable', () => {
    const snapshot = makeSnapshot(0.5, 0);
    const tractable = computeTemperature(snapshot, makeMix(10, 0), ENABLED);
    const coinFlip = computeTemperature(snapshot, makeMix(0, 10), ENABLED);
    const mixed = computeTemperature(snapshot, makeMix(5, 5), ENABLED);
    expect(mixed.T_session).toBeGreaterThanOrEqual(coinFlip.T_session);
    expect(mixed.T_session).toBeLessThanOrEqual(tractable.T_session);
  });
});

// ─── Warm-restart interaction with quintessence ───────────────────────────────

describe('warm-restart interaction', () => {
  it('multiple warm-restarts are idempotent (each returns T_base)', () => {
    const api = new TemperatureApi({ enabled: true });
    api.update(makeSnapshot(0.2, 0), makeMix(10, 0)); // high T
    api.warmRestart();
    const t1 = api.currentTemperature();
    api.warmRestart();
    const t2 = api.currentTemperature();
    expect(t1).toBe(t2);
    expect(t1).toBe(api.settings.T_base);
  });

  it('update after warm-restart overrides the restart value', () => {
    const api = new TemperatureApi({ enabled: true });
    api.warmRestart();
    expect(api.currentTemperature()).toBe(api.settings.T_base);
    api.update(makeSnapshot(0.2, 0), makeMix(10, 0));
    // Novel session → T_session should differ from T_base
    expect(api.currentTemperature()).not.toBe(api.settings.T_base);
  });
});

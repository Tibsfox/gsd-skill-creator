/**
 * CF3-temp — MD-4 temperature schedule drives its real MA-3 + MD-3 consumers.
 *
 * `src/temperature` (MD-4) is a dormant substrate: it has ZERO non-test importers.
 * Its unit tests prove the internal αβγ→quintessence→tractability math, but they
 * only ever read `T_session` / `η_0` as bare numbers compared against constants —
 * nothing drives the schedule's two DESIGNED consumers. The schedule's whole
 * reason-for-existence is to feed (a) the MA-3+MD-2 softmax selection temperature
 * and (b) the MD-3 Langevin noise scale `η_0 = T_session × ETA0_SCALE`.
 *
 * This is the #10438 verify-axis proof: drive the REAL `TemperatureApi` over a
 * real cooling-session trajectory and assert its boundary outputs genuinely
 * modulate the REAL `softmax` (src/stochastic) and REAL `injectLangevinNoise`
 * (src/langevin) — the v929 "composition-root N/A" pattern (the boundary value
 * composes correctly with the real consumer code, without a production rewire;
 * the consumers carry their own tractability resolvers and are not wired to MD-4).
 *
 * Coverage:
 *   1. annealing trajectory cools monotonically + clamps to T_max on real data.
 *   2. boundary T_session flattens real softmax when hot, sharpens it when cool.
 *   3. boundary η_0 = T_session × ETA0_SCALE and modulates real Langevin noise.
 *   4. warmRestart() returns to the T_base operating point.
 *   5. disabled schedule → sentinel passthrough (SC-MD4-01, no consumer impact).
 *   6. tractability tempering (coin-flip vs tractable) reaches the MD-3 boundary.
 *
 * @module tests/integration/temperature-schedule-consumer-wire
 */

import { describe, it, expect } from 'vitest';
import {
  TemperatureApi,
  ETA0_SCALE,
  SENTINEL_TEMPERATURE,
  type SkillMixEntry,
} from '../../src/temperature/index.js';
import { softmax } from '../../src/stochastic/index.js';
import { injectLangevinNoise, mulberry32 } from '../../src/langevin/index.js';
import type { QuintessenceSnapshot } from '../../src/types/symbiosis.js';

// Byte-accurate mirror of the MD-4 unit-test fixture helper (all 6 fields).
function makeSnapshot(stabilityVsNovelty: number, fatefulEncounters = 0): QuintessenceSnapshot {
  return {
    ts: 1_700_000_000_000,
    selfVsNonSelf: 0.5,
    essentialTensions: 0.2,
    growthAndEnergyFlow: 1200,
    stabilityVsNovelty,
    fatefulEncounters,
  };
}

function makeMix(tractable: number, coinFlip: number): SkillMixEntry[] {
  const entries: SkillMixEntry[] = [];
  for (let i = 0; i < tractable; i++) entries.push({ skillId: `t${i}`, tractability: 'tractable' });
  for (let i = 0; i < coinFlip; i++) entries.push({ skillId: `c${i}`, tractability: 'coin-flip' });
  return entries;
}

/** Shannon entropy (nats) of a probability vector — higher ⇒ flatter. */
function shannonEntropy(p: readonly number[]): number {
  return -p.reduce((h, x) => h + (x > 0 ? x * Math.log(x) : 0), 0);
}

/** L2 norm — the perturbation magnitude when the param vector is zero. */
function l2(v: readonly number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

// Well-separated scores so the softmax distribution has a clear argmax.
const SCORES = [1.0, 2.0, 3.0] as const;
const ARGMAX = 2;

describe('CF3-temp — MD-4 schedule drives real MA-3 softmax + MD-3 langevin consumers', () => {
  it('cools monotonically and clamps to T_max on a real cooling-session trajectory', () => {
    const api = new TemperatureApi({ enabled: true });
    const stabilities = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
    const traj = stabilities.map((s) => api.update(makeSnapshot(s, 0), makeMix(10, 0)).T_session);

    // Non-increasing (<= because the hot end plateaus at the T_max clamp).
    for (let i = 1; i < traj.length; i++) {
      expect(traj[i]).toBeLessThanOrEqual(traj[i - 1]);
    }
    // The hottest (most-novel) tick saturates the [T_min, T_max] clamp on real data.
    expect(traj[0]).toBe(api.settings.T_max);
    // The trajectory genuinely moves — not a flat line.
    expect(traj[traj.length - 1]).toBeLessThan(traj[0]);
    expect(api.settings.T_min).toBeLessThanOrEqual(traj[traj.length - 1]);
  });

  it('boundary T_session modulates real MA-3 softmax sharpness (hot flatter, cool sharper)', () => {
    const api = new TemperatureApi({ enabled: true });
    const hotT = api.update(makeSnapshot(0.05, 0), makeMix(10, 0)).T_session;
    const coolT = api.update(makeSnapshot(0.95, 0), makeMix(10, 0)).T_session;
    expect(hotT).toBeGreaterThan(coolT);

    const pHot = softmax(SCORES, hotT);
    const pCool = softmax(SCORES, coolT);
    // Hot temperature flattens the distribution: higher entropy, lower argmax mass.
    expect(shannonEntropy(pHot)).toBeGreaterThan(shannonEntropy(pCool));
    expect(pHot[ARGMAX]).toBeLessThan(pCool[ARGMAX]);
  });

  it('boundary η_0 = T_session × ETA0_SCALE and modulates real MD-3 Langevin noise magnitude', () => {
    const api = new TemperatureApi({ enabled: true });

    api.update(makeSnapshot(0.05, 0), makeMix(10, 0));
    const hotEta = api.currentEta0();
    expect(hotEta).toBe(api.currentTemperature() * ETA0_SCALE);

    api.update(makeSnapshot(0.95, 0), makeMix(10, 0));
    const coolEta = api.currentEta0();
    expect(coolEta).toBe(api.currentTemperature() * ETA0_SCALE);

    expect(hotEta).toBeGreaterThan(coolEta);

    // Feed each η_0 into the REAL Langevin primitive with a fixed seed + zero
    // params, so `scale` is the only varying input → L2 is the pure noise scale.
    const params = new Array(10).fill(0);
    const noiseHot = injectLangevinNoise(params, hotEta, mulberry32(42));
    const noiseCool = injectLangevinNoise(params, coolEta, mulberry32(42));
    expect(l2(noiseHot)).toBeGreaterThan(l2(noiseCool));
  });

  it('warmRestart() returns to the T_base operating point (T_base, η_0 = T_base × ETA0_SCALE)', () => {
    const api = new TemperatureApi({ enabled: true });
    api.update(makeSnapshot(0.05, 0), makeMix(10, 0)); // heat it up
    const r = api.warmRestart();
    expect(r.T_session).toBe(api.settings.T_base);
    expect(api.currentTemperature()).toBe(api.settings.T_base);
    expect(api.currentEta0()).toBe(api.settings.T_base * ETA0_SCALE);
  });

  it('disabled schedule → sentinel passthrough, no consumer impact (SC-MD4-01)', () => {
    const api = new TemperatureApi(); // default constructor = disabled
    api.update(makeSnapshot(0.05, 0), makeMix(10, 0)); // even a maximally-hot snapshot
    expect(api.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
    expect(api.currentEta0()).toBe(SENTINEL_TEMPERATURE * ETA0_SCALE);
    // The sentinel feeds consumers as the identity operating point: a real softmax
    // over it is well-formed (sums to 1, finite), so a flag-off MD-4 is inert.
    const p = softmax(SCORES, api.currentTemperature());
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('tractability tempering reaches the MD-3 boundary (coin-flip noise < tractable noise)', () => {
    const snap = makeSnapshot(0.3, 0);
    const tractApi = new TemperatureApi({ enabled: true });
    tractApi.update(snap, makeMix(10, 0)); // all tractable
    const coinApi = new TemperatureApi({ enabled: true });
    coinApi.update(snap, makeMix(0, 10)); // all coin-flip

    const tractEta = tractApi.currentEta0();
    const coinEta = coinApi.currentEta0();
    expect(coinEta).toBeLessThan(tractEta);

    const params = new Array(10).fill(0);
    const tractNoise = l2(injectLangevinNoise(params, tractEta, mulberry32(7)));
    const coinNoise = l2(injectLangevinNoise(params, coinEta, mulberry32(7)));
    expect(coinNoise).toBeLessThan(tractNoise);
  });
});

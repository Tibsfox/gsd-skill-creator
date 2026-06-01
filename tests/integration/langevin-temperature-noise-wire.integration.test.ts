/**
 * CF3-langevin — MD-3 Langevin bridge driven by the real MD-4 temperature η_0.
 *
 * `src/langevin` (MD-3) is a dormant substrate: ZERO non-test importers. Its unit
 * tests prove each primitive in isolation (Gaussian draws, the dark-room floor,
 * scale resolution, the bridge flag-gate). What is unproven anywhere is the
 * DESIGNED cross-substrate spine: a real MD-4 `TemperatureApi` exposing
 * `currentEta0() = T_session × ETA0_SCALE` as the Langevin noise scale fed to
 * `applyLangevinUpdate` (resolve scale → inject seeded noise → SC-DARK floor guard
 * → MB-2 simplex projection).
 *
 * This is the #10438 verify-axis proof (v929 "composition-root N/A" pattern): a
 * REAL (non-mock) TemperatureApi modulates the REAL langevin bridge, without a
 * production rewire (the bridge carries its own scale-resolver and is not wired to
 * MD-4 today).
 *
 * Coverage:
 *   1. temperature schedule modulates the bridge's effective noise scale.
 *   2. reproducibility under a shared seed; divergence under a different seed.
 *   3. SC-DARK floor reverts to the pre-noise vector when noise collapses activity.
 *   4. every projection-enabled output is a valid simplex (sum 1, all ≥ 0).
 *   5. SC-MD3-01 flag-off → byte-identical to pure MB-2 projection, effectiveScale 0.
 *   6. tractability gain attenuates the noise scale (coin-flip < tractable).
 *
 * @module tests/integration/langevin-temperature-noise-wire
 */

import { describe, it, expect } from 'vitest';
import { TemperatureApi } from '../../src/temperature/index.js';
import { applyLangevinUpdate, mulberry32 } from '../../src/langevin/index.js';
import { projectToSimplex } from '../../src/projection/index.js';
import type { QuintessenceSnapshot } from '../../src/types/symbiosis.js';

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

/** A real enabled MD-4 schedule updated to a snapshot, exposing its η_0. */
function eta0For(stabilityVsNovelty: number): number {
  const api = new TemperatureApi({ enabled: true });
  api.update(makeSnapshot(stabilityVsNovelty, 0), []);
  return api.currentEta0();
}

const ROW = [0.2, 0.2, 0.2, 0.2, 0.2]; // uniform 5-simplex, activity 1.0

describe('CF3-langevin — MD-4 temperature η_0 drives the real MD-3 Langevin bridge', () => {
  it('temperature schedule modulates the bridge effective noise scale (novel > stable > 0)', () => {
    const novEta = eta0For(0.1); // hot/novel → η_0 ≈ 0.04
    const stabEta = eta0For(0.9); // cool/stable → η_0 ≈ 0.0077
    expect(novEta).toBeGreaterThan(stabEta);

    const nov = applyLangevinUpdate(ROW, {
      langevinEnabled: true, baseScale: novEta, tractability: 'tractable', rng: mulberry32(1),
    });
    const stab = applyLangevinUpdate(ROW, {
      langevinEnabled: true, baseScale: stabEta, tractability: 'tractable', rng: mulberry32(1),
    });
    // tractable gain is 1.0 → effectiveScale tracks η_0 exactly.
    expect(nov.effectiveScale).toBeCloseTo(novEta, 12);
    expect(stab.effectiveScale).toBeCloseTo(stabEta, 12);
    expect(nov.effectiveScale).toBeGreaterThan(stab.effectiveScale);
    expect(stab.effectiveScale).toBeGreaterThan(0);
  });

  it('is reproducible under a shared seed and diverges under a different seed', () => {
    const eta = eta0For(0.1);
    const opts = { langevinEnabled: true, baseScale: eta, tractability: 'tractable' as const };
    const a = applyLangevinUpdate(ROW, { ...opts, rng: mulberry32(42) });
    const b = applyLangevinUpdate(ROW, { ...opts, rng: mulberry32(42) });
    const c = applyLangevinUpdate(ROW, { ...opts, rng: mulberry32(43) });
    expect(a.params).toEqual(b.params);
    expect(a.params).not.toEqual(c.params);
  });

  it('SC-DARK floor reverts to the pre-noise vector when noise collapses activity', () => {
    const original = [0.5, 0.5];
    const rng = mulberry32(123); // one shared stream → varied draws across iterations
    let rejections = 0;
    let revertChecked = false;
    for (let i = 0; i < 500; i++) {
      const r = applyLangevinUpdate(original, {
        langevinEnabled: true, baseScale: 0.5, projectionEnabled: false, minActivity: 0.1, rng,
      });
      if (r.darkRoomRejected) {
        rejections++;
        expect(r.params).toEqual(original); // guard reverted to the original copy
        expect(r.noisyActivity).toBeLessThan(0.1);
        expect(r.originalActivity).toBeGreaterThanOrEqual(0.1);
        revertChecked = true;
      }
    }
    expect(rejections).toBeGreaterThan(0);
    expect(revertChecked).toBe(true);
  });

  it('every projection-enabled output is a valid simplex (sum 1, all ≥ 0)', () => {
    const r = applyLangevinUpdate(ROW, {
      langevinEnabled: true, baseScale: eta0For(0.1), tractability: 'tractable',
      projectionEnabled: true, rng: mulberry32(9),
    });
    expect(r.params.length).toBe(5);
    for (const x of r.params) expect(x).toBeGreaterThanOrEqual(0);
    expect(r.params.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it('SC-MD3-01 flag-off → byte-identical to pure MB-2 projection, effectiveScale 0', () => {
    const planted = [0.5, 0.3, 0.4, 0.2, 0.1]; // sum 1.5 → projection does real work
    const off = applyLangevinUpdate(planted, {
      langevinEnabled: false, projectionEnabled: true, baseScale: 0.04, rng: mulberry32(42),
    });
    expect(off.effectiveScale).toBe(0);
    expect(off.params).toEqual(projectToSimplex([...planted]).projected);
  });

  it('tractability gain attenuates the noise scale (coin-flip < tractable)', () => {
    const eta = eta0For(0.1);
    const tract = applyLangevinUpdate(ROW, {
      langevinEnabled: true, baseScale: eta, tractability: 'tractable', rng: mulberry32(5),
    });
    const coin = applyLangevinUpdate(ROW, {
      langevinEnabled: true, baseScale: eta, tractability: 'coin-flip', rng: mulberry32(5),
    });
    expect(tract.effectiveScale).toBeCloseTo(eta, 12); // gain 1.0
    expect(coin.effectiveScale).toBeCloseTo(eta * 0.2, 12); // coin-flip gain 0.2
    expect(coin.effectiveScale).toBeLessThan(tract.effectiveScale);
  });
});

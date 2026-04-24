import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// forest-sim sources live under www/tibsfox/com/Research/, which is gitignored
// (regenerable artifacts synced to tibsfox.com via sync-research-to-live.sh).
// On CI / fresh checkouts the files are absent, so skip instead of failing.
const here = dirname(fileURLToPath(import.meta.url));
const k41Path = join(here, '../../www/tibsfox/com/Research/forest/k41.js');
const microPath = join(here, '../../www/tibsfox/com/Research/forest/microphysics.js');
const ASSETS_PRESENT = existsSync(k41Path) && existsSync(microPath);

const K41: {
  k41TkeDissipation: (U: number, L: number) => number;
  k41KolmogorovScale: (eps: number, nu?: number) => number;
  k41SubgridViscosity: (eps: number, delta: number) => number;
  k41StructureFunctionScaling: (eps: number, r: number) => number;
  NU_AIR: number;
  C_S: number;
} = ASSETS_PRESENT ? require(k41Path) : ({} as never);
const Micro: {
  kohlerActivationFraction: (
    sEnv: number,
    aero: { N_total: number; r_mode: number; sigma_geo: number },
    T: number,
    kappa: number,
  ) => number;
} = ASSETS_PRESENT ? require(microPath) : ({} as never);

describe.runIf(ASSETS_PRESENT)('forest-sim K41 turbulence closure (Phase 681)', () => {
  it.each([
    // [U (m/s), L (m), eps_min, eps_max, label]
    [0.5, 30, 1e-4, 1e-2, 'low-Re canopy breeze'],
    [5.0, 30, 1, 20, 'high-Re storm winds'],
    [1.0, 10, 0.05, 0.2, 'mid-Re sample — ε ≈ 0.1'],
  ])('k41TkeDissipation(U=%s, L=%s) ∈ (%s, %s) [%s]', (U, L, epsMin, epsMax) => {
    const eps = K41.k41TkeDissipation(U, L);
    expect(eps).toBeGreaterThan(epsMin);
    expect(eps).toBeLessThan(epsMax);
  });

  it('Kolmogorov η monotonically decreases with ε', () => {
    const epsArr = [1e-4, 1e-3, 1e-2, 1e-1, 1];
    const etaArr = epsArr.map((e) => K41.k41KolmogorovScale(e));
    for (let i = 1; i < etaArr.length; i++) {
      expect(etaArr[i]).toBeLessThan(etaArr[i - 1]);
    }
  });

  it('ε^(2/3) scaling holds over 2 decades of ε (structure-function check)', () => {
    const r = 0.1;
    const sfLo = K41.k41StructureFunctionScaling(1e-3, r);
    const sfHi = K41.k41StructureFunctionScaling(1e-1, r);
    // Ratio should be (100)^(2/3) ≈ 21.5
    const ratio = sfHi / sfLo;
    expect(ratio).toBeGreaterThan(20);
    expect(ratio).toBeLessThan(23);
  });

  it('ν_sgs ∝ ε^(1/3) — 2-decade ε sweep scales as cube-root', () => {
    const delta = 1.0;
    const nuLo = K41.k41SubgridViscosity(1e-3, delta);
    const nuHi = K41.k41SubgridViscosity(1e-1, delta);
    // Ratio should be (100)^(1/3) ≈ 4.64
    const ratio = nuHi / nuLo;
    expect(ratio).toBeGreaterThan(4.3);
    expect(ratio).toBeLessThan(5.0);
  });

  it('100-step integration with BOTH flags on produces no NaN (Phase 681 success criterion 4)', () => {
    // Simulate the guarded compute paths for 100 frames.
    const wxSeries: Array<{ humidity: number; temp: number; windSpeed: number }> = [];
    for (let i = 0; i < 100; i++) {
      wxSeries.push({
        humidity: 95 + 10 * Math.sin(i / 7), // oscillates 85-105
        temp: 8 + 4 * Math.sin(i / 11), // oscillates 4-12 °C
        windSpeed: 2 + 8 * Math.abs(Math.sin(i / 5)), // oscillates 2-10 km/h
      });
    }
    const aero = { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 };
    for (const wx of wxSeries) {
      const rhFrac = Math.max(0, (wx.humidity - 95) / 10);
      const sEnv = 0.01 * rhFrac;
      const Tk = wx.temp + 273.15;
      const activated = Micro.kohlerActivationFraction(sEnv, aero, Tk, 0.3);
      const U = Math.max(0.1, wx.windSpeed / 3.6);
      const eps = K41.k41TkeDissipation(U, 30);
      const eta = K41.k41KolmogorovScale(eps);
      const nuS = K41.k41SubgridViscosity(eps, 1.0);
      expect(Number.isFinite(activated)).toBe(true);
      expect(Number.isFinite(eps)).toBe(true);
      expect(Number.isFinite(eta)).toBe(true);
      expect(Number.isFinite(nuS)).toBe(true);
      expect(Number.isNaN(activated + eps + eta + nuS)).toBe(false);
    }
  });
});

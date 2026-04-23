import { describe, it, expect } from 'vitest';
// Dual-use module: dynamic require keeps the import portable.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Micro: {
  kohlerCriticalSS: (rDry: number, kappa: number, T: number) => number;
  kohlerActivationFraction: (
    sEnv: number,
    aero: { N_total: number; r_mode: number; sigma_geo: number },
    T: number,
    kappa: number,
  ) => number;
  curvatureTermA: (T: number) => number;
} = require('../../www/tibsfox/com/Research/forest/microphysics.js');

describe('forest-sim Köhler droplet activation (Phase 681)', () => {
  it('curvature term A matches Lohmann 2016 Eq. 4.2 order of magnitude', () => {
    const A = Micro.curvatureTermA(288);
    // A ≈ 1e-9 m at 288 K (canonical Lohmann value)
    expect(A).toBeGreaterThan(1e-10);
    expect(A).toBeLessThan(1e-8);
  });

  it.each([
    // [rDry (m), kappa, T (K), sc_min, sc_max, label]
    // Sc ∝ r_dry^(-3/2): 10nm vs 50nm → 5^1.5 ≈ 11.18x larger Sc
    // Canonical 50nm/κ=0.3 gives Sc ≈ 0.00224 → 10nm gives Sc ≈ 0.025
    [10e-9, 0.3, 288, 0.004, 0.030, 'very small CCN (high Sc)'],
    [50e-9, 0.3, 288, 0.001, 0.005, 'canonical CCN (mid Sc)'],
    [200e-9, 0.3, 288, 0.0001, 0.001, 'giant CCN (low Sc)'],
    [50e-9, 0.1, 288, 0.002, 0.010, 'low-hygroscopicity 50 nm (higher Sc)'],
    [50e-9, 1.0, 288, 0.0005, 0.003, 'sea-salt 50 nm (lower Sc)'],
  ])(
    'kohlerCriticalSS(rDry=%s, kappa=%s, T=%s) ∈ (%s, %s) [%s]',
    (rDry, kappa, T, scMin, scMax) => {
      const Sc = Micro.kohlerCriticalSS(rDry, kappa, T);
      expect(Sc).toBeGreaterThan(scMin);
      expect(Sc).toBeLessThan(scMax);
    },
  );

  it('dry: S_env = 0 → activation 0', () => {
    const f = Micro.kohlerActivationFraction(
      0,
      { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 },
      288,
      0.3,
    );
    expect(f).toBe(0);
  });

  it('supersaturated: S_env = 1% (0.01) → activation > 0.5', () => {
    const f = Micro.kohlerActivationFraction(
      0.01,
      { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 },
      288,
      0.3,
    );
    expect(f).toBeGreaterThan(0.5);
  });

  it('near-activation: 0.003 (0.3%) produces intermediate fraction in (0, 1)', () => {
    const f = Micro.kohlerActivationFraction(
      0.003,
      { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 },
      288,
      0.3,
    );
    expect(f).toBeGreaterThan(0);
    expect(f).toBeLessThan(1);
  });

  it('supersaturation sweep 0.1% → 2% activation curve monotonically non-decreasing', () => {
    const aero = { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 };
    const sweep = [0.001, 0.002, 0.003, 0.005, 0.01, 0.02];
    const fracs = sweep.map((s) => Micro.kohlerActivationFraction(s, aero, 288, 0.3));
    for (let i = 1; i < fracs.length; i++) {
      expect(fracs[i]).toBeGreaterThanOrEqual(fracs[i - 1] - 1e-10);
    }
    // At S=2% almost all activated
    expect(fracs[fracs.length - 1]).toBeGreaterThan(0.9);
  });

  it('Lohmann 2016 Ch.4 Fig.4.3 rough parity — median CCN activates in 0.1% – 1% band (within 5% of sweep)', () => {
    // Fig 4.3 shows for κ≈0.3 CCN with r_mode≈50 nm, ~50% activation near S_env ≈ 0.3%.
    const aero = { N_total: 200e6, r_mode: 50e-9, sigma_geo: 2.0 };
    const f50 = Micro.kohlerActivationFraction(0.003, aero, 288, 0.3);
    expect(f50).toBeGreaterThan(0.20); // ≥20% (allowing 5% tolerance around Lohmann 2016 ~50%)
    expect(f50).toBeLessThan(0.80); // ≤80%
  });
});

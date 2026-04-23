// k41.js — Kolmogorov 1941 sub-grid turbulence closure for the PNW forest-sim.
// Dual-use: browser window.K41 + Node module.exports.
// Ships behind featureFlags.k41Turbulence (default false).
//
// Reference: Kolmogorov 1941; Frisch 1995 Ch. 6; Smagorinsky 1963.
//
// Theory (three canonical relations):
//
// 1. Integral-scale TKE dissipation:
//      ε ~ U³ / L
//    where U is the characteristic velocity and L the integral length scale.
//    For canopy flow: U ≈ 0.5 – 5 m/s, L ≈ 1 – 30 m.
//
// 2. Kolmogorov microscale (viscous cutoff):
//      η = (ν³ / ε)^(1/4)
//    For ε = 1e-3 m²/s³, ν = 1.5e-5 m²/s: η ≈ 5e-4 m.
//
// 3. Sub-grid closure (Smagorinsky-derived K41 inertial-range estimate):
//      ν_sgs ≈ ε^(1/3) · Δ^(4/3)   (with C_s² ≈ 0.029, C_s ≈ 0.17)
//
// Structure-function check: 〈(δu)²〉 ∝ (ε r)^(2/3) — the canonical
// 2/3-power law that this module's tests sweep over 2 decades of ε.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.K41 = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  var NU_AIR = 1.5e-5;       // kinematic viscosity of air at 288 K, m²/s
  var C_S    = 0.17;         // Smagorinsky constant (canonical)

  // ε ~ U³ / L — K41 integral-scale TKE dissipation rate.
  // Returns ε in m²/s³.
  function k41TkeDissipation(U, L) {
    if (!(U > 0) || !(L > 0)) return 0;
    return (U * U * U) / L;
  }

  // η = (ν³/ε)^(1/4) — Kolmogorov microscale (viscous cutoff).
  // Returns η in m.
  function k41KolmogorovScale(eps, nu) {
    if (nu === undefined) nu = NU_AIR;
    if (!(eps > 0) || !(nu > 0)) return Infinity;
    return Math.pow((nu * nu * nu) / eps, 0.25);
  }

  // ν_sgs = C_s^(4/3) · ε^(1/3) · Δ^(4/3) — K41-derived sub-grid viscosity.
  // Returns ν_sgs in m²/s.
  function k41SubgridViscosity(eps, delta) {
    if (!(eps >= 0) || !(delta > 0)) return 0;
    return Math.pow(C_S, 4 / 3) * Math.pow(eps, 1 / 3) * Math.pow(delta, 4 / 3);
  }

  // Structure function scaling check: 〈(δu)²〉 ∝ (ε r)^(2/3).
  // Returns a dimensionless scaling constant (2.0 canonical).
  function k41StructureFunctionScaling(eps, r) {
    if (!(eps > 0) || !(r > 0)) return 0;
    return 2.0 * Math.pow(eps * r, 2 / 3);
  }

  return {
    k41TkeDissipation: k41TkeDissipation,
    k41KolmogorovScale: k41KolmogorovScale,
    k41SubgridViscosity: k41SubgridViscosity,
    k41StructureFunctionScaling: k41StructureFunctionScaling,
    NU_AIR: NU_AIR, C_S: C_S
  };
}));

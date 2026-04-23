// microphysics.js — Köhler droplet-activation for the PNW forest-sim.
// Dual-use: exports to window.MicroPhysics (browser) and module.exports (Node).
// Ships behind featureFlags.microphysics (default false).
//
// Reference: Petters & Kreidenweis 2007 (ACP); Lohmann 2016 Ch. 4.
//
// Theory (κ-Köhler form):
//   The critical supersaturation Sc for activation of a dry aerosol of radius
//   r_dry with hygroscopicity κ at temperature T is
//
//       Sc = sqrt( 4 A^3 / (27 κ r_dry^3) )
//
//   where A = 2 σ M_w / (ρ_w R T) is the Kelvin (curvature) term:
//       σ   = water surface tension ≈ 0.072 J/m²
//       M_w = molar mass of water = 0.018 kg/mol
//       ρ_w = density of liquid water = 1000 kg/m³
//       R   = universal gas constant = 8.314 J/(mol·K)
//
//   Sc is returned as a FRACTION (not %). A typical CCN with r_dry = 50 nm,
//   κ = 0.3 at T = 288 K gives Sc ≈ 0.002 – 0.003 (i.e. 0.2 – 0.3%).
//
// Activation: aerosol activates when the environmental supersaturation
// S_env > Sc. Given a lognormal size distribution (N_total, r_mode, σ_geo)
// the activated fraction is the integral of aerosol with Sc < S_env.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MicroPhysics = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  // Physical constants
  var SIGMA_W = 0.072;         // surface tension of water, J/m²
  var M_W     = 0.018;         // molar mass of water, kg/mol
  var RHO_W   = 1000;          // density of water, kg/m³
  var R_GAS   = 8.314;         // universal gas constant, J/(mol·K)

  // Surface-tension / curvature term A (Eq. 4.2 Lohmann 2016)
  function curvatureTermA(T) {
    return (2 * SIGMA_W * M_W) / (RHO_W * R_GAS * T);
  }

  // Critical supersaturation Sc for a dry aerosol of radius r_dry, hygroscopicity κ, temperature T.
  // Returns Sc as a FRACTION (not %). Typical CCN: 0.002 – 0.01.
  function kohlerCriticalSS(rDry, kappa, T) {
    if (!(rDry > 0) || !(kappa > 0) || !(T > 0)) return NaN;
    var A = curvatureTermA(T);
    return Math.sqrt((4 * A * A * A) / (27 * kappa * rDry * rDry * rDry));
  }

  // Activated fraction given environmental supersaturation S_env and a lognormal aerosol dist.
  // aerosolDist: { N_total, r_mode (m), sigma_geo } — standard lognormal parameters.
  // Integrates numerically (trapezoidal over ~30 bins spanning ±3σ_geo of the mode in log-space).
  function kohlerActivationFraction(sEnv, aerosolDist, T, kappa) {
    if (!(sEnv > 0)) return 0;
    if (!aerosolDist || !(aerosolDist.N_total > 0)) return 0;
    var rMode = aerosolDist.r_mode;
    var sigG  = aerosolDist.sigma_geo;
    var lnSig = Math.log(sigG);
    var nBins = 30;
    var logR0 = Math.log(rMode) - 3 * lnSig;
    var logR1 = Math.log(rMode) + 3 * lnSig;
    var dLog  = (logR1 - logR0) / nBins;
    var total = 0, active = 0;
    for (var i = 0; i < nBins; i++) {
      var lr = logR0 + (i + 0.5) * dLog;
      var r  = Math.exp(lr);
      // Lognormal PDF in ln(r):
      var pdf = (1 / (Math.sqrt(2 * Math.PI) * lnSig)) *
                Math.exp(-0.5 * Math.pow((lr - Math.log(rMode)) / lnSig, 2));
      var weight = pdf * dLog;
      total += weight;
      var Sc = kohlerCriticalSS(r, kappa, T);
      if (sEnv > Sc) active += weight;
    }
    return total > 0 ? active / total : 0;
  }

  return {
    curvatureTermA: curvatureTermA,
    kohlerCriticalSS: kohlerCriticalSS,
    kohlerActivationFraction: kohlerActivationFraction,
    // Exposed constants for tests / debugging:
    SIGMA_W: SIGMA_W, M_W: M_W, RHO_W: RHO_W, R_GAS: R_GAS
  };
}));

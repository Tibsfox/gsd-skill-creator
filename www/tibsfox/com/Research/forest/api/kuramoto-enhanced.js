// kuramoto-enhanced.js — Enhanced Kuramoto Synchronization with Adaptive Coupling
// Session 7 research: Self-Organizing Intelligence (p3nGu1nZz) + LED Evolution
//
// Upgrades the basic Kuramoto firefly model with:
// 1. Adaptive coupling strength based on proximity and flash brightness
// 2. Temperature-dependent flash rate (real KPAE data)
// 3. Frequency clustering — fireflies naturally form sync groups
// 4. Order parameter (r) measurement — quantifies collective synchronization
// 5. LED-inspired spectral variation — warmer/cooler bioluminescence
//
// Research sources:
// - Self-Organizing Intelligence: vibrational phase + Lennard-Jones coupling
// - LED Evolution: electroluminescence spectrum, color temperature variation
// - Strogatz 2003: original Kuramoto model
// - OPEN Problem #12: Kuramoto coupling threshold (Kc = 2/(π·g(0)))
//
// College: Mathematics (dynamical systems), Physics (coupled oscillators),
//          Electronics (LED spectral emission), Ecology (collective behavior)

/**
 * Enhanced Kuramoto state for a single oscillator (firefly).
 * Extends the basic {phase, rate} with adaptive properties.
 */
function createEnhancedFirefly(x, y, temperature) {
  // Temperature-dependent base frequency (warmer = faster flash)
  // Real Photinus pyralis data: 2-4s period at 20°C, faster when warmer
  var baseRate = map(constrain(temperature, 5, 30), 5, 30, 0.025, 0.09);
  // Natural frequency with individual variation (±20%)
  var omega = baseRate * random(0.8, 1.2);

  return {
    x: x, y: y,
    vx: random(-0.3, 0.3), vy: random(-0.2, 0.1),
    phase: random(TWO_PI),
    omega: omega,                    // natural frequency (intrinsic)
    rate: omega,                     // current frequency (affected by coupling)
    life: floor(random(300, 800)),
    sz: random(1.5, 3.0),
    energy: 1.0,                     // bioluminescence energy (0-1)
    spectralShift: random(-0.15, 0.15), // color temperature variation
    clusterLabel: -1,                // which sync group (-1 = none)
    couplingHistory: 0,              // accumulated coupling strength
  };
}

/**
 * Adaptive coupling strength based on:
 * - Distance (inverse square, not linear)
 * - Brightness match (similar energy → stronger coupling)
 * - Phase proximity (already near-sync → stronger pull — positive feedback)
 *
 * This produces the self-organizing behavior from the particle physics paper:
 * particles that oscillate in sync form stronger bonds.
 */
function adaptiveCoupling(fi, fj, baseCoupling) {
  var dx = fi.x - fj.x, dy = fi.y - fj.y;
  var distSq = dx * dx + dy * dy;
  if (distSq > 4900) return 0; // beyond 70px visual range

  // Distance factor: inverse square with soft floor
  var distFactor = 1.0 / (1.0 + distSq / 900);

  // Brightness match: similar energy = stronger coupling
  var energyMatch = 1.0 - abs(fi.energy - fj.energy);

  // Phase proximity: positive feedback — near-sync strengthens bond
  var phaseDiff = abs(sin(fj.phase - fi.phase));
  var phaseBonus = 1.0 + (1.0 - phaseDiff) * 0.5;

  return baseCoupling * distFactor * energyMatch * phaseBonus;
}

/**
 * Compute the Kuramoto order parameter (r, psi).
 * r ∈ [0, 1]: 0 = completely desynchronized, 1 = perfect sync.
 * psi = mean phase angle.
 *
 * This is THE metric for measuring collective synchronization.
 * Maps to OPEN Problem #12: critical coupling threshold.
 */
function computeOrderParameter(fireflies) {
  if (fireflies.length === 0) return { r: 0, psi: 0 };

  var sumCos = 0, sumSin = 0;
  for (var i = 0; i < fireflies.length; i++) {
    sumCos += cos(fireflies[i].phase);
    sumSin += sin(fireflies[i].phase);
  }
  var n = fireflies.length;
  var re = sumCos / n;
  var im = sumSin / n;
  var r = sqrt(re * re + im * im);
  var psi = atan2(im, re);
  return { r: r, psi: psi };
}

/**
 * Detect synchronization clusters — groups of fireflies in near-phase.
 * Uses a simple union-find on phase proximity.
 * Returns cluster count and labels each firefly.
 */
function detectClusters(fireflies, phaseThreshold) {
  phaseThreshold = phaseThreshold || 0.4; // radians
  var n = fireflies.length;
  var parent = [];
  for (var i = 0; i < n; i++) parent[i] = i;

  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function union(a, b) { parent[find(a)] = find(b); }

  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n; j++) {
      var dx = fireflies[i].x - fireflies[j].x;
      var dy = fireflies[i].y - fireflies[j].y;
      if (dx * dx + dy * dy < 4900) { // within visual range
        var pd = abs(sin(fireflies[j].phase - fireflies[i].phase));
        if (pd < phaseThreshold) {
          union(i, j);
        }
      }
    }
  }

  // Label clusters
  var clusterMap = {};
  var clusterCount = 0;
  for (var i = 0; i < n; i++) {
    var root = find(i);
    if (clusterMap[root] === undefined) {
      clusterMap[root] = clusterCount++;
    }
    fireflies[i].clusterLabel = clusterMap[root];
  }

  return clusterCount;
}

/**
 * LED-inspired spectral rendering — bioluminescence with temperature variation.
 * Research: LED spectral emission varies with junction temperature.
 * Fireflies: Photinus pyralis emits 552-582nm (yellow-green).
 * Spectral shift simulates individual variation in luciferin chemistry.
 */
function fireflyColor(ff, pulse) {
  // Base: warm yellow-green (h=80, s=220, b=100)
  // Spectral shift: ±15% toward amber (warmer) or green (cooler)
  var hue = 80 + ff.spectralShift * 40; // 74-86 range
  var sat = 220 + ff.spectralShift * 30;

  // Energy affects brightness peak
  var bright = pulse * ff.energy;

  return {
    glow:  { r: 180 + hue * 0.2, g: 220 + ff.spectralShift * 20, b: 80 - ff.spectralShift * 40, a: bright * 30 },
    core:  { r: 200 + hue * 0.15, g: 240 + ff.spectralShift * 10, b: 100 - ff.spectralShift * 30, a: bright * 80 },
    peak:  { r: 230, g: 255, b: 140 + ff.spectralShift * 60, a: bright * 200 },
  };
}

/**
 * Full enhanced Kuramoto update step.
 * Call this once per frame, passing the firefly array and weather state.
 *
 * Returns: { orderParam: {r, psi}, clusterCount: number }
 */
function updateKuramotoEnhanced(fireflies, temperature, baseCoupling) {
  baseCoupling = baseCoupling || 0.02;
  var n = fireflies.length;

  // Phase 1: Adaptive coupling (O(n²) but n < 50)
  for (var i = 0; i < n; i++) {
    var fi = fireflies[i];
    var totalCoupling = 0;
    for (var j = 0; j < n; j++) {
      if (i === j) continue;
      var fj = fireflies[j];
      var K = adaptiveCoupling(fi, fj, baseCoupling);
      if (K > 0.001) {
        var phaseDiff = sin(fj.phase - fi.phase);
        fi.phase += K * phaseDiff;
        totalCoupling += K;
      }
    }
    fi.couplingHistory = fi.couplingHistory * 0.95 + totalCoupling * 0.05;
  }

  // Phase 2: Temperature-dependent frequency update
  for (var i = 0; i < n; i++) {
    var ff = fireflies[i];
    // Natural frequency adjusts with temperature
    ff.omega = map(constrain(temperature, 5, 30), 5, 30, 0.025, 0.09) * (ff.rate / 0.05);
    ff.phase += ff.omega;
    if (ff.phase > TWO_PI) ff.phase -= TWO_PI;
    if (ff.phase < 0) ff.phase += TWO_PI;

    // Energy decay and renewal (bioluminescence ATP cost)
    ff.energy -= 0.001;
    ff.energy += 0.0005 * (1.0 + sin(ff.phase)); // energy recovery near flash peak
    ff.energy = constrain(ff.energy, 0.1, 1.0);
  }

  // Phase 3: Measure collective state
  var order = computeOrderParameter(fireflies);
  var clusters = detectClusters(fireflies);

  return { orderParam: order, clusterCount: clusters };
}

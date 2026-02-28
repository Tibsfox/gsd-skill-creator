/**
 * Skill Dynamics Model
 *
 * Maps the skill-creator's observation-classify-score-position pipeline
 * to a discrete dynamical system on the complex plane. Skills evolve via
 * iteration z_{n+1} = f(z_n), and their convergence properties determine
 * stability, activation reliability, and promotion readiness.
 *
 * The model uses a contractive affine map: f(z) = alpha * z + beta, where
 * alpha controls the contraction rate and beta is derived from the skill's
 * angular position (observation correction).
 */

import type {
  ComplexNumber,
  SkillPosition,
  SkillDynamics,
  FixedPointClassification,
} from '../types.js';
import type { IterationFn } from '../complex/iterate.js';
import { magnitude, sub, cexp } from '../complex/arithmetic.js';
import {
  computeOrbit,
  computeMultiplier as iterateMultiplier,
  classifyFixedPoint,
} from '../complex/iterate.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

/** Convergence tolerance for fixed-point detection */
const CONVERGENCE_TOL = 1e-8;

/** Escape radius beyond which orbits are considered divergent */
const ESCAPE_RADIUS = 100;

/** Threshold radius separating contractive from expansive behavior */
const CONTRACTION_BOUNDARY = 1.0;

/** Base contraction factor for the learning model */
const BASE_ALPHA = 0.7;

/* ------------------------------------------------------------------ */
/*  Core: Skill position -> complex number                              */
/* ------------------------------------------------------------------ */

/**
 * Convert a skill position (theta, radius) to a complex number:
 *   z = radius * exp(i * theta) = radius * (cos(theta) + i*sin(theta))
 */
function positionToComplex(pos: SkillPosition): ComplexNumber {
  return cexp({ re: Math.log(Math.max(pos.radius, 1e-15)), im: pos.theta });
}

/* ------------------------------------------------------------------ */
/*  Skill iteration model                                               */
/* ------------------------------------------------------------------ */

/**
 * Build the iteration function for a given skill position.
 *
 * The model: f(z) = alpha * z + beta
 *   - alpha < 1 when radius < CONTRACTION_BOUNDARY (learning/contracting)
 *   - alpha > 1 when radius > CONTRACTION_BOUNDARY (unstable/repelling)
 *   - beta is a small correction derived from the skill's angular position
 *
 * For skills near the origin (radius ~ 0), alpha ~ 0, producing a
 * superattracting fixed point (compiled skill).
 */
function buildIterationFn(pos: SkillPosition): IterationFn {
  // Alpha is determined by the radius: small radius = strong contraction
  // For very small radii (compiled skills), alpha -> 0 (superattracting)
  // For moderate radii (learning skills), alpha ~ 0.7 (attracting)
  // For large radii (unstable skills), alpha > 1 (repelling)
  //
  // Uses r^4 scaling below the boundary so that r=0.001 gives alpha ~ 1e-12
  // (below the superattracting threshold in classifyFixedPoint).
  const r = pos.radius;
  const alpha = r < CONTRACTION_BOUNDARY
    ? Math.pow(r, 4) * BASE_ALPHA + (1 - BASE_ALPHA) * Math.pow(r, 4)
    : r * BASE_ALPHA + (1 - BASE_ALPHA) * r;

  // Beta is a small observation correction pointing toward the real axis
  const beta: ComplexNumber = {
    re: 0.1 * Math.cos(pos.theta),
    im: 0.1 * Math.sin(pos.theta) * (1 - Math.min(pos.radius, 1.0)),
  };

  return (z: ComplexNumber): ComplexNumber => ({
    re: alpha * z.re + beta.re,
    im: alpha * z.im + beta.im,
  });
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Classify the dynamics of a skill at a given position.
 *
 * Runs the skill iteration model and classifies the convergence behavior:
 * attracting, repelling, superattracting, or indifferent.
 */
export function classifySkillDynamics(
  position: SkillPosition,
  iterations: number,
): SkillDynamics {
  const z0 = positionToComplex(position);
  const f = buildIterationFn(position);
  const orbit = computeOrbit(z0, f, iterations, ESCAPE_RADIUS);
  const history = orbit.points;

  // Detect fixed point
  const fp = detectSkillFixedPoint(history);

  // Compute multiplier at fixed point (or at last orbit point if no convergence)
  const evalPoint = fp ?? (history.length > 0 ? history[history.length - 1] : z0);
  const mult = computeSkillMultiplier(f, evalPoint);
  const classification = classifyFixedPoint(mult);

  // Fatou domain classification
  const fatouDomain = classifyFatouJulia(position);

  // Convergence rate: ratio of last two consecutive distances (geometric rate)
  const rate = computeConvergenceRate(history);

  return {
    position,
    multiplier: mult,
    classification,
    fatouDomain,
    iterationHistory: history,
    convergenceRate: rate,
  };
}

/**
 * Compute the orbit of a skill position under the iteration model.
 *
 * Converts the skill position to a complex number, builds the iteration
 * function, and iterates for the specified number of steps.
 */
export function computeSkillOrbit(
  position: SkillPosition,
  iterations: number,
): ComplexNumber[] {
  const z0 = positionToComplex(position);
  const f = buildIterationFn(position);
  const orbit = computeOrbit(z0, f, iterations, ESCAPE_RADIUS);
  return orbit.points;
}

/**
 * Detect the convergence point (fixed point) in an orbit.
 *
 * Examines the tail of the orbit for stabilization. If the last several
 * points are within CONVERGENCE_TOL of each other, returns the average
 * as the fixed point. Returns null if the orbit does not converge.
 */
export function detectSkillFixedPoint(
  orbit: ComplexNumber[],
): ComplexNumber | null {
  if (orbit.length < 4) return null;

  // Check if the last few points have stabilized
  const tailSize = Math.min(10, Math.floor(orbit.length / 2));
  const tail = orbit.slice(-tailSize);
  const last = tail[tail.length - 1];

  // Check for divergence
  if (magnitude(last) > ESCAPE_RADIUS) return null;

  // Check if all tail points are close to the last point
  for (const pt of tail) {
    if (magnitude(sub(pt, last)) > CONVERGENCE_TOL * 100) {
      return null;
    }
  }

  // Return the average of the tail as the fixed point estimate
  let sumRe = 0;
  let sumIm = 0;
  for (const pt of tail) {
    sumRe += pt.re;
    sumIm += pt.im;
  }

  return {
    re: sumRe / tail.length,
    im: sumIm / tail.length,
  };
}

/**
 * Compute the multiplier (derivative) of an iteration function at a point.
 *
 * Wraps the iterate module's computeMultiplier with the IterationFn type.
 */
export function computeSkillMultiplier(
  f: IterationFn,
  z: ComplexNumber,
): ComplexNumber {
  return iterateMultiplier(f, z);
}

/**
 * Classify whether a skill position is in the Fatou domain (stable) or
 * near the Julia boundary (sensitive/chaotic).
 *
 * Skills with radius < CONTRACTION_BOUNDARY and moderate theta values
 * are in the Fatou domain. Skills with large radius or near critical
 * angles are on or near the Julia boundary.
 *
 * @returns true if the position is in the Fatou domain (stable)
 */
export function classifyFatouJulia(position: SkillPosition): boolean {
  // The Fatou domain corresponds to positions where the iteration
  // is contractive (alpha < 1). This happens when radius < boundary.
  const r = position.radius;
  const alpha = r < CONTRACTION_BOUNDARY
    ? Math.pow(r, 4) * BASE_ALPHA + (1 - BASE_ALPHA) * Math.pow(r, 4)
    : r * BASE_ALPHA + (1 - BASE_ALPHA) * r;

  return alpha < 1.0;
}

/**
 * Clamp angular velocity to enforce bounded learning.
 *
 * The skill-creator enforces a maximum 20% content change per refinement.
 * In dynamical terms, this limits the angular displacement per iteration:
 *   |delta_theta| <= maxChange
 *
 * @param deltaTheta - The proposed angular change
 * @param maxChange - Maximum allowed angular change (default: 20% of 2*PI)
 * @returns The clamped angular velocity
 */
export function clampAngularVelocity(
  deltaTheta: number,
  maxChange: number = 0.2 * 2 * Math.PI,
): number {
  if (Math.abs(deltaTheta) <= maxChange) {
    return deltaTheta;
  }
  return Math.sign(deltaTheta) * maxChange;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Compute the geometric convergence rate from the orbit.
 *
 * Scans the orbit for consecutive pairs where the distance ratio is
 * meaningful (denominator above numerical noise). Returns the ratio
 * of consecutive distances:
 *   rate = |z_n - z_{n-1}| / |z_{n-1} - z_{n-2}|
 *
 * A rate < 1 indicates convergence. Returns 0 if the orbit is too
 * short or all distances are below noise.
 */
function computeConvergenceRate(orbit: ComplexNumber[]): number {
  if (orbit.length < 3) return 0;

  // Scan from early in the orbit to find meaningful convergence data
  for (let i = 2; i < orbit.length; i++) {
    const d1 = magnitude(sub(orbit[i], orbit[i - 1]));
    const d2 = magnitude(sub(orbit[i - 1], orbit[i - 2]));

    if (d2 > 1e-12 && d1 > 1e-15) {
      return d1 / d2;
    }
  }

  return 0; // Orbit too short or degenerate
}

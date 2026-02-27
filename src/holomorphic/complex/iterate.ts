import type { ComplexNumber, Orbit, FixedPointClassification } from '../types';
import { magnitude, sub, argument } from './arithmetic';

/** Function that maps a complex number to another */
export type IterationFn = (z: ComplexNumber) => ComplexNumber;

/** Default escape radius for orbit computation */
const DEFAULT_ESCAPE_RADIUS = 2;

/** Step size for numerical differentiation */
const DEFAULT_H = 1e-8;

/** Tolerance for period detection */
const DEFAULT_TOLERANCE = 1e-10;

/** Tolerance for rational-multiple-of-pi test */
const DEFAULT_RATIONAL_TOLERANCE = 1e-6;

/** Maximum denominator to check in rationality test */
const MAX_DENOMINATOR = 100;

/**
 * Compute the orbit of z0 under repeated application of f.
 *
 * The orbit stores iterates f(z0), f^2(z0), ..., up to maxIter points
 * or until the magnitude exceeds escapeRadius.
 *
 * If |z0| > escapeRadius before any iteration, escapeTime = 0.
 */
export function computeOrbit(
  z0: ComplexNumber,
  f: IterationFn,
  maxIter: number,
  escapeRadius: number = DEFAULT_ESCAPE_RADIUS,
): Orbit {
  const points: ComplexNumber[] = [];
  let escaped = false;
  let escapeTime: number | null = null;

  // Check if z0 itself exceeds escape radius
  if (magnitude(z0) > escapeRadius) {
    return {
      z0,
      points: [z0],
      escaped: true,
      escapeTime: 0,
      period: null,
    };
  }

  let z = z0;
  for (let i = 0; i < maxIter; i++) {
    z = f(z);
    points.push(z);

    if (magnitude(z) > escapeRadius) {
      escaped = true;
      escapeTime = i + 1;
      break;
    }
  }

  return {
    z0,
    points,
    escaped,
    escapeTime,
    period: null,
  };
}

/**
 * Detect the period of a non-escaping orbit.
 *
 * Searches for the smallest p >= 1 such that the last point in the orbit
 * is approximately equal to the point p steps before it.
 *
 * Returns null if no period is detected.
 */
export function detectPeriod(
  orbit: Orbit,
  tolerance: number = DEFAULT_TOLERANCE,
): number | null {
  const { points } = orbit;
  if (points.length < 2) return points.length === 1 ? 1 : null;

  // Use the tail of the orbit for period detection (skip transients)
  const tailStart = Math.floor(points.length / 2);
  const last = points[points.length - 1];

  for (let p = 1; p <= points.length - tailStart; p++) {
    const candidate = points[points.length - 1 - p];
    const diff = sub(last, candidate);
    if (magnitude(diff) < tolerance) {
      return p;
    }
  }

  return null;
}

/**
 * Compute the multiplier (derivative) of f at a fixed point z* using
 * numerical differentiation.
 *
 * multiplier = f'(z*) ~ (f(z* + h) - f(z* - h)) / (2h)
 *
 * Computes both real and imaginary parts via central differences.
 */
export function computeMultiplier(
  f: IterationFn,
  z: ComplexNumber,
  h: number = DEFAULT_H,
): ComplexNumber {
  // Partial derivative w.r.t. real part gives du/dx + i*dv/dx
  const fPlusH = f({ re: z.re + h, im: z.im });
  const fMinusH = f({ re: z.re - h, im: z.im });

  return {
    re: (fPlusH.re - fMinusH.re) / (2 * h),
    im: (fPlusH.im - fMinusH.im) / (2 * h),
  };
}

/**
 * Classify a fixed point based on its multiplier.
 *
 * - |lambda| = 0: superattracting
 * - |lambda| < 1: attracting
 * - |lambda| > 1: repelling
 * - |lambda| = 1, rational angle: rationally indifferent (parabolic)
 * - |lambda| = 1, irrational angle: irrationally indifferent (Siegel/Cremer)
 */
export function classifyFixedPoint(
  multiplier: ComplexNumber,
): FixedPointClassification {
  const mag = magnitude(multiplier);

  // Superattracting: multiplier is exactly (or very close to) zero
  if (mag < DEFAULT_TOLERANCE) {
    return 'superattracting';
  }

  // Use a tolerance band around 1 for the unit circle test
  const unitTolerance = 1e-6;

  if (mag < 1 - unitTolerance) {
    return 'attracting';
  }

  if (mag > 1 + unitTolerance) {
    return 'repelling';
  }

  // On (or very near) the unit circle — check if the angle is a
  // rational multiple of PI
  const angle = argument(multiplier);
  if (isRationalMultipleOfPi(angle)) {
    return 'rationally_indifferent';
  }

  return 'irrationally_indifferent';
}

/**
 * Test whether an angle is a rational multiple of PI.
 *
 * An angle theta is a rational multiple of PI if theta/PI = p/q
 * for integers p, q with q <= MAX_DENOMINATOR.
 *
 * Special case: angle = 0 is considered rational (0/1 * PI).
 */
export function isRationalMultipleOfPi(
  angle: number,
  tolerance: number = DEFAULT_RATIONAL_TOLERANCE,
): boolean {
  // Normalize angle to [0, 2*PI)
  const twoPi = 2 * Math.PI;
  let normalized = ((angle % twoPi) + twoPi) % twoPi;

  // angle / PI — if this is rational, we have a rational multiple
  const ratio = normalized / Math.PI;

  // Check if ratio is close to p/q for small denominators
  for (let q = 1; q <= MAX_DENOMINATOR; q++) {
    const p = Math.round(ratio * q);
    if (Math.abs(ratio - p / q) < tolerance) {
      return true;
    }
  }

  return false;
}

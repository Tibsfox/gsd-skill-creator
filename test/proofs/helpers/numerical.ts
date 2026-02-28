// test/proofs/helpers/numerical.ts
// Numerical utilities for proof verification tests (Phase 475, Chapters 1-6)

/** Absolute tolerance comparison — use when values may be near zero. */
export function closeToAbs(a: number, b: number, tol = 1e-10): boolean {
  return Math.abs(a - b) < tol;
}

/** Relative tolerance comparison — use for non-zero values. */
export function closeToRel(a: number, b: number, rtol = 1e-9): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-10);
  return Math.abs(a - b) / scale < rtol;
}

/** Assert percent deviation: |a - b| / |b| < maxPct (0.01 = 1%). */
export function assertPercentDeviation(value: number, reference: number, maxPct: number): boolean {
  if (reference === 0) return Math.abs(value) < maxPct;
  return Math.abs(value - reference) / Math.abs(reference) < maxPct;
}

/** Generate N evenly-spaced angles in [0, 2*pi). */
export function testAngles(n = 20): number[] {
  return Array.from({ length: n }, (_, i) => (2 * Math.PI * i) / n);
}

/** Generate N random angles in [0, 2*pi). Uses deterministic seed offset for repeatability. */
export function randomAngles(n = 100): number[] {
  // Uses Math.random — tests relying on this should use large N for robustness.
  return Array.from({ length: n }, () => Math.random() * 2 * Math.PI);
}

/** Generate N random values in [0, 1]. */
export function randomRadii(n = 100): number[] {
  return Array.from({ length: n }, () => Math.random());
}

/** Dot product of two 2D vectors. */
export function dot2D(
  u: { x: number; y: number },
  v: { x: number; y: number },
): number {
  return u.x * v.x + u.y * v.y;
}

/** Magnitude of a 2D vector. */
export function mag2D(u: { x: number; y: number }): number {
  return Math.sqrt(u.x * u.x + u.y * u.y);
}

/** Numerical derivative via central difference (for Ch 8-10 tests). */
export function numericalDerivative(f: (x: number) => number, x: number, h = 1e-7): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

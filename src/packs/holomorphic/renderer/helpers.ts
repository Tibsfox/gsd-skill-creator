import type { ComplexNumber, FixedPointClassification, ColorScheme, RGB } from '../types.js';
import { pixelToComplex, type Bounds } from './core.js';

/* ------------------------------------------------------------------ */
/*  Inline complex helpers (avoids dependency on parallel agent's module) */
/* ------------------------------------------------------------------ */

function cMag2(z: ComplexNumber): number {
  return z.re * z.re + z.im * z.im;
}

/* ------------------------------------------------------------------ */
/*  Bifurcation Diagram                                                 */
/* ------------------------------------------------------------------ */

/**
 * Render a bifurcation diagram for the logistic map x_{n+1} = r * x * (1 - x).
 *
 * For each r value (column), iterate the map to settle, then record
 * unique attractor values as y-coordinates in [0, 1].
 *
 * @returns grid[x] = array of attractor y-values (normalized to [0,1])
 */
export function renderBifurcation(
  rMin: number,
  rMax: number,
  width: number,
  height: number,
  maxIter: number,
): number[][] {
  const settle = Math.floor(maxIter * 0.6);
  const collect = maxIter - settle;
  const grid: number[][] = Array.from({ length: width }, () => []);

  for (let col = 0; col < width; col++) {
    const r = rMin + (col / (width - 1)) * (rMax - rMin);
    let x = 0.5; // initial condition

    // Settle transient
    for (let i = 0; i < settle; i++) {
      x = r * x * (1 - x);
    }

    // Collect attractor values
    const seen = new Set<number>();
    for (let i = 0; i < collect; i++) {
      x = r * x * (1 - x);
      // Quantize to height resolution to find unique attractors
      const quantized = Math.round(x * (height - 1)) / (height - 1);
      if (quantized >= 0 && quantized <= 1) {
        seen.add(quantized);
      }
    }

    grid[col] = Array.from(seen).sort();
  }

  return grid;
}

/* ------------------------------------------------------------------ */
/*  Orbit Plot                                                          */
/* ------------------------------------------------------------------ */

/**
 * Iterate f starting from z0 for maxIter steps, returning each point.
 * Stops early if |z| exceeds escape radius (default 1000).
 */
export function renderOrbitPlot(
  z0: ComplexNumber,
  f: (z: ComplexNumber) => ComplexNumber,
  maxIter: number,
  escapeRadius: number = 1000,
): ComplexNumber[] {
  const r2 = escapeRadius * escapeRadius;
  const points: ComplexNumber[] = [];
  let z = z0;

  for (let i = 0; i < maxIter; i++) {
    z = f(z);
    points.push({ re: z.re, im: z.im });
    if (cMag2(z) > r2) break;
  }

  return points;
}

/* ------------------------------------------------------------------ */
/*  Phase Portrait                                                      */
/* ------------------------------------------------------------------ */

/**
 * Classify each grid point by the dynamics of f near that point.
 *
 * Heuristic classification:
 * - If the orbit converges to 0 → superattracting
 * - If the orbit converges (|z_n - z_{n-1}| decreasing) → attracting
 * - If |z| grows without bound → repelling
 * - If the orbit repeats exactly → rationally_indifferent
 * - Otherwise → irrationally_indifferent
 */
export function renderPhasePortrait(
  bounds: Bounds,
  f: (z: ComplexNumber) => ComplexNumber,
  resolution: number,
  maxIter: number,
): FixedPointClassification[][] {
  const grid: FixedPointClassification[][] = Array.from(
    { length: resolution },
    () => new Array<FixedPointClassification>(resolution),
  );

  for (let x = 0; x < resolution; x++) {
    for (let y = 0; y < resolution; y++) {
      const z0 = pixelToComplex(x, y, resolution, resolution, bounds);
      grid[x][y] = classifyOrbit(z0, f, maxIter);
    }
  }

  return grid;
}

function classifyOrbit(
  z0: ComplexNumber,
  f: (z: ComplexNumber) => ComplexNumber,
  maxIter: number,
): FixedPointClassification {
  let z = z0;
  let prev = z0;
  const escapeR2 = 1e6;
  let convergingCount = 0;

  for (let i = 0; i < maxIter; i++) {
    z = f(z);
    const mag2 = cMag2(z);

    // Escaped → repelling
    if (mag2 > escapeR2) return 'repelling';

    const dRe = z.re - prev.re;
    const dIm = z.im - prev.im;
    const delta2 = dRe * dRe + dIm * dIm;

    // Converged to zero → superattracting
    if (mag2 < 1e-12) return 'superattracting';

    // Converged to a fixed point → attracting
    if (delta2 < 1e-12) return 'attracting';

    // Track convergence trend
    if (delta2 < cMag2({ re: prev.re - (i > 0 ? z.re : prev.re), im: prev.im - (i > 0 ? z.im : prev.im) })) {
      convergingCount++;
    }

    prev = z;
  }

  // Check for periodicity: compare last few iterates
  const tail: ComplexNumber[] = [];
  let zTail = z0;
  for (let i = 0; i < maxIter; i++) zTail = f(zTail);
  for (let i = 0; i < 8; i++) {
    zTail = f(zTail);
    tail.push({ re: zTail.re, im: zTail.im });
  }

  // Check if tail has a repeated value (periodic)
  for (let i = 0; i < tail.length; i++) {
    for (let j = i + 1; j < tail.length; j++) {
      const d = (tail[i].re - tail[j].re) ** 2 + (tail[i].im - tail[j].im) ** 2;
      if (d < 1e-10) return 'rationally_indifferent';
    }
  }

  return 'irrationally_indifferent';
}

/* ------------------------------------------------------------------ */
/*  Color from scheme (normalized t ∈ [0,1])                            */
/* ------------------------------------------------------------------ */

/**
 * Map a normalized parameter t ∈ [0,1] to an RGB color using the
 * given color scheme.
 */
export function colorFromScheme(scheme: ColorScheme, t: number): RGB {
  if (scheme === 'binary') {
    return t > 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  }

  if (scheme === 'smooth') {
    const r = Math.floor(255 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t)));
    const g = Math.floor(255 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t + 2)));
    const b = Math.floor(255 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t + 4)));
    return { r, g, b };
  }

  // escape_time: HSL hue rotation
  const hue = 360 * t;
  return hslToRgb(hue, 1.0, 0.5);
}

/** Convert HSL (h in degrees, s/l in [0,1]) to RGB (0-255). */
function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1: number, g1: number, b1: number;

  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

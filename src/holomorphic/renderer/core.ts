import type { ComplexNumber, ColorScheme, RGB } from '../types';

/* ------------------------------------------------------------------ */
/*  Inline complex helpers (avoids dependency on parallel agent's module) */
/* ------------------------------------------------------------------ */

function cAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function cMag2(z: ComplexNumber): number {
  return z.re * z.re + z.im * z.im;
}

/* ------------------------------------------------------------------ */
/*  Bounds type                                                         */
/* ------------------------------------------------------------------ */

export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/* ------------------------------------------------------------------ */
/*  Pixel ↔ Complex mapping                                             */
/* ------------------------------------------------------------------ */

/**
 * Map a pixel coordinate to a complex number within the given bounds.
 * (0,0) is top-left; y increases downward on screen but upward in ℂ.
 */
export function pixelToComplex(
  px: number,
  py: number,
  width: number,
  height: number,
  bounds: Bounds,
): ComplexNumber {
  const re = bounds.xMin + ((px + 0.5) / width) * (bounds.xMax - bounds.xMin);
  const im = bounds.yMax - ((py + 0.5) / height) * (bounds.yMax - bounds.yMin);
  return { re, im };
}

/* ------------------------------------------------------------------ */
/*  Escape-time algorithms                                              */
/* ------------------------------------------------------------------ */

/**
 * Mandelbrot escape time for parameter c.
 * Returns the number of iterations before |z| exceeds escapeRadius,
 * or maxIter if the orbit does not escape.
 */
export function mandelbrotEscape(
  c: ComplexNumber,
  maxIter: number,
  escapeRadius: number,
): number {
  const r2 = escapeRadius * escapeRadius;
  let z: ComplexNumber = { re: 0, im: 0 };
  for (let i = 0; i < maxIter; i++) {
    z = cAdd(cMul(z, z), c);
    if (cMag2(z) > r2) return i;
  }
  return maxIter;
}

/**
 * Julia escape time for starting point z0 with fixed parameter c.
 * Returns the number of iterations before |z| exceeds escapeRadius,
 * or maxIter if the orbit does not escape.
 */
export function juliaEscape(
  z0: ComplexNumber,
  c: ComplexNumber,
  maxIter: number,
  escapeRadius: number,
): number {
  const r2 = escapeRadius * escapeRadius;
  let z = z0;
  for (let i = 0; i < maxIter; i++) {
    z = cAdd(cMul(z, z), c);
    if (cMag2(z) > r2) return i;
  }
  return maxIter;
}

/* ------------------------------------------------------------------ */
/*  Color mapping                                                       */
/* ------------------------------------------------------------------ */

/**
 * Map an escape-time iteration count to an RGB color.
 *
 * Schemes:
 * - 'binary':      black if not escaped, white if escaped
 * - 'escape_time': hue-based gradient proportional to iteration
 * - 'smooth':      smooth gradient using sinusoidal interpolation
 */
export function colorMap(
  iterations: number,
  maxIter: number,
  scheme: ColorScheme,
): RGB {
  const escaped = iterations < maxIter;

  if (scheme === 'binary') {
    return escaped ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  }

  if (!escaped) return { r: 0, g: 0, b: 0 };

  const t = iterations / maxIter;

  if (scheme === 'smooth') {
    const r = Math.floor(255 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t)));
    const g = Math.floor(255 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t + 2)));
    const b = Math.floor(255 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t + 4)));
    return { r, g, b };
  }

  // escape_time: simple hue rotation
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

/* ------------------------------------------------------------------ */
/*  Full-frame renderers                                                */
/* ------------------------------------------------------------------ */

/**
 * Render a Mandelbrot set escape-time grid.
 * Returns grid[x][y] where x is the column and y is the row.
 */
export function renderMandelbrot(
  width: number,
  height: number,
  bounds: Bounds,
  maxIter: number,
  escapeRadius: number,
): number[][] {
  const grid: number[][] = Array.from({ length: width }, () =>
    new Array<number>(height),
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const c = pixelToComplex(x, y, width, height, bounds);
      grid[x][y] = mandelbrotEscape(c, maxIter, escapeRadius);
    }
  }
  return grid;
}

/**
 * Render a Julia set escape-time grid for fixed parameter c.
 * Returns grid[x][y] where x is the column and y is the row.
 */
export function renderJulia(
  width: number,
  height: number,
  bounds: Bounds,
  c: ComplexNumber,
  maxIter: number,
  escapeRadius: number,
): number[][] {
  const grid: number[][] = Array.from({ length: width }, () =>
    new Array<number>(height),
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const z0 = pixelToComplex(x, y, width, height, bounds);
      grid[x][y] = juliaEscape(z0, c, maxIter, escapeRadius);
    }
  }
  return grid;
}

/* ------------------------------------------------------------------ */
/*  Zoom                                                                */
/* ------------------------------------------------------------------ */

/**
 * Zoom into the bounds by the given factor, centered at (centerX, centerY).
 * A factor of 2 halves the visible range in each dimension.
 */
export function applyZoom(
  bounds: Bounds,
  centerX: number,
  centerY: number,
  factor: number,
): Bounds {
  const halfW = (bounds.xMax - bounds.xMin) / (2 * factor);
  const halfH = (bounds.yMax - bounds.yMin) / (2 * factor);
  return {
    xMin: centerX - halfW,
    xMax: centerX + halfW,
    yMin: centerY - halfH,
    yMax: centerY + halfH,
  };
}

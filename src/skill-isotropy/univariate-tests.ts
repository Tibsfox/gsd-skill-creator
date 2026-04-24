/**
 * Univariate goodness-of-fit tests used by the Isotropy Audit.
 *
 * These tests score how far a 1-D projected sample deviates from a target
 * distribution. Used in audit mode only (no gradient flow required), so
 * Anderson-Darling, KS, and Shapiro-Wilk are all acceptable choices.
 *
 * Note: these are intentionally classical / non-differentiable. The
 * gradient-flow SIGReg variant (Epps-Pulley ECF) ships separately in Phase 729
 * under `src/sigreg/`.
 *
 * @module skill-isotropy/univariate-tests
 */

import type { TargetDistribution, UnivariateTest } from './types.js';

/** Standard-normal PDF φ(x). */
function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Standard-normal CDF Φ(x) via Abramowitz-Stegun approximation (error < 7.5e-8). */
function normalCdf(x: number): number {
  // A&S 26.2.17
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    c *
      Math.exp((-x * x) / 2.0) *
      t *
      (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  return x >= 0 ? y : 1 - y;
}

/** Sort a numeric array in ascending order. Returns a new array. */
function ascending(values: ReadonlyArray<number>): number[] {
  return [...values].sort((a, b) => a - b);
}

/** Sample mean + population stddev (denominator N, not N-1). */
function meanStd(values: ReadonlyArray<number>): { mean: number; std: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 0 };
  let s = 0;
  for (const v of values) s += v;
  const mean = s / n;
  let sq = 0;
  for (const v of values) {
    const d = v - mean;
    sq += d * d;
  }
  const std = Math.sqrt(sq / n);
  return { mean, std };
}

/** Standardize to zero mean / unit std for tests that need it. */
function standardize(values: ReadonlyArray<number>): number[] {
  const { mean, std } = meanStd(values);
  const safe = std === 0 ? 1 : std;
  return values.map((v) => (v - mean) / safe);
}

/** Anderson-Darling A² statistic against standard normal. */
export function andersonDarlingA2(values: ReadonlyArray<number>): number {
  const n = values.length;
  if (n < 2) return 0;
  const z = ascending(standardize(values));
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const f = normalCdf(z[i]);
    const f2 = normalCdf(z[n - 1 - i]);
    // Clamp to avoid log(0).
    const lf = Math.log(Math.max(f, 1e-12));
    const l1f2 = Math.log(Math.max(1 - f2, 1e-12));
    sum += (2 * i + 1) * (lf + l1f2);
  }
  return -n - sum / n;
}

/** Kolmogorov-Smirnov D statistic against standard normal. */
export function ksStatistic(values: ReadonlyArray<number>): number {
  const n = values.length;
  if (n === 0) return 0;
  const z = ascending(standardize(values));
  let dMax = 0;
  for (let i = 0; i < n; i++) {
    const fEmp = (i + 1) / n;
    const fTheo = normalCdf(z[i]);
    const d = Math.max(Math.abs(fEmp - fTheo), Math.abs(i / n - fTheo));
    if (d > dMax) dMax = d;
  }
  return dMax;
}

/**
 * Shapiro-Wilk W statistic (approximate; Royston 1982 ak coefficients).
 * Returns 1 - W so that "larger = more anomalous" matches the other tests.
 */
export function shapiroWilkDeviation(values: ReadonlyArray<number>): number {
  const n = values.length;
  if (n < 3) return 0;
  const x = ascending(values);
  const mean = x.reduce((s, v) => s + v, 0) / n;
  let ss = 0;
  for (const v of x) ss += (v - mean) * (v - mean);
  if (ss === 0) return 0;
  // Royston approximate coefficients.
  const m: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    m[i] = -normalInverseCdf((i + 1 - 0.375) / (n + 0.25));
  }
  const c = Math.sqrt(m.reduce((s, v) => s + v * v, 0));
  const a: number[] = new Array(n);
  for (let i = 0; i < n; i++) a[i] = m[i] / c;
  let b = 0;
  for (let i = 0; i < n; i++) b += a[i] * x[n - 1 - i];
  const w = (b * b) / ss;
  return 1 - w;
}

/** Inverse standard-normal CDF via Beasley-Springer-Moro (adequate for n>=3 ranks). */
function normalInverseCdf(p: number): number {
  if (p <= 0 || p >= 1) throw new Error('normalInverseCdf input must be in (0,1)');
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const cc = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((cc[0] * q + cc[1]) * q + cc[2]) * q + cc[3]) * q + cc[4]) * q + cc[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((cc[0] * q + cc[1]) * q + cc[2]) * q + cc[3]) * q + cc[4]) * q + cc[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/** Rough asymptotic p-value for Anderson-Darling A² under the normal null. */
export function andersonDarlingPValue(a2: number): number {
  // Stephens 1986 approximation for standard-normal null with unknown mean/variance.
  const a2star = a2 * (1 + 0.75 / 10 + 2.25 / 100);
  if (a2star < 0.2) return 1 - Math.exp(-13.436 + 101.14 * a2star - 223.73 * a2star * a2star);
  if (a2star < 0.34) return 1 - Math.exp(-8.318 + 42.796 * a2star - 59.938 * a2star * a2star);
  if (a2star < 0.6) return Math.exp(0.9177 - 4.279 * a2star - 1.38 * a2star * a2star);
  if (a2star < 13) return Math.exp(1.2937 - 5.709 * a2star + 0.0186 * a2star * a2star);
  return 0;
}

/** Rough p-value for KS D statistic under the standard-normal null. */
export function ksPValue(d: number, n: number): number {
  // Asymptotic two-sided KS.
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * d;
  let sum = 0;
  for (let j = 1; j <= 100; j++) {
    const sign = j % 2 === 1 ? 1 : -1;
    sum += sign * Math.exp(-2 * j * j * lambda * lambda);
  }
  return Math.max(0, Math.min(1, 2 * sum));
}

/** Convenience: run the chosen univariate test and return (statistic, p-value). */
export function runUnivariateTest(
  values: ReadonlyArray<number>,
  test: UnivariateTest,
  target: TargetDistribution,
): { statistic: number; pValue: number } {
  // For 'standard-gaussian' and 'zero-mean' we use the standard-normal null after
  // standardization. For 'uniform-sphere' the 1-D projection of a uniform
  // distribution on S^{K-1} approaches a scaled Gaussian for K >> 1 (see
  // Diaconis & Freedman 1984), so the same tests apply within audit tolerance.
  void target;
  switch (test) {
    case 'anderson-darling': {
      const a2 = andersonDarlingA2(values);
      return { statistic: a2, pValue: andersonDarlingPValue(a2) };
    }
    case 'ks-statistic': {
      const d = ksStatistic(values);
      return { statistic: d, pValue: ksPValue(d, values.length) };
    }
    case 'shapiro-wilk': {
      const dev = shapiroWilkDeviation(values);
      // Rough p-value mapping — good for audit triage but not a research-grade test.
      const p = Math.exp(-dev * values.length);
      return { statistic: dev, pValue: Math.max(0, Math.min(1, p)) };
    }
  }
}

export const STANDARD_NORMAL_HELPERS = { normalPdf, normalCdf, meanStd };

/**
 * Pearson + Spearman rank correlation — pure, deterministic, small.
 *
 * @module intrinsic-telemetry/correlation
 */

/** Pearson correlation (linear). Returns 0 when either array has zero variance. */
export function pearson(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>): number {
  if (xs.length !== ys.length) {
    throw new Error('pearson: xs and ys must have equal length');
  }
  const n = xs.length;
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

/** Rank values with ties → average of the tied ranks (dense-average ranking). */
export function rankWithTies(values: ReadonlyArray<number>): number[] {
  const n = values.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => values[a] - values[b]);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && values[idx[j + 1]] === values[idx[i]]) j++;
    const avg = (i + j + 2) / 2; // average rank for the tie group, 1-indexed
    for (let k = i; k <= j; k++) ranks[idx[k]] = avg;
    i = j + 1;
  }
  return ranks;
}

/** Spearman rank correlation. */
export function spearman(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>): number {
  if (xs.length !== ys.length) {
    throw new Error('spearman: xs and ys must have equal length');
  }
  if (xs.length < 2) return 0;
  return pearson(rankWithTies(xs), rankWithTies(ys));
}

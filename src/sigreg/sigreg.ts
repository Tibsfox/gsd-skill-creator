/**
 * SIGReg — sliced Epps-Pulley regularizer.
 *
 * Portions of this regularizer's slicing loop are derived from
 * rbalestr-lab/lejepa (MIT, © Randall Balestriero and LeJEPA Contributors).
 * See ../../license_notices.md for the full attribution.
 *
 * Computes the average Epps-Pulley statistic over numSlices random unit
 * directions on S^{K-1}. The result is the scalar SIGReg loss suitable for
 * λ-weighted addition to a prediction loss: L = L_pred + λ · SIGReg(Z).
 *
 * Core implementation ≤80 LOC per the LEJEPA-14 acceptance criterion. Helper
 * modules (epps-pulley.ts, types.ts) are intentionally small and focused.
 *
 * @module sigreg/sigreg
 */

import { sampleUnitDirections, projectOntoDirection } from '../skill-isotropy/slicing.js';
import { eppsPulley } from './epps-pulley.js';
import { LEJEPA_DEFAULT_CONFIG, type SigregBreakdown, type SigregConfig } from './types.js';

/**
 * SIGReg scalar loss: average Epps-Pulley statistic over random unit slices.
 * Pure function; no side effects.
 */
export function sigreg(
  embeddings: ReadonlyArray<ReadonlyArray<number>>,
  config: SigregConfig = LEJEPA_DEFAULT_CONFIG,
): number {
  return sigregWithBreakdown(embeddings, config).loss;
}

/** Same as `sigreg` but returns per-slice statistics for telemetry. */
export function sigregWithBreakdown(
  embeddings: ReadonlyArray<ReadonlyArray<number>>,
  config: SigregConfig = LEJEPA_DEFAULT_CONFIG,
): SigregBreakdown {
  if (embeddings.length === 0) {
    return { loss: 0, perSliceStatistic: [], maxSliceStatistic: 0, runTag: makeRunTag(config) };
  }
  const dim = embeddings[0].length;
  const directions = sampleUnitDirections(config.numSlices, dim, config.seed);
  const per: number[] = new Array(directions.length);
  let sum = 0;
  let max = 0;
  for (let m = 0; m < directions.length; m++) {
    const projected = projectOntoDirection(embeddings, directions[m]);
    const stat = eppsPulley(projected, config.univariateTest);
    per[m] = stat;
    sum += stat;
    if (stat > max) max = stat;
  }
  return {
    loss: sum / directions.length,
    perSliceStatistic: per,
    maxSliceStatistic: max,
    runTag: makeRunTag(config),
  };
}

function makeRunTag(c: SigregConfig): string {
  const seedTag = c.seed === undefined ? 'rand' : `s${c.seed}`;
  return `ep|M=${c.numSlices}|q=${c.univariateTest.numPoints}|σ=${c.univariateTest.sigma}|${seedTag}`;
}

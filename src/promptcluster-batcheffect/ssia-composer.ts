/**
 * PromptCluster BatchEffect Detector — SSIA composer.
 *
 * Combines batch-effect findings (this module, UIP-19, Phase 771) with
 * v1.49.571 SSIA isotropy-collapse findings (`src/skill-isotropy/`) into a
 * single `CombinedReport`. Neither sub-report overwrites the other; the
 * composition is purely additive.
 *
 * Why compose? The two modules detect orthogonal failure modes:
 *
 * - **SSIA** (Balestriero & LeCun 2025, arXiv:2511.08544v3) tests whether
 *   the skill-embedding distribution on the hypersphere is isotropic — i.e.,
 *   whether projections along random directions follow the expected marginal
 *   (standard Gaussian). Collapse or non-uniformity shows up as anomalous
 *   Anderson-Darling statistics.
 *
 * - **BatchEffect Detector** (Tao et al. 2026, arXiv:2604.14441) tests
 *   whether per-batch centroids shift relative to the grand mean — systematic
 *   inter-group contamination that could look perfectly isotropic within each
 *   batch but still ruin cross-batch comparisons.
 *
 * The joint status `'degraded'` fires when either sub-report signals a
 * problem; `'watch'` when only a mild signal is present from either source.
 *
 * CAPCOM preservation: read-only. No skill-library writes. No gate bypass.
 *
 * @module promptcluster-batcheffect/ssia-composer
 */

import type { BatchEffectReport, CombinedReport } from './types.js';

/** Module-version identifiers for forensic cross-referencing. */
const MODULE_VERSION_SSIA = 'v1.49.571';
const MODULE_VERSION_BATCH_EFFECT = 'v1.49.573';

/**
 * Compose a v1.49.571 SSIA `IsotropyAuditReport` with a `BatchEffectReport`
 * into a single `CombinedReport`.
 *
 * The function accepts `ssiaReport: unknown` (rather than importing the
 * concrete `IsotropyAuditReport` type) so that:
 * 1. `src/promptcluster-batcheffect/` does not create a hard TypeScript
 *    dependency on `src/skill-isotropy/` (avoids circular potential).
 * 2. Callers who do not have the SSIA module enabled can still pass `null` or
 *    `undefined` and get a graceful combined report.
 *
 * The SSIA `verdict` field is read from the opaque report object; if it
 * cannot be extracted (disabled, null, unknown shape) it is treated as
 * `'healthy'`.
 *
 * @param ssiaReport     The `IsotropyAuditReport` returned by `runIsotropyAudit`
 *                       from `src/skill-isotropy/`. May be null/undefined if SSIA
 *                       is disabled.
 * @param batchReport    The `BatchEffectReport` from this module.
 */
export function composeWithSSIA(
  ssiaReport: unknown,
  batchReport: BatchEffectReport,
): CombinedReport {
  const ssiaVerdict = extractSSIAVerdict(ssiaReport);
  const jointStatus = deriveJointStatus(ssiaVerdict, batchReport);
  const summary = buildSummary(ssiaVerdict, batchReport, jointStatus);

  return {
    moduleVersions: {
      ssia: MODULE_VERSION_SSIA,
      batchEffect: MODULE_VERSION_BATCH_EFFECT,
    },
    ssiaReport,
    batchEffectReport: batchReport,
    jointStatus,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SSIAVerdict = 'healthy' | 'watch' | 'collapse-suspected' | 'unknown';

function extractSSIAVerdict(ssiaReport: unknown): SSIAVerdict {
  if (ssiaReport === null || ssiaReport === undefined) return 'unknown';
  if (typeof ssiaReport !== 'object') return 'unknown';
  const rec = ssiaReport as Record<string, unknown>;
  const v = rec['verdict'];
  if (v === 'healthy' || v === 'watch' || v === 'collapse-suspected') {
    return v as SSIAVerdict;
  }
  return 'unknown';
}

function deriveJointStatus(
  ssiaVerdict: SSIAVerdict,
  batchReport: BatchEffectReport,
): CombinedReport['jointStatus'] {
  if (batchReport.status === 'disabled') return 'disabled';

  const ssiaProblematic =
    ssiaVerdict === 'collapse-suspected' || ssiaVerdict === 'watch';
  const batchProblematic =
    batchReport.status === 'batch-effect-detected';
  const ssiaCollapse = ssiaVerdict === 'collapse-suspected';

  if (ssiaCollapse || batchProblematic) return 'degraded';
  if (ssiaProblematic) return 'watch';
  if (batchReport.maxCentroidShift > 0 && batchReport.status === 'clean') {
    // Clean but non-zero shift — stay 'healthy' unless SSIA has concerns.
    return ssiaVerdict === 'unknown' ? 'healthy' : 'healthy';
  }
  return 'healthy';
}

function buildSummary(
  ssiaVerdict: SSIAVerdict,
  batchReport: BatchEffectReport,
  jointStatus: CombinedReport['jointStatus'],
): string {
  const parts: string[] = [];

  // SSIA part
  switch (ssiaVerdict) {
    case 'healthy':
      parts.push('SSIA: skill-embedding space is isotropic (healthy).');
      break;
    case 'watch':
      parts.push(
        'SSIA: isotropy watch — some directional deviations detected.',
      );
      break;
    case 'collapse-suspected':
      parts.push('SSIA: isotropy collapse suspected — high deviation scores.');
      break;
    case 'unknown':
      parts.push('SSIA: report unavailable or disabled.');
      break;
  }

  // Batch-effect part
  switch (batchReport.status) {
    case 'disabled':
      parts.push('BatchEffect: module is disabled (flag off).');
      break;
    case 'clean':
      parts.push(
        `BatchEffect: no significant batch effects detected ` +
          `(maxShift=${batchReport.maxCentroidShift.toFixed(4)}).`,
      );
      break;
    case 'batch-effect-detected':
      parts.push(
        `BatchEffect: batch effects detected — ${batchReport.evidence.length} batch(es) ` +
          `show significant centroid shift (type=${batchReport.batchKey.type}, ` +
          `maxShift=${batchReport.maxCentroidShift.toFixed(4)}).`,
      );
      break;
  }

  parts.push(`Joint status: ${jointStatus}.`);
  return parts.join(' ');
}

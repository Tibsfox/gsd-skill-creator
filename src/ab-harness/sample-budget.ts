/**
 * A/B harness sample-budget calculator — JP-010b (Wave 3 / phase 844).
 *
 * Implements the Θ(K/ε³) sample complexity from multicalibration theory,
 * calibrated to the K measured by JP-010a K-axis telemetry.
 *
 * Calibration protocol (FINDINGS §6 Q5 + user decision 5):
 *  1. Read the K-axis evidence report produced by JP-010a.
 *  2. If the report shows a measured K and ≥ 7 days of evidence, use measured K.
 *  3. Otherwise (no evidence or < 7 days elapsed), default K = 3 and append an
 *     audit-trail entry to the report.
 *
 * Phase 844 entered 2026-04-26. JP-010a started 2026-04-26 (same day).  No
 * 7-day evidence window has elapsed; K=3 default applied per audit-trail entry
 * already written to REPORT.md by the phase-844 pre-work step.
 *
 * Formula derivation (arXiv:2604.21923 — multicalibration sample complexity):
 *
 *   n = ceil( C · K / ε³ )
 *
 * where:
 *   K  — number of marginal slices (axes: domain × expertise × session-type)
 *   ε  — calibration error tolerance (0 < ε ≤ 1)
 *   C  — dimensionless constant folded into Θ(·); default C = 1 (tightest
 *         multicalibration result; callers may supply larger C for conservative
 *         headroom)
 *
 * At the K=3 default and ε=0.1: n = ceil(1 · 3 / 0.001) = 3000 samples.
 *
 * Reference: arXiv:2604.21923 — multicalibration sample complexity Θ(K/ε³).
 *
 * @module ab-harness/sample-budget
 */

import { promises as fs } from 'node:fs';

// ─── Default K fallback ────────────────────────────────────────────────────────

/**
 * Default K applied when no 7-day evidence window has elapsed.
 *
 * Defined by FINDINGS §6 Q5 (user decision 5, 2026-04-26).
 */
export const DEFAULT_K = 3;

/**
 * Minimum evidence window (in days) before the measured K is trusted.
 *
 * Below this threshold, DEFAULT_K is used regardless of observed-K.
 */
export const MIN_EVIDENCE_DAYS = 7;

// ─── Core formula ─────────────────────────────────────────────────────────────

/**
 * Compute the Θ(K/ε³) multicalibration sample budget.
 *
 * Returns the minimum number of samples required so that a multicalibration
 * learner achieves calibration error ≤ ε across K marginal slices.
 *
 * @param K         — Number of calibration slices (axes).  Must be ≥ 1.
 * @param epsilon   — Calibration error tolerance.  Must be in (0, 1].
 * @param constant  — Multiplicative constant C in front of K/ε³.  Default 1.
 *
 * @returns Ceiling of C · K / ε³ (integer, ≥ 1).
 *
 * @throws {RangeError} if K < 1 or epsilon ≤ 0 or epsilon > 1.
 */
export function sampleBudget(K: number, epsilon: number, constant = 1): number {
  if (!Number.isFinite(K) || K < 1) {
    throw new RangeError(`K must be a finite number ≥ 1; got ${K}`);
  }
  if (!Number.isFinite(epsilon) || epsilon <= 0 || epsilon > 1) {
    throw new RangeError(`epsilon must be in (0, 1]; got ${epsilon}`);
  }
  if (!Number.isFinite(constant) || constant <= 0) {
    throw new RangeError(`constant must be a positive finite number; got ${constant}`);
  }

  return Math.ceil((constant * K) / (epsilon ** 3));
}

// ─── Evidence-driven K resolution ─────────────────────────────────────────────

/**
 * Parse the `evidence-window-days` and `observed-K` fields from the REPORT.md
 * frontmatter block.
 *
 * Frontmatter is the YAML-ish block between the opening `---` markers.
 * Returns `null` for either field if the field is absent or not parseable.
 */
export function parseReportFrontmatter(content: string): {
  observedK: number | null;
  evidenceWindowDays: number | null;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/m);
  if (!frontmatterMatch) {
    return { observedK: null, evidenceWindowDays: null };
  }
  const block = frontmatterMatch[1];

  const kMatch = block.match(/^observed-K:\s*(\d+)/m);
  const daysMatch = block.match(/^evidence-window-days:\s*([\d.]+)/m);

  return {
    observedK: kMatch ? parseInt(kMatch[1], 10) : null,
    evidenceWindowDays: daysMatch ? parseFloat(daysMatch[1]) : null,
  };
}

/**
 * Result of the K-resolution step.
 */
export interface KResolutionResult {
  /** The K value chosen (either measured or defaulted). */
  K: number;
  /** How K was chosen. */
  source: 'measured' | 'default-fallback';
  /** Human-readable explanation for audit purposes. */
  reason: string;
}

/**
 * Resolve the K value to use for the sample budget.
 *
 * Reads `reportContent` (the text of REPORT.md) and applies the calibration
 * protocol:
 *  - If observed-K is present AND evidence-window-days ≥ MIN_EVIDENCE_DAYS → use measured K.
 *  - Otherwise → use DEFAULT_K (= 3) and return a default-fallback result.
 *
 * @param reportContent — Raw text of the K-axis evidence REPORT.md.
 * @returns KResolutionResult describing the chosen K and its provenance.
 */
export function resolveK(reportContent: string): KResolutionResult {
  const { observedK, evidenceWindowDays } = parseReportFrontmatter(reportContent);

  const hasSufficientEvidence =
    observedK !== null &&
    evidenceWindowDays !== null &&
    evidenceWindowDays >= MIN_EVIDENCE_DAYS;

  if (hasSufficientEvidence && observedK !== null) {
    return {
      K: observedK,
      source: 'measured',
      reason: `observed-K=${observedK} from REPORT.md; evidence-window-days=${evidenceWindowDays} ≥ ${MIN_EVIDENCE_DAYS}`,
    };
  }

  const windowDesc =
    evidenceWindowDays !== null
      ? `evidence-window-days=${evidenceWindowDays} < ${MIN_EVIDENCE_DAYS}`
      : 'evidence-window-days absent (no observations yet)';

  return {
    K: DEFAULT_K,
    source: 'default-fallback',
    reason:
      `Phase 844 entered 2026-04-26; JP-010a telemetry started 2026-04-26 (same day); ` +
      `${windowDesc}; no 7-day evidence window elapsed; ` +
      `default K=${DEFAULT_K} applied per FINDINGS §6 Q5 user decision (2026-04-26 evidence-driven default-K fallback)`,
  };
}

// ─── High-level API ───────────────────────────────────────────────────────────

/**
 * Compute the sample budget from the K-axis evidence report file.
 *
 * Reads `reportPath`, resolves K via `resolveK`, then calls `sampleBudget`.
 * If the report file is absent or unreadable, falls back to DEFAULT_K.
 *
 * @param reportPath — Absolute path to the K-axis evidence REPORT.md.
 * @param epsilon    — Calibration error tolerance (default 0.1).
 * @param constant   — Multiplicative constant C (default 1).
 *
 * @returns Object with the computed budget, the resolved K, and resolution metadata.
 */
export async function computeSampleBudget(
  reportPath: string,
  epsilon = 0.1,
  constant = 1,
): Promise<{
  budget: number;
  resolution: KResolutionResult;
  epsilon: number;
  constant: number;
}> {
  let content = '';
  try {
    content = await fs.readFile(reportPath, 'utf8');
  } catch {
    // No report file yet — treat as absent evidence.
  }

  const resolution = resolveK(content);
  const budget = sampleBudget(resolution.K, epsilon, constant);

  return { budget, resolution, epsilon, constant };
}

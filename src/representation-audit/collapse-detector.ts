/**
 * MD-6 Representation Audit — Collapse Detector.
 *
 * Composes `effectiveRank` and `separability` into a single `AuditResult`
 * with a severity status.  This is the top-level diagnostic: callers obtain
 * one structured result and decide how to surface it.
 *
 * ## Status levels
 *
 *   OK        — all metrics within thresholds; no collapse detected.
 *   WARNING   — one metric near threshold (within 20%).
 *   CRITICAL  — at least one metric outside threshold:
 *               effectiveRankRatio < effectiveRankThreshold  OR
 *               separabilityRatio  ≥ separabilityRatioThreshold
 *   DISABLED  — feature flag is off; no computation was performed.
 *
 * ## LS-39 kernel-collapse fixture
 *
 * Healthy fixture: well-separated clusters, high effective-rank ratio → OK.
 * Collapsed fixture: most embeddings near origin (low column norms, high
 * cosine similarity across communities) → CRITICAL.
 *
 * @module representation-audit/collapse-detector
 */

import type { EffectiveRankResult } from './effective-rank.js';
import { effectiveRank } from './effective-rank.js';
import type { SeparabilityResult, CommunityMap, EmbeddingLookup } from './community-separability.js';
import { separability } from './community-separability.js';
import type { AuditSettings } from './settings.js';
import { DEFAULT_AUDIT_SETTINGS } from './settings.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuditStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'DISABLED';

export interface AuditResult {
  /** Severity level.  DISABLED when the feature flag is off. */
  readonly status: AuditStatus;
  /** Human-readable summary. */
  readonly summary: string;
  /** ISO 8601 timestamp of the audit run. */
  readonly timestamp: string;
  /** Effective-rank metrics.  Null when disabled or no matrix supplied. */
  readonly effectiveRankResult: EffectiveRankResult | null;
  /** Community separability metrics.  Null when disabled or no communities supplied. */
  readonly separabilityResult: SeparabilityResult | null;
  /** Thresholds used (copied from settings for traceability). */
  readonly thresholds: {
    readonly effectiveRankThreshold: number;
    readonly separabilityRatioThreshold: number;
  };
  /** Flags explaining the CRITICAL determination (empty when OK). */
  readonly criticalReasons: readonly string[];
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface DetectorInput {
  /**
   * Embedding / activation matrix.  Rows = sessions/observations,
   * columns = entities/features.  Pass `null` to skip effective-rank check.
   */
  matrix: readonly (readonly number[])[] | null;
  /**
   * Leiden community map (community-id → entity ids).
   * Pass `null` to skip separability check.
   */
  communities: CommunityMap | null;
  /**
   * Embedding lookup for separability computation.
   * Required when `communities` is non-null.
   */
  getEmbedding?: EmbeddingLookup;
  /**
   * Max entities per community for separability sampling.
   * Default 50.
   */
  maxSamplesPerBucket?: number;
}

// ─── Detector ────────────────────────────────────────────────────────────────

/**
 * Run the MD-6 collapse detector.
 *
 * When `settings.enabled === false` (default) the function returns immediately
 * with `status: 'DISABLED'` and performs no computation (SC-MD6-01).
 *
 * @param input    Data to audit.
 * @param settings Feature flag + thresholds (defaults applied by caller or here).
 */
export function detectCollapse(
  input: DetectorInput,
  settings: Partial<AuditSettings> = {},
): AuditResult {
  const cfg: AuditSettings = { ...DEFAULT_AUDIT_SETTINGS, ...settings };
  const ts = new Date().toISOString();

  // SC-MD6-01: default OFF.
  if (!cfg.enabled) {
    return {
      status: 'DISABLED',
      summary: 'Representation audit is disabled (set enabled: true to activate).',
      timestamp: ts,
      effectiveRankResult: null,
      separabilityResult: null,
      thresholds: {
        effectiveRankThreshold: cfg.effectiveRankThreshold,
        separabilityRatioThreshold: cfg.separabilityRatioThreshold,
      },
      criticalReasons: [],
    };
  }

  // Compute effective rank (if matrix supplied).
  let erResult: EffectiveRankResult | null = null;
  if (input.matrix !== null) {
    erResult = effectiveRank(input.matrix);
  }

  // Compute separability (if communities + embedding lookup supplied).
  let sepResult: SeparabilityResult | null = null;
  if (input.communities !== null && input.getEmbedding) {
    sepResult = separability(
      input.communities,
      input.getEmbedding,
      input.maxSamplesPerBucket ?? 50,
    );
  }

  // Determine status.
  const criticalReasons: string[] = [];

  if (erResult !== null) {
    if (erResult.ratio < cfg.effectiveRankThreshold) {
      criticalReasons.push(
        `Effective-rank ratio ${erResult.ratio.toFixed(4)} < threshold ${cfg.effectiveRankThreshold} ` +
        `(r_eff=${erResult.effectiveRank.toFixed(2)}, rank_nominal=${erResult.rankNominal}).`,
      );
    }
  }

  if (sepResult !== null) {
    // Collapse signal: ratio = within/between approaches 1.0 from below (within ≈ between).
    // Well-separated: ratio >> 1 (within >> between) — NOT a collapse signal.
    // Only flag when ratio is in [threshold, 1.0]: within is ≥ threshold fraction of between,
    // indicating communities are no longer meaningfully separated.
    if (sepResult.ratio >= cfg.separabilityRatioThreshold && sepResult.ratio <= 1.0) {
      criticalReasons.push(
        `Separability ratio ${sepResult.ratio.toFixed(4)} in collapse zone ` +
        `[${cfg.separabilityRatioThreshold}, 1.0] ` +
        `(within=${sepResult.within.toFixed(4)}, between=${sepResult.between.toFixed(4)}).`,
      );
    }
  }

  let status: AuditStatus;
  let summary: string;

  if (criticalReasons.length > 0) {
    status = 'CRITICAL';
    summary =
      `Kernel-machine collapse detected. ${criticalReasons.length} threshold(s) breached. ` +
      `MD-1 learned embeddings or schema expansion warranted.`;
  } else {
    // Check for WARNING: either metric within 20% of threshold.
    const warnReasons: string[] = [];

    if (erResult !== null) {
      const warnFloor = cfg.effectiveRankThreshold * 1.2; // 20% above threshold
      if (erResult.ratio < warnFloor) {
        warnReasons.push(
          `Effective-rank ratio ${erResult.ratio.toFixed(4)} within 20% of threshold ${cfg.effectiveRankThreshold}.`,
        );
      }
    }

    if (sepResult !== null) {
      // Same collapse-zone guard: only warn when ratio is in [warnCeil, 1.0].
      const warnCeil = cfg.separabilityRatioThreshold * 0.8; // 20% below threshold
      if (sepResult.ratio >= warnCeil && sepResult.ratio <= 1.0) {
        warnReasons.push(
          `Separability ratio ${sepResult.ratio.toFixed(4)} within 20% of threshold ${cfg.separabilityRatioThreshold}.`,
        );
      }
    }

    if (warnReasons.length > 0) {
      status = 'WARNING';
      summary = `Representation metrics approaching collapse thresholds. ${warnReasons.join(' ')}`;
    } else {
      status = 'OK';
      const parts: string[] = [];
      if (erResult !== null) {
        parts.push(`effective-rank ratio ${erResult.ratio.toFixed(4)}`);
      }
      if (sepResult !== null) {
        parts.push(`separability ratio ${sepResult.ratio.toFixed(4)}`);
      }
      summary = parts.length > 0
        ? `Representation audit passed. ${parts.join('; ')}.`
        : 'Representation audit passed (no metrics computed).';
    }
  }

  return {
    status,
    summary,
    timestamp: ts,
    effectiveRankResult: erResult,
    separabilityResult: sepResult,
    thresholds: {
      effectiveRankThreshold: cfg.effectiveRankThreshold,
      separabilityRatioThreshold: cfg.separabilityRatioThreshold,
    },
    criticalReasons,
  };
}

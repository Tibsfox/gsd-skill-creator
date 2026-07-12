/**
 * Telemetry-driven ADVISORY ROI gate on the mint/promote decision.
 *
 * The thermodynamic gate in `promotion-roi.ts` (`computeROI` / `shouldInstall`)
 * takes a `SkillCandidate` whose `estimatedUses`, `perUseSavingsBits`, and
 * `estimatedIK` were, until now, only ever fed by the BO-autotune harness with
 * hand-chosen constants. This module estimates those three quantities from
 * real usage telemetry instead — demand (sessions loaded), per-use value
 * (mean match score net of correction drag), and install friction (budget
 * skips) — and returns a transparent recommend / hold / abstain verdict with a
 * human-readable reason.
 *
 * ADVISORY, NOT A HARD BLOCK. The verdict is surfaced at the mint decision
 * (cartridge distill, discover) and formatted for the capcom gate, but it
 * never silently kills an artifact: a mis-estimated cost floor must not veto a
 * good skill. When telemetry is too thin to judge, the verdict is `abstain`.
 *
 * Pure module: no fs, no child_process. Only maps signals → SkillCandidate and
 * defers the decision arithmetic to `computeROI`.
 *
 * Reference: arXiv:2604.20897 §3 — deployment-horizon ROI. The Landauer /
 * thermodynamic framing stays advisory here per JP-005's "live gate" note.
 *
 * @module skill-promotion/telemetry-roi
 */

import { computeROI } from './promotion-roi.js';
import type { ROIBreakdown, SkillCandidate } from './types.js';
import type { SkillPatternEntry } from '../telemetry/types.js';
import type { RankedCandidate } from '../discovery/pattern-scorer.js';

// ─── Signals ────────────────────────────────────────────────────────────────

/**
 * Telemetry-derived usage signals for one artifact. All rate fields are in
 * [0, 1]; out-of-range values are clamped during derivation.
 */
export interface TelemetryUsageSignal {
  /** Distinct sessions in which the artifact was exercised — the demand proxy. */
  sessionCount: number;
  /** Fraction of sessions the artifact actually loaded (0-1). */
  loadRate: number;
  /** Mean relevance / match score (0-1) — the per-use value proxy. */
  avgScore: number;
  /** Fraction of uses that drew a user correction (0-1) — a value penalty. Default 0. */
  correctionRate?: number;
  /** Fraction of sessions dropped for budget (0-1) — install friction. Default 0. */
  budgetSkipRate?: number;
  /** Distinct projects the artifact spans — breadth. Default 1. */
  projectCount?: number;
}

/** Unit-scale knobs. These are units of measure, not the decision itself: the
 * recommendation moves with the telemetry ratios, not with these constants. */
export interface RoiAdvisoryConfig {
  /** Bits saved per use at a perfect (avgScore == 1) match. Default 12. */
  valueScaleBits?: number;
  /** Floor install cost, in bits, to encode any artifact. Default 8. */
  baseInstallCostBits?: number;
  /** Extra install cost per unit of budget-skip friction, in bits. Default 8. */
  frictionScaleBits?: number;
  /** Below this many observed sessions the verdict abstains (never holds). Default 3. */
  minSessionsForVerdict?: number;
}

const DEFAULTS: Required<RoiAdvisoryConfig> = {
  valueScaleBits: 12,
  baseInstallCostBits: 8,
  frictionScaleBits: 8,
  minSessionsForVerdict: 3,
};

// ─── Verdict ──────────────────────────────────────────────────────────────

export type RoiRecommendation = 'recommend' | 'hold' | 'abstain';

export interface RoiAdvisory {
  /** Artifact id the verdict is about. */
  readonly id: string;
  /** Transparent recommendation. `abstain` when telemetry is too thin to judge. */
  readonly recommendation: RoiRecommendation;
  /** Human-readable reason, safe to surface at the capcom gate. */
  readonly reason: string;
  /** The underlying thermodynamic ROI breakdown (advisory). */
  readonly roi: ROIBreakdown;
  /** The signal the verdict was derived from. */
  readonly signal: TelemetryUsageSignal;
  /** Always true — this verdict never hard-blocks a mint/promote decision. */
  readonly advisory: true;
}

// ─── Derivation ─────────────────────────────────────────────────────────────

function clampUnit(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

/**
 * Map telemetry signals onto the three `SkillCandidate` quantities the
 * thermodynamic gate consumes. This is the "value/cost from telemetry, not
 * constants" core:
 *
 *   estimatedUses      = demonstrated demand, weighted by how often it loads
 *   perUseSavingsBits  = relevance net of correction drag, scaled to bits
 *   estimatedIK        = encoding floor + budget-skip friction
 */
export function deriveCandidateFromSignal(
  id: string,
  signal: TelemetryUsageSignal,
  config: RoiAdvisoryConfig = {},
): SkillCandidate {
  const cfg = { ...DEFAULTS, ...config };
  const sessions = Math.max(0, signal.sessionCount);
  const loadRate = clampUnit(signal.loadRate);
  const avgScore = clampUnit(signal.avgScore);
  const correctionRate = clampUnit(signal.correctionRate ?? 0);
  const budgetSkipRate = clampUnit(signal.budgetSkipRate ?? 0);

  const estimatedUses = sessions * (0.5 + 0.5 * loadRate);
  const perUseSavingsBits = clampUnit(avgScore - correctionRate) * cfg.valueScaleBits;
  const estimatedIK = cfg.baseInstallCostBits + budgetSkipRate * cfg.frictionScaleBits;

  return { id, estimatedUses, perUseSavingsBits, estimatedIK };
}

/**
 * Produce a transparent advisory ROI verdict from telemetry-derived value vs
 * cost. Recommends only artifacts that pay for their tokens; holds those that
 * do not; abstains when telemetry is too thin to judge (so a thin-data floor
 * cannot silently veto a good skill).
 */
export function advisoryRoiVerdict(
  id: string,
  signal: TelemetryUsageSignal,
  config: RoiAdvisoryConfig = {},
): RoiAdvisory {
  const cfg = { ...DEFAULTS, ...config };
  const candidate = deriveCandidateFromSignal(id, signal, cfg);
  const roi = computeROI(candidate);

  if (signal.sessionCount < cfg.minSessionsForVerdict) {
    return {
      id,
      recommendation: 'abstain',
      reason:
        `abstain: only ${signal.sessionCount} observed session(s) ` +
        `(< ${cfg.minSessionsForVerdict}); insufficient telemetry to judge ROI — not blocking`,
      roi,
      signal,
      advisory: true,
    };
  }

  const recommendation: RoiRecommendation =
    roi.decision === 'install' ? 'recommend' : 'hold';
  return {
    id,
    recommendation,
    reason: formatReason(recommendation, roi),
    roi,
    signal,
    advisory: true,
  };
}

function formatReason(rec: RoiRecommendation, roi: ROIBreakdown): string {
  const uses = roi.candidate.estimatedUses;
  const perUse = roi.candidate.perUseSavingsBits;
  const cost = roi.candidate.estimatedIK;
  const margin = roi.marginBits;
  const head = rec === 'recommend' ? 'recommend' : 'hold';
  const verb =
    rec === 'recommend' ? 'pays for its tokens' : 'does not yet pay for its tokens';
  const signed = margin >= 0 ? `+${margin.toFixed(1)}` : margin.toFixed(1);
  return (
    `${head}: ${uses.toFixed(1)} use(s) × ${perUse.toFixed(1)} bits/use = ` +
    `${roi.payoffBits.toFixed(1)} bits payoff vs ${cost.toFixed(1)} bits install ` +
    `cost (margin ${signed} bits) — ${verb}`
  );
}

/** One-line rendering suitable for a capcom-gate `note`. */
export function formatRoiAdvisory(advisory: RoiAdvisory): string {
  return `ROI advisory [${advisory.recommendation}] ${advisory.id}: ${advisory.reason}`;
}

// ─── Signal adapters ──────────────────────────────────────────────────────

/**
 * Build a signal from a `UsagePatternDetector` per-skill entry. `correctionRate`
 * is not carried on the entry (it is computed against loads inside the
 * detector), so callers that have it can pass it in.
 */
export function signalFromPatternEntry(
  entry: SkillPatternEntry,
  opts: { correctionRate?: number } = {},
): TelemetryUsageSignal {
  return {
    sessionCount: entry.sessionCount,
    loadRate: entry.loadRate,
    avgScore: entry.avgScore,
    correctionRate: opts.correctionRate,
    budgetSkipRate: entry.budgetSkipRate,
  };
}

/**
 * Build a signal from a discovery `RankedCandidate`. Discovery candidates only
 * surface in sessions where the pattern recurred, so demonstrated recurrence
 * is treated as full load demand; the ranked score (0-1) is the value proxy.
 */
export function signalFromRankedCandidate(
  candidate: RankedCandidate,
): TelemetryUsageSignal {
  return {
    sessionCount: candidate.evidence.sessions.length,
    loadRate: 1,
    avgScore: clampUnit(candidate.score),
    projectCount: candidate.evidence.projects.length,
  };
}

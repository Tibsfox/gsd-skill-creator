/**
 * Intrinsic Telemetry — public API.
 *
 * Default-off module shipped by Phase 733 (v1.49.571 Heuristics-Free Skill Space).
 * Source: Balestriero & LeCun 2025, *LeJEPA* Figure 1 top-left / §6.2 — Spearman
 * ≈ 0.99 correlation between training loss and downstream accuracy, demonstrating
 * that a label-free internal signal can rank outcomes.
 *
 * Opt-in via `.claude/gsd-skill-creator.json`:
 *
 *     "heuristics-free-skill-space": {
 *       "intrinsic_telemetry": { "enabled": true }
 *     }
 *
 * Pure function: no I/O, no side effects, never bypasses CAPCOM.
 *
 * @module intrinsic-telemetry
 */

export type {
  TelemetrySample,
  SignalCorrelation,
  TelemetryReport,
} from './types.js';

export { CANDIDATE_SIGNALS } from './types.js';

export { pearson, spearman, rankWithTies } from './correlation.js';

export { correlateSignals, MIN_SAMPLES } from './telemetry.js';

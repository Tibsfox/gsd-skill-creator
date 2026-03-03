/**
 * health-diagnostician public API.
 *
 * Phase 45 surface — grows as plans complete:
 *  Plan 45-01: types + ecosystem thresholds + classifier (below)
 *  Plan 45-02: python-compat-matrix
 *  Plan 45-03: conflict-detector
 *  Plan 45-04: severity-scorer + DiagnosticsOrchestrator
 */

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  HealthClassification,
  SeverityLevel,
  EcosystemThresholds,
  DiagnosisResult,
  DiagnosisReport,
} from './types.js';

// ─── Ecosystem Thresholds ─────────────────────────────────────────────────────
export { ECOSYSTEM_THRESHOLDS, getThresholds } from './ecosystem-thresholds.js';

// ─── Classifier ───────────────────────────────────────────────────────────────
export { Classifier, classifySignal } from './classifier.js';

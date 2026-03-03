/**
 * health-diagnostician public API — complete Phase 45 surface.
 *
 *  Plan 45-01: types + ecosystem thresholds + classifier
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
  CompatMatrixResult,
  ConflictFinding,
} from './types.js';

// ─── Ecosystem Thresholds ─────────────────────────────────────────────────────
export { ECOSYSTEM_THRESHOLDS, getThresholds } from './ecosystem-thresholds.js';

// ─── Classifier ───────────────────────────────────────────────────────────────
export { Classifier, classifySignal } from './classifier.js';

// ─── Python Compat Matrix ─────────────────────────────────────────────────────
export { PythonCompatMatrix, buildCompatMatrix } from './python-compat-matrix.js';

// ─── Conflict Detector ────────────────────────────────────────────────────────
export { ConflictDetector, detectConflicts } from './conflict-detector.js';

// ─── Severity Scorer ──────────────────────────────────────────────────────────
export { SeverityScorer, scoreSignal } from './severity-scorer.js';

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export { DiagnosticsOrchestrator } from './diagnostics-orchestrator.js';

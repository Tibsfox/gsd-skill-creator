/**
 * Passive monitoring module -- barrel exports.
 *
 * Public API for the monitoring subsystem. Consumers should import
 * from this module rather than reaching into individual files.
 *
 * @module integration/monitoring
 */

// Types
export type {
  ScanObservation,
  PlanSummaryDiff,
  StateTransition,
  RoadmapDiff,
  ParsedPlan,
  ParsedSummary,
  ScanState,
} from './types.js';

// Observation writer (MON-04)
export { appendScanObservation } from './observation-writer.js';

// Plan-vs-summary differ (MON-01)
export { diffPlanVsSummary, parsePlanContent, parseSummaryContent } from './plan-summary-differ.js';

// STATE.md transition detector (MON-02)
export { detectStateTransitions, parseStateMd } from './state-transition-detector.js';

// ROADMAP.md structural differ (MON-05)
export { diffRoadmap, parseRoadmapPhases } from './roadmap-differ.js';

// Scan orchestrator (MON-03 entry point)
export { runScan } from './scanner.js';
export type { ScanResult, ScanOptions } from './scanner.js';

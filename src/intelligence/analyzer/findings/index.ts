/**
 * C03 — Finding engine barrel export.
 */

export { FindingEngine } from './aggregator.js';
export type {
  ChurnData,
  StagingState,
  PreviousSnapshotData,
  AggregatorInput,
  ProjectMetrics,
  FindingEngineResult,
  RawFinding,
} from './aggregator.js';
export { detectDeadCode } from './dead-code.js';
export { detectHotSpots } from './hot-spots.js';
export { detectCouplingSpikes } from './coupling.js';
export { detectComplexityOutliers } from './complexity.js';
export { detectChurnOutliers } from './churn.js';
export { detectOrphanDrafts } from './orphans.js';
export { detectStalledMissions } from './stalled.js';

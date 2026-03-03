// Phase 49: Integration + Health Log + Pattern Learning — Public API
export type {
  HealthEvent,
  EventType,
  HealthGateResult,
  GateDecision,
  PatternMatch,
  IntegrationConfig,
} from './types.js';
export {
  HealthEventWriter,
  writeEvent,
  readEvents,
  buildHealthEvent,
} from './health-event-writer.js';
export type { WriteEventInput } from './health-event-writer.js';
export {
  StagingHealthGate,
  checkHealthGate,
} from './staging-health-gate.js';
export type { GateCheckInput } from './staging-health-gate.js';
export {
  PatternLearner,
  detectPatterns,
  getPackageWarning,
} from './pattern-learner.js';
export { IntegrationOrchestrator } from './integration-orchestrator.js';

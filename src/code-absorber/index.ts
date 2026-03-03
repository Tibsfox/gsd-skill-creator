// Phase 48: Code Absorber — Public API
export type {
  AbsorptionCandidate,
  CriteriaVerdict,
  CriteriaStatus,
  OracleTestResult,
  CallSiteCycle,
  AbsorptionRecord,
} from './types.js';
export {
  AbsorptionCriteriaGate,
  checkCriteria,
  isHardBlocked,
} from './absorption-criteria-gate.js';
export {
  OracleVerifier,
  runOracleVerification,
} from './oracle-verifier.js';
export type { OracleTestCase, OracleRunConfig } from './oracle-verifier.js';
export {
  CallSiteReplacer,
  planReplacementCycles,
  executeReplacementCycles,
} from './call-site-replacer.js';
export type {
  CallSiteRecord,
  ReplacementCycleInput,
  ReplacementPlan,
} from './call-site-replacer.js';
export {
  InternalizationRegistry,
  appendRecord,
  readAllRecords,
  computeObservationStatus,
} from './internalization-registry.js';
export { AbsorberOrchestrator } from './absorber-orchestrator.js';
export type {
  AbsorptionRequest,
  AbsorptionOutcome,
  AbsorptionStatus,
} from './absorber-orchestrator.js';

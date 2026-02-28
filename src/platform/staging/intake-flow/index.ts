/**
 * Smart intake flow module.
 *
 * Public API for document intake routing. Provides clarity assessment
 * (three-path routing: clear/gaps/confused), step tracking for crash
 * recovery, and the full intake flow orchestrator with "anything else?"
 * confirmation support.
 *
 * @module staging/intake-flow
 */

// Types (type-only exports)
export type { ClarityRoute, ClarityAssessment, GapDetail } from './types.js';
export type { IntakeFlowStep, IntakeFlowState } from './step-types.js';
export type { IntakeFlowResult, IntakeDependencies } from './orchestrator.js';

// Constants
export { CLARITY_ROUTES } from './types.js';
export { INTAKE_FLOW_STEPS } from './step-types.js';

// Clarity assessment
export { assessClarity } from './clarity-assessor.js';

// Step tracking (crash recovery)
export { recordStep, getResumePoint, readFlowState } from './step-tracker.js';

// Orchestrator
export { runIntakeFlow, confirmIntake, resumeIntakeFlow } from './orchestrator.js';

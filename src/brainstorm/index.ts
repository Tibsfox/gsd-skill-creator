/**
 * Brainstorm module barrel export.
 *
 * Single public entry point for the entire brainstorm session support system.
 * Re-exports all public types, classes, and utilities organized by layer:
 * shared types -> core modules -> techniques -> pathways -> artifacts -> agents.
 *
 * This barrel MUST NOT import from den/, vtm/, or knowledge/.
 */

// ============================================================================
// Shared types and schemas (the foundation)
// ============================================================================

export * from './shared/types.js';
export {
  brainstormMessageFilename,
  resetBrainstormCounter,
  initBrainstormSession,
  parseIdeasJsonl,
  parseQuestionsJsonl,
} from './shared/schemas.js';
export * from './shared/constants.js';

// ============================================================================
// Core modules
// ============================================================================

export { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from './core/rules-engine.js';
export type { IRulesEngine, RuleViolation, RulesEngineConfig } from './core/rules-engine.js';
export { SessionManager, SessionManagerError } from './core/session-manager.js';
export type { ISessionManager, SessionManagerErrorCode } from './core/session-manager.js';
export { PhaseController } from './core/phase-controller.js';
export type {
  IPhaseController,
  PhaseTransitionResult,
  AgentActivationResult,
  TechniqueTransition,
} from './core/phase-controller.js';

// ============================================================================
// Technique engine
// ============================================================================

export { TechniqueEngine } from './techniques/engine.js';
export type { TechniqueInstance, TechniqueOutput } from './techniques/engine.js';

// ============================================================================
// Pathway router
// ============================================================================

export { PathwayRouter } from './pathways/router.js';
export type { IPathwayRouter, AdaptationSignal } from './pathways/router.js';

// ============================================================================
// Artifact generator
// ============================================================================

export { ArtifactGenerator } from './artifacts/generator.js';

// ============================================================================
// Agents
// ============================================================================

export { TechniqueAgent } from './agents/base.js';
export type { AgentMessage, CaptureLoopMessage } from './agents/base.js';
export { FacilitatorAgent } from './agents/facilitator.js';
export type {
  ProblemAssessment,
  TransitionSignal,
  FacilitatorGuidance,
} from './agents/facilitator.js';
export { Ideator } from './agents/ideator.js';
export { Questioner } from './agents/questioner.js';
export { Analyst } from './agents/analyst.js';
export { Mapper } from './agents/mapper.js';
export { Persona } from './agents/persona.js';
export { Critic } from './agents/critic.js';
export { Scribe } from './agents/scribe.js';

// ============================================================================
// Integration (added by Plan 311-01)
// ============================================================================
export { SessionBus } from './integration/session-bus.js';
export type { SessionBusConfig } from './integration/session-bus.js';

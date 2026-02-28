/**
 * Barrel exports for the GL-1 (Governance Layer) module.
 *
 * GL-1 provides governance charter, weighting algorithm documentation,
 * dispute resolution, rules engine, decision logging, and policy query
 * handling for the AMIGA Governance Layer.
 *
 * Modules:
 * - Charter: Machine-readable commons charter with constitutional constraints (Phase 211)
 * - Weighting Docs: Algorithm parameter documentation with rationale and ranges (Phase 211)
 * - Dispute Record: Governance-layer dispute lifecycle extending ICD-04 (Phase 211)
 * - Rules Engine: Distribution plan evaluation against charter constraints (Phase 212)
 * - Decision Log: Append-only governance evaluation log with queries (Phase 212)
 * - Policy Query: ICD-03 governance query handler for all 4 query types (Phase 212)
 */

// Charter schemas, types, constants, and functions
export {
  CharterSchema,
  CharterClauseSchema,
  ConstitutionalConstraintSchema,
  CharterVersionSchema,
  CONSTITUTIONAL_CONSTRAINT_IDS,
  COMMONS_CHARTER_YAML,
  parseCharter,
  ratifyCharter,
  isRatified,
} from './charter.js';
export type { Charter, CharterClause, ConstitutionalConstraint } from './charter.js';

// Weighting algorithm documentation
export {
  WeightingParameterSchema,
  WeightingSpecSchema,
  WEIGHTING_SPEC_YAML,
  parseWeightingSpec,
  validateParameterRange,
} from './weighting-docs.js';
export type { WeightingParameter, WeightingSpec } from './weighting-docs.js';

// Dispute record format
export {
  GovernanceDisputeSchema,
  createDispute,
  resolveDispute,
  rejectDispute,
} from './dispute-record.js';
export type { GovernanceDispute } from './dispute-record.js';

// Rules engine (Phase 212)
export {
  RulesEngine,
  DistributionPlanSchema,
  EvaluationResultSchema,
  ReasoningStepSchema,
  VERDICT,
} from './rules-engine.js';
export type { DistributionPlan, EvaluationResult, ReasoningStep } from './rules-engine.js';

// Decision log (Phase 212)
export {
  DecisionLog,
  DecisionEntrySchema,
} from './decision-log.js';
export type { DecisionEntry } from './decision-log.js';

// Policy query handler (Phase 212)
export {
  PolicyQueryHandler,
  handleGovernanceQuery,
} from './policy-query.js';

/**
 * Barrel exports for the GL-1 (Governance Layer) module.
 *
 * GL-1 provides governance charter, weighting algorithm documentation,
 * and dispute resolution for the AMIGA Governance Layer.
 *
 * Modules:
 * - Charter: Machine-readable commons charter with constitutional constraints
 * - Weighting Docs: Algorithm parameter documentation with rationale and ranges
 * - Dispute Record: Governance-layer dispute lifecycle extending ICD-04
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

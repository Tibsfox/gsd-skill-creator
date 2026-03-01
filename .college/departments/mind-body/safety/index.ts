/**
 * Physical Safety module for the Mind-Body department.
 *
 * Provides safety enforcement for movement-based practices with three modes:
 * - Annotate: alignment cues, injury risks, warm-up reminders
 * - Gate: medical condition contraindication checking
 * - Redirect: absolute partner-technique boundary
 *
 * Plus evidence citation validation for all health claims.
 *
 * @module departments/mind-body/safety
 */

// Main warden
export { PhysicalSafetyWarden } from './physical-safety-warden.js';
export type {
  MovementContext,
  SafetyAnnotation,
  AnnotatedContent,
  GateResult,
  RedirectResult,
  ClaimCheck,
} from './physical-safety-warden.js';

// Medical conditions
export {
  medicalConditions,
  getConditionModifications,
  isContraindicated,
} from './medical-conditions.js';
export type { MedicalCondition, Modification } from './medical-conditions.js';

// Partner boundary
export {
  isPartnerTechniqueRequest,
  getRedirectResponse,
  getSchoolFindingAdvice,
} from './partner-boundary.js';

// Evidence citations
export {
  evidenceDatabase,
  validateClaim,
  findClaimCategory,
} from './evidence-citations.js';
export type { EvidenceCitation, ClaimCategory, ClaimValidation } from './evidence-citations.js';

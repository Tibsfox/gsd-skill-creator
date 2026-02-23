/**
 * Zod runtime validation schemas for all OpenStack and NASA SE types.
 *
 * Provides Zod schemas matching each interface in `src/types/openstack.ts`
 * with descriptive error messages, safeParse wrappers, and both throwing
 * and non-throwing validator functions.
 *
 * Follows the existing project validation pattern from `skill-validation.ts`.
 *
 * @module validation/openstack-validation
 */

import { z } from 'zod';
import type {
  OpenStackService,
  Requirement,
  Runbook,
  NASASEPhase,
  CommunicationLoop,
  ProcedureStep,
} from '../types/openstack.js';

// ============================================================================
// Enum/Type Schemas
// ============================================================================

/** Schema for ServiceStatus type. */
const ServiceStatusSchema = z.enum(
  ['active', 'inactive', 'error', 'maintenance', 'unknown'],
  { error: () => 'Service status must be one of: active, inactive, error, maintenance, unknown' },
);

/** Schema for OpenStack service names (8 core + kolla-ansible). */
const OpenStackServiceNameSchema = z.enum(
  ['keystone', 'nova', 'neutron', 'cinder', 'glance', 'swift', 'heat', 'horizon', 'kolla-ansible'],
  { error: () => 'Service name must be a valid OpenStack service or kolla-ansible' },
);

/** Schema for endpoint interface visibility. */
const EndpointInterfaceSchema = z.enum(
  ['public', 'internal', 'admin'],
  { error: () => 'Endpoint interface must be one of: public, internal, admin' },
);

/** Schema for verification methods (NASA TAID). */
const VerificationMethodSchema = z.enum(
  ['test', 'analysis', 'inspection', 'demonstration'],
  { error: () => 'Verification method must be one of: test, analysis, inspection, demonstration' },
);

/** Schema for requirement verification status. */
const RequirementStatusSchema = z.enum(
  ['pending', 'pass', 'fail'],
  { error: () => 'Requirement status must be one of: pending, pass, fail' },
);

/** Schema for communication loop direction. */
const LoopDirectionSchema = z.enum(
  ['bidirectional', 'unidirectional'],
  { error: () => 'Loop direction must be either bidirectional or unidirectional' },
);

/** Schema for NASA SE phase identifiers. */
const SEPhaseIdSchema = z.enum(
  ['pre-a', 'a', 'b', 'c', 'd', 'e', 'f'],
  { error: () => 'SE phase must be one of: pre-a, a, b, c, d, e, f' },
);

/** Schema for NASA review gate abbreviations. */
const NASAReviewGateSchema = z.enum(
  ['MCR', 'SRR', 'SDR', 'PDR', 'CDR', 'SIR', 'ORR', 'FRR', 'PLAR', 'DR'],
  { error: () => 'Review gate must be a valid NASA review abbreviation (MCR, SRR, SDR, PDR, CDR, SIR, ORR, FRR, PLAR, DR)' },
);

/** Schema for communication loop names. */
const CommunicationLoopNameSchema = z.enum(
  ['command', 'execution', 'specialist', 'user', 'observation', 'health', 'budget', 'cloud-ops', 'doc-sync'],
  { error: () => 'Loop name must be one of: command, execution, specialist, user, observation, health, budget, cloud-ops, doc-sync' },
);

/** Schema for runbook verification method. */
const RunbookVerificationMethodSchema = z.enum(
  ['automated', 'manual'],
  { error: () => 'Runbook verification method must be either automated or manual' },
);

// ============================================================================
// Core Object Schemas
// ============================================================================

/**
 * Zod schema for ServiceEndpoint interface.
 * Validates URL format, endpoint interface, and region.
 */
export const ServiceEndpointSchema = z.object({
  url: z.string({ error: () => 'Endpoint URL is required' }).url('Endpoint URL must be a valid URL'),
  interface: EndpointInterfaceSchema,
  region: z.string({ error: () => 'Region is required' }).min(1, 'Region must not be empty'),
});

/**
 * Zod schema for HealthResult interface.
 * Validates health status, message, timestamp, and optional details.
 */
export const HealthResultSchema = z.object({
  healthy: z.boolean({ error: () => 'Healthy must be a boolean' }),
  message: z.string({ error: () => 'Message is required' }),
  timestamp: z.string({ error: () => 'Timestamp is required' }).datetime('Timestamp must be a valid ISO 8601 date string'),
  details: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Zod schema for ProcedureStep interface.
 * Validates step number, instruction, expected result, and optional contingency.
 */
export const ProcedureStepSchema = z.object({
  stepNumber: z.number({ error: () => 'Step number is required' }).int('Step number must be an integer').positive('Step number must be positive'),
  instruction: z.string({ error: () => 'Instruction is required' }).min(1, 'Instruction must not be empty'),
  expectedResult: z.string({ error: () => 'Expected result is required' }).min(1, 'Expected result must not be empty'),
  ifUnexpected: z.string().optional(),
});

/**
 * Zod schema for OpenStackService interface.
 *
 * Note: The healthCheck function is excluded from Zod validation because
 * functions cannot be serialized to/from JSON. The healthCheck property
 * is only available on runtime OpenStackService objects, not in serialized
 * representations.
 */
export const OpenStackServiceSchema = z.object({
  name: OpenStackServiceNameSchema,
  status: ServiceStatusSchema,
  endpoints: z.array(ServiceEndpointSchema),
  // healthCheck is a function -- cannot be validated by Zod (runtime-only)
  requirements: z.array(z.lazy(() => RequirementSchema)),
});

/**
 * Zod schema for Requirement interface.
 * Validates ID pattern (CLOUD-{DOMAIN}-{NNN}), text, source, and verification fields.
 */
export const RequirementSchema = z.object({
  id: z.string({ error: () => 'Requirement ID is required' }).regex(
    /^CLOUD-[A-Z]+-\d{3}$/,
    'Requirement ID must match pattern CLOUD-{DOMAIN}-{NNN} (e.g., CLOUD-COMPUTE-001)',
  ),
  text: z.string({ error: () => 'Requirement text is required' }).min(1, 'Requirement text must not be empty'),
  source: z.string({ error: () => 'Source is required' }),
  verificationMethod: VerificationMethodSchema,
  status: RequirementStatusSchema,
  verifiedDate: z.string().optional(),
  verifiedBy: z.string().optional(),
});

/**
 * Zod schema for Runbook interface.
 * Validates ID pattern (RB-{SERVICE}-{NNN}), all procedure fields, and cross-references.
 */
export const RunbookSchema = z.object({
  id: z.string({ error: () => 'Runbook ID is required' }).regex(
    /^RB-[A-Z]+-\d{3}$/,
    'Runbook ID must match pattern RB-{SERVICE}-{NNN} (e.g., RB-NOVA-001)',
  ),
  title: z.string({ error: () => 'Title is required' }).min(1, 'Title must not be empty'),
  sePhaseRef: z.string({ error: () => 'SE phase reference is required' }),
  lastVerified: z.string({ error: () => 'Last verified date is required' }),
  verificationMethod: RunbookVerificationMethodSchema,
  preconditions: z.array(z.string()),
  steps: z.array(ProcedureStepSchema),
  verification: z.array(z.string()),
  rollback: z.array(z.string()),
  relatedRunbooks: z.array(z.string()),
});

/**
 * Zod schema for NASASEPhase interface.
 * Validates phase ID, SP-6105 and NPR 7123.1 cross-references, and review gate.
 */
export const NASASEPhaseSchema = z.object({
  phase: SEPhaseIdSchema,
  name: z.string({ error: () => 'Phase name is required' }).min(1, 'Phase name must not be empty'),
  spReference: z.string({ error: () => 'SP reference is required' }).startsWith(
    'SP-6105',
    'SP reference must start with SP-6105',
  ),
  nprReference: z.string({ error: () => 'NPR reference is required' }).startsWith(
    'NPR 7123.1',
    'NPR reference must start with NPR 7123.1',
  ),
  cloudOpsEquivalent: z.string({ error: () => 'Cloud ops equivalent is required' }),
  deliverables: z.array(z.string()),
  reviewGate: NASAReviewGateSchema,
});

/**
 * Zod schema for CommunicationLoop interface.
 * Validates loop name, participants, priority range (0-7), direction, and message types.
 */
export const CommunicationLoopSchema = z.object({
  name: CommunicationLoopNameSchema,
  participants: z.array(z.string()).min(1, 'Participants array must not be empty'),
  priority: z.number({ error: () => 'Priority is required' }).int('Priority must be an integer').min(0, 'Priority must be 0 or higher').max(7, 'Priority must be 7 or lower'),
  direction: LoopDirectionSchema,
  messageTypes: z.array(z.string()).min(1, 'Message types array must not be empty'),
  description: z.string({ error: () => 'Description is required' }).min(1, 'Description must not be empty'),
});

// ============================================================================
// Throwing Validator Functions
// ============================================================================

/**
 * Validate data as an OpenStackService. Throws on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated OpenStackService (without healthCheck)
 * @throws Error with descriptive message if validation fails
 */
export function validateOpenStackService(data: unknown): Omit<OpenStackService, 'healthCheck'> {
  const result = OpenStackServiceSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid OpenStack service: ${errors}`);
  }
  return result.data;
}

/**
 * Validate data as a Requirement. Throws on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated Requirement
 * @throws Error with descriptive message if validation fails
 */
export function validateRequirement(data: unknown): Requirement {
  const result = RequirementSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid requirement: ${errors}`);
  }
  return result.data;
}

/**
 * Validate data as a Runbook. Throws on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated Runbook
 * @throws Error with descriptive message if validation fails
 */
export function validateRunbook(data: unknown): Runbook {
  const result = RunbookSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid runbook: ${errors}`);
  }
  return result.data;
}

/**
 * Validate data as a NASASEPhase. Throws on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated NASASEPhase
 * @throws Error with descriptive message if validation fails
 */
export function validateNASASEPhase(data: unknown): NASASEPhase {
  const result = NASASEPhaseSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid NASA SE phase: ${errors}`);
  }
  return result.data;
}

/**
 * Validate data as a CommunicationLoop. Throws on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated CommunicationLoop
 * @throws Error with descriptive message if validation fails
 */
export function validateCommunicationLoop(data: unknown): CommunicationLoop {
  const result = CommunicationLoopSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid communication loop: ${errors}`);
  }
  // Zod validates priority is 0-7 integer; cast to LoopPriority since
  // Zod infers number but we have already validated the range constraint.
  return result.data as unknown as CommunicationLoop;
}

/**
 * Validate data as a ProcedureStep. Throws on invalid input.
 *
 * @param data - Unknown data to validate
 * @returns Validated ProcedureStep
 * @throws Error with descriptive message if validation fails
 */
export function validateProcedureStep(data: unknown): ProcedureStep {
  const result = ProcedureStepSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid procedure step: ${errors}`);
  }
  return result.data;
}

// ============================================================================
// Safe (Non-throwing) Validator Functions
// ============================================================================

/** Result of a safe validation call. */
export interface SafeValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Safely validate data as an OpenStackService. Does not throw.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error strings
 */
export function safeValidateOpenStackService(data: unknown): SafeValidationResult<Omit<OpenStackService, 'healthCheck'>> {
  const result = OpenStackServiceSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

/**
 * Safely validate data as a Requirement. Does not throw.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error strings
 */
export function safeValidateRequirement(data: unknown): SafeValidationResult<Requirement> {
  const result = RequirementSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

/**
 * Safely validate data as a Runbook. Does not throw.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error strings
 */
export function safeValidateRunbook(data: unknown): SafeValidationResult<Runbook> {
  const result = RunbookSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

/**
 * Safely validate data as a NASASEPhase. Does not throw.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error strings
 */
export function safeValidateNASASEPhase(data: unknown): SafeValidationResult<NASASEPhase> {
  const result = NASASEPhaseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

/**
 * Safely validate data as a CommunicationLoop. Does not throw.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error strings
 */
export function safeValidateCommunicationLoop(data: unknown): SafeValidationResult<CommunicationLoop> {
  const result = CommunicationLoopSchema.safeParse(data);
  if (result.success) {
    // Zod validates priority is 0-7 integer; cast to CommunicationLoop
    return { success: true, data: result.data as unknown as CommunicationLoop };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

/**
 * Safely validate data as a ProcedureStep. Does not throw.
 *
 * @param data - Unknown data to validate
 * @returns Validation result with typed data or error strings
 */
export function safeValidateProcedureStep(data: unknown): SafeValidationResult<ProcedureStep> {
  const result = ProcedureStepSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

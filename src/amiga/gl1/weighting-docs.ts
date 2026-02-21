/**
 * Weighting algorithm parameter documentation schema.
 *
 * Provides a Zod-validated specification for the three core weighting
 * parameters (frequency, critical_path, depth_decay) used to calculate
 * contributor attribution weights (GOVR-06).
 *
 * Each parameter includes:
 * - Rationale (why the parameter exists)
 * - Valid range (min_value, max_value)
 * - Adjustment process (how to change the parameter)
 */

import { z } from 'zod';
import yaml from 'js-yaml';
import { TimestampSchema } from '../types.js';

// ============================================================================
// WeightingParameterSchema
// ============================================================================

/** The 3 required weighting parameter types. */
const REQUIRED_PARAM_TYPES = ['frequency', 'critical_path', 'depth_decay'] as const;

/**
 * Validates an individual weighting algorithm parameter.
 *
 * Enforces:
 * - min_value <= max_value
 * - default_value within [min_value, max_value]
 */
export const WeightingParameterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(REQUIRED_PARAM_TYPES),
  default_value: z.number(),
  min_value: z.number(),
  max_value: z.number(),
  unit: z.string().min(1),
  adjustment_process: z.string().min(1),
}).passthrough().refine(
  (p) => p.min_value <= p.max_value,
  { message: 'min_value must be <= max_value' },
).refine(
  (p) => p.default_value >= p.min_value && p.default_value <= p.max_value,
  { message: 'default_value must be within [min_value, max_value] range' },
);

export type WeightingParameter = z.infer<typeof WeightingParameterSchema>;

// ============================================================================
// WeightingSpecSchema
// ============================================================================

/**
 * Validates the full weighting algorithm specification document.
 *
 * Enforces:
 * - At least 3 parameters
 * - All 3 required parameter types present (frequency, critical_path, depth_decay)
 */
export const WeightingSpecSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semantic version format'),
  title: z.string().min(1),
  overview: z.string().min(1),
  parameters: z.array(WeightingParameterSchema).min(3),
  normalization: z.string().min(1),
  audit_trail: z.string().min(1),
  last_updated: TimestampSchema,
}).passthrough().refine(
  (spec) => {
    const types = new Set(spec.parameters.map((p) => p.type));
    return REQUIRED_PARAM_TYPES.every((t) => types.has(t));
  },
  { message: 'Spec must include all 3 required parameter types: frequency, critical_path, depth_decay' },
);

export type WeightingSpec = z.infer<typeof WeightingSpecSchema>;

// ============================================================================
// WEIGHTING_SPEC_YAML
// ============================================================================

/**
 * Default weighting algorithm specification in YAML format.
 *
 * Documents the three core parameters with rationale, valid ranges,
 * and documented adjustment process (GOVR-06).
 */
export const WEIGHTING_SPEC_YAML = `
version: "1.0.0"
title: "AMIGA Weighting Algorithm Specification"
overview: >
  The AMIGA weighting algorithm computes contributor attribution weights
  using three core parameters: frequency (how often work is invoked),
  critical_path (whether work sits on the critical dependency path),
  and depth_decay (how weight diminishes through transitive chains).
  These parameters are combined into a weight vector per contributor
  per mission, then normalized to sum to 1.0.

parameters:
  - name: "frequency"
    description: >
      Measures how often a contributor's work is invoked across the commons.
      Frequent use indicates ongoing value -- code that is called many times
      per mission cycle provides continuous utility and deserves proportional
      recognition. This parameter captures runtime usage patterns.
    type: "frequency"
    default_value: 0.40
    min_value: 0.0
    max_value: 1.0
    unit: "weight"
    adjustment_process: >
      Governance vote with GL-1 review. A proposal to change the frequency
      weight must include evidence of how current weighting misrepresents
      actual invocation patterns. GL-1 reviews the evidence and the
      governance body votes on the change.

  - name: "critical_path"
    description: >
      Measures whether the contribution sits on the critical dependency path
      of the project. Critical-path work blocks other contributors and
      downstream modules -- without it, nothing else can proceed. This
      parameter ensures that foundational, blocking work receives higher
      weight than optional or peripheral contributions.
    type: "critical_path"
    default_value: 0.35
    min_value: 0.0
    max_value: 1.0
    unit: "weight"
    adjustment_process: >
      Requires a formal dispute with evidence showing that the current
      path analysis is incorrect. The dispute must include dependency
      graph data demonstrating the actual critical path. GL-1 reviews
      the path analysis evidence before any adjustment.

  - name: "depth_decay"
    description: >
      Exponential decay factor controlling how contribution weight diminishes
      through transitive dependency chains. Direct contributions matter more
      than contributions reached through several levels of indirection.
      A depth_decay of 0.25 means each additional layer of transitivity
      reduces weight by 75%.
    type: "depth_decay"
    default_value: 0.25
    min_value: 0.0
    max_value: 1.0
    unit: "factor"
    adjustment_process: >
      Parameter change requires a full impact analysis on all existing
      weight vectors. Because depth_decay affects every contributor's
      transitive weights, changes must be modeled before application.
      GL-1 must approve the impact analysis before the adjustment
      takes effect.

normalization: >
  All parameter weights are normalized to sum to 1.0 per mission.
  After computing raw weights for each contributor using the three
  parameters, the vector is L1-normalized so that the total
  attribution across all contributors equals exactly 1.0.

audit_trail: >
  Every weight calculation is logged with: input parameters (frequency
  count, critical path membership, dependency depth), intermediate
  values (raw weights before normalization), and final weight vector.
  Logs are immutable and retained for the lifetime of the mission
  for auditability and dispute resolution.

last_updated: "2026-01-01T00:00:00Z"
`.trim();

// ============================================================================
// parseWeightingSpec
// ============================================================================

/**
 * Parses a YAML string into a validated WeightingSpec object.
 *
 * @param yamlStr - YAML string containing a weighting specification
 * @returns Validated WeightingSpec object
 * @throws On malformed YAML or Zod validation failure
 */
export function parseWeightingSpec(yamlStr: string): WeightingSpec {
  const raw = yaml.load(yamlStr);
  return WeightingSpecSchema.parse(raw);
}

// ============================================================================
// validateParameterRange
// ============================================================================

/**
 * Validates a parameter value against its defined range.
 *
 * @param paramName - Name of the parameter to validate
 * @param value - Value to check
 * @param spec - Weighting specification containing parameter definitions
 * @returns Validation result with optional reason on failure
 */
export function validateParameterRange(
  paramName: string,
  value: number,
  spec: WeightingSpec,
): { valid: boolean; reason?: string } {
  const param = spec.parameters.find((p) => p.name === paramName);

  if (!param) {
    return { valid: false, reason: `Unknown parameter: ${paramName}` };
  }

  if (value < param.min_value || value > param.max_value) {
    return {
      valid: false,
      reason: `Value ${value} is outside valid range [${param.min_value}, ${param.max_value}] for parameter ${paramName}`,
    };
  }

  return { valid: true };
}

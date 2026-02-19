/**
 * TDD tests for weighting algorithm parameter documentation schema
 * and runtime parameter range validation.
 */

import { describe, it, expect } from 'vitest';
import {
  WeightingParameterSchema,
  WeightingSpecSchema,
  WEIGHTING_SPEC_YAML,
  parseWeightingSpec,
  validateParameterRange,
} from '../weighting-docs.js';

// ============================================================================
// WeightingParameterSchema
// ============================================================================

describe('WeightingParameterSchema', () => {
  const makeValidParam = () => ({
    name: 'frequency',
    description: 'How often a contributor\'s work is invoked across the commons.',
    type: 'frequency' as const,
    default_value: 0.40,
    min_value: 0.0,
    max_value: 1.0,
    unit: 'weight',
    adjustment_process: 'Governance vote with GL-1 review.',
  });

  it('accepts a valid parameter with all required fields', () => {
    const result = WeightingParameterSchema.safeParse(makeValidParam());
    expect(result.success).toBe(true);
  });

  it('rejects a parameter where min_value > max_value', () => {
    const param = makeValidParam();
    param.min_value = 1.0;
    param.max_value = 0.0;
    const result = WeightingParameterSchema.safeParse(param);
    expect(result.success).toBe(false);
  });

  it('rejects a parameter where default_value is outside [min_value, max_value]', () => {
    const param = makeValidParam();
    param.default_value = 1.5; // outside [0.0, 1.0]
    const result = WeightingParameterSchema.safeParse(param);
    expect(result.success).toBe(false);
  });

  it('accepts all three valid parameter types', () => {
    for (const type of ['frequency', 'critical_path', 'depth_decay'] as const) {
      const param = { ...makeValidParam(), type };
      const result = WeightingParameterSchema.safeParse(param);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// WeightingSpecSchema
// ============================================================================

describe('WeightingSpecSchema', () => {
  const makeValidSpec = () => ({
    version: '1.0.0',
    title: 'AMIGA Weighting Algorithm Specification',
    overview: 'Describes how contributor weights are calculated.',
    parameters: [
      {
        name: 'frequency',
        description: 'Invocation frequency.',
        type: 'frequency',
        default_value: 0.40,
        min_value: 0.0,
        max_value: 1.0,
        unit: 'weight',
        adjustment_process: 'Governance vote.',
      },
      {
        name: 'critical_path',
        description: 'Critical dependency path.',
        type: 'critical_path',
        default_value: 0.35,
        min_value: 0.0,
        max_value: 1.0,
        unit: 'weight',
        adjustment_process: 'Dispute with evidence.',
      },
      {
        name: 'depth_decay',
        description: 'Transitive dependency decay.',
        type: 'depth_decay',
        default_value: 0.25,
        min_value: 0.0,
        max_value: 1.0,
        unit: 'factor',
        adjustment_process: 'Impact analysis required.',
      },
    ],
    normalization: 'Weights normalized to sum to 1.0 per mission.',
    audit_trail: 'Every calculation logged with inputs and outputs.',
    last_updated: '2026-01-01T00:00:00Z',
  });

  it('accepts a valid spec with all 3 required parameter types', () => {
    const result = WeightingSpecSchema.safeParse(makeValidSpec());
    expect(result.success).toBe(true);
  });

  it('rejects a spec with fewer than 3 parameters', () => {
    const spec = makeValidSpec();
    spec.parameters = spec.parameters.slice(0, 2);
    const result = WeightingSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });

  it('rejects a spec missing a required parameter type', () => {
    const spec = makeValidSpec();
    // Replace depth_decay with a duplicate frequency
    spec.parameters[2] = { ...spec.parameters[0] };
    const result = WeightingSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WEIGHTING_SPEC_YAML
// ============================================================================

describe('WEIGHTING_SPEC_YAML', () => {
  it('is a string constant containing valid YAML', () => {
    expect(typeof WEIGHTING_SPEC_YAML).toBe('string');
    expect(WEIGHTING_SPEC_YAML.length).toBeGreaterThan(0);
  });

  it('parseWeightingSpec returns a valid WeightingSpecSchema object', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const result = WeightingSpecSchema.safeParse(spec);
    expect(result.success).toBe(true);
  });

  it('contains all 3 required parameter types', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const types = spec.parameters.map((p: { type: string }) => p.type);
    expect(types).toContain('frequency');
    expect(types).toContain('critical_path');
    expect(types).toContain('depth_decay');
  });

  it('every parameter has non-empty description and adjustment_process', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    for (const param of spec.parameters) {
      expect(param.description).toBeTruthy();
      expect(param.description.length).toBeGreaterThan(0);
      expect(param.adjustment_process).toBeTruthy();
      expect(param.adjustment_process.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// parseWeightingSpec
// ============================================================================

describe('parseWeightingSpec', () => {
  it('parses valid YAML to WeightingSpecSchema object', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    expect(spec.version).toBeDefined();
    expect(spec.parameters.length).toBeGreaterThanOrEqual(3);
  });

  it('throws on invalid YAML content', () => {
    const invalidYaml = `
version: "1.0.0"
title: "Bad Spec"
overview: "Missing params"
parameters: []
normalization: "n/a"
audit_trail: "n/a"
last_updated: "2026-01-01T00:00:00Z"
`;
    expect(() => parseWeightingSpec(invalidYaml)).toThrow();
  });
});

// ============================================================================
// validateParameterRange
// ============================================================================

describe('validateParameterRange', () => {
  it('returns valid: true for value within range', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const result = validateParameterRange('frequency', 0.5, spec);
    expect(result.valid).toBe(true);
  });

  it('returns valid: false with reason for value outside range', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const result = validateParameterRange('frequency', 1.5, spec);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
    expect(typeof result.reason).toBe('string');
  });

  it('returns valid: false with reason for unknown parameter name', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const result = validateParameterRange('nonexistent', 0.5, spec);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });
});

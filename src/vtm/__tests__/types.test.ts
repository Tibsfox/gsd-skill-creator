/**
 * Tests for VTM foundation Zod schemas.
 *
 * Covers all foundation types for the Vision-to-Mission pipeline:
 * - ModelAssignmentSchema: enum constraining to exactly opus, sonnet, haiku
 * - TokenEstimateSchema: model + estimated tokens + context windows
 * - TokenBudgetConstraintSchema: 60/40 principle budget ranges
 * - BudgetAllocationSchema: actual percentage allocation
 * - VisionDocumentSchema: full vision document structure
 * - ResearchReferenceSchema: research reference with topics and safety
 * - ChipsetConfigSchema: chipset YAML structure with topology and gates
 *
 * Also validates convenience exports:
 * - VTM_SCHEMAS mapping object
 * - MODEL_ASSIGNMENTS const array
 * - BUDGET_RANGES const
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import {
  ModelAssignmentSchema,
  MODEL_ASSIGNMENTS,
  TokenEstimateSchema,
  TokenBudgetConstraintSchema,
  BUDGET_RANGES,
  BudgetAllocationSchema,
  VisionDocumentSchema,
  ResearchReferenceSchema,
  ChipsetConfigSchema,
  VTM_SCHEMAS,
} from '../types.js';
import type {
  ModelAssignment,
  TokenEstimate,
  TokenBudgetConstraint,
  BudgetAllocation,
  VisionDocument,
  ResearchReference,
  ChipsetConfig,
} from '../types.js';

// ============================================================================
// ModelAssignmentSchema
// ============================================================================

describe('ModelAssignmentSchema', () => {
  it('accepts exactly opus, sonnet, haiku', () => {
    expect(ModelAssignmentSchema.safeParse('opus').success).toBe(true);
    expect(ModelAssignmentSchema.safeParse('sonnet').success).toBe(true);
    expect(ModelAssignmentSchema.safeParse('haiku').success).toBe(true);
  });

  it('rejects gpt4', () => {
    expect(ModelAssignmentSchema.safeParse('gpt4').success).toBe(false);
  });

  it('rejects claude', () => {
    expect(ModelAssignmentSchema.safeParse('claude').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(ModelAssignmentSchema.safeParse('').success).toBe(false);
  });

  it('rejects numbers', () => {
    expect(ModelAssignmentSchema.safeParse(42).success).toBe(false);
  });

  it('has exactly 3 enum values', () => {
    expect(ModelAssignmentSchema.options).toHaveLength(3);
  });

  it('MODEL_ASSIGNMENTS const array matches schema values', () => {
    expect(MODEL_ASSIGNMENTS).toEqual(['opus', 'sonnet', 'haiku']);
    expect(MODEL_ASSIGNMENTS).toHaveLength(3);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = ModelAssignmentSchema.safeParse('opus');
    if (result.success) {
      const _m: ModelAssignment = result.data;
      expect(typeof _m).toBe('string');
    }
  });
});

// ============================================================================
// TokenEstimateSchema
// ============================================================================

describe('TokenEstimateSchema', () => {
  it('accepts valid token estimate', () => {
    const valid = { model: 'sonnet', estimatedTokens: 5000, contextWindows: 1 };
    const result = TokenEstimateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects negative tokens', () => {
    const invalid = { model: 'sonnet', estimatedTokens: -100, contextWindows: 1 };
    expect(TokenEstimateSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects zero tokens', () => {
    const invalid = { model: 'sonnet', estimatedTokens: 0, contextWindows: 1 };
    expect(TokenEstimateSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects missing model', () => {
    const invalid = { estimatedTokens: 5000, contextWindows: 1 };
    expect(TokenEstimateSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects non-integer contextWindows', () => {
    const invalid = { model: 'opus', estimatedTokens: 5000, contextWindows: 1.5 };
    expect(TokenEstimateSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects zero contextWindows', () => {
    const invalid = { model: 'opus', estimatedTokens: 5000, contextWindows: 0 };
    expect(TokenEstimateSchema.safeParse(invalid).success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = TokenEstimateSchema.safeParse({
      model: 'haiku',
      estimatedTokens: 1000,
      contextWindows: 2,
    });
    if (result.success) {
      const _te: TokenEstimate = result.data;
      expect(_te.model).toBe('haiku');
    }
  });
});

// ============================================================================
// TokenBudgetConstraintSchema + BUDGET_RANGES
// ============================================================================

describe('TokenBudgetConstraintSchema', () => {
  it('BUDGET_RANGES encodes the 60/40 principle', () => {
    expect(BUDGET_RANGES.sonnet.min).toBe(55);
    expect(BUDGET_RANGES.sonnet.max).toBe(65);
    expect(BUDGET_RANGES.opus.min).toBe(25);
    expect(BUDGET_RANGES.opus.max).toBe(35);
    expect(BUDGET_RANGES.haiku.min).toBe(5);
    expect(BUDGET_RANGES.haiku.max).toBe(15);
  });

  it('BUDGET_RANGES passes schema validation', () => {
    const result = TokenBudgetConstraintSchema.safeParse(BUDGET_RANGES);
    expect(result.success).toBe(true);
  });

  it('accepts valid custom budget constraint', () => {
    const custom = {
      sonnet: { min: 50, max: 70 },
      opus: { min: 20, max: 40 },
      haiku: { min: 0, max: 20 },
    };
    expect(TokenBudgetConstraintSchema.safeParse(custom).success).toBe(true);
  });

  it('rejects missing sonnet range', () => {
    const invalid = {
      opus: { min: 25, max: 35 },
      haiku: { min: 5, max: 15 },
    };
    expect(TokenBudgetConstraintSchema.safeParse(invalid).success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = TokenBudgetConstraintSchema.safeParse(BUDGET_RANGES);
    if (result.success) {
      const _tbc: TokenBudgetConstraint = result.data;
      expect(_tbc.sonnet.min).toBe(55);
    }
  });
});

// ============================================================================
// BudgetAllocationSchema
// ============================================================================

describe('BudgetAllocationSchema', () => {
  it('accepts valid allocation', () => {
    const valid = { sonnetPercent: 60, opusPercent: 30, haikuPercent: 10 };
    expect(BudgetAllocationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing opusPercent', () => {
    const invalid = { sonnetPercent: 60, haikuPercent: 10 };
    expect(BudgetAllocationSchema.safeParse(invalid).success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = BudgetAllocationSchema.safeParse({
      sonnetPercent: 60,
      opusPercent: 30,
      haikuPercent: 10,
    });
    if (result.success) {
      const _ba: BudgetAllocation = result.data;
      expect(_ba.sonnetPercent).toBe(60);
    }
  });
});

// ============================================================================
// VisionDocumentSchema
// ============================================================================

describe('VisionDocumentSchema', () => {
  const validVisionDoc = {
    name: 'Electronics Educational Pack',
    date: '2026-02-21',
    status: 'initial-vision' as const,
    dependsOn: ['knowledge-framework'],
    context: 'An electronics learning system for hands-on education.',
    vision: 'A comprehensive electronics learning experience that teaches fundamentals through simulation.',
    problemStatement: [
      { name: 'No safe simulation', description: 'Students cannot safely experiment with circuits' },
    ],
    coreConcept: {
      interactionModel: 'Explore, Try, Practice, Understand, Integrate',
      description: 'Users learn electronics through progressive simulation tiers.',
    },
    architecture: {
      connections: [
        { from: 'simulator', to: 'safety-warden', relationship: 'validates circuits' },
      ],
    },
    modules: [
      {
        name: 'Module 1: Fundamentals',
        concepts: ['voltage', 'current', 'resistance'],
      },
    ],
    chipsetConfig: {
      name: 'electronics-pack',
      version: '1.0.0',
      description: 'Electronics educational pack chipset',
      skills: {
        'circuit-sim': { domain: 'electronics', description: 'Circuit simulation skill' },
      },
      agents: {
        topology: 'pipeline' as const,
        agents: [{ name: 'instructor', role: 'Guides learning progression' }],
      },
      evaluation: {
        gates: {
          preDeploy: [
            { check: 'test_coverage', threshold: 80, action: 'block' as const },
          ],
        },
      },
    },
    successCriteria: ['Students can build and simulate basic circuits'],
    throughLine: 'Progressive disclosure aligned with the Amiga Principle.',
  };

  it('accepts a valid vision document', () => {
    const result = VisionDocumentSchema.safeParse(validVisionDoc);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = VisionDocumentSchema.safeParse(validVisionDoc);
    if (result.success) {
      const doc: VisionDocument = result.data;
      expect(doc.name).toBe('Electronics Educational Pack');
      expect(doc.status).toBe('initial-vision');
      expect(doc.modules).toHaveLength(1);
    }
  });

  it('accepts all valid status values', () => {
    for (const status of ['initial-vision', 'pre-research', 'research-complete', 'mission-ready']) {
      const doc = { ...validVisionDoc, status };
      expect(VisionDocumentSchema.safeParse(doc).success).toBe(true);
    }
  });

  it('rejects missing vision field', () => {
    const { vision: _, ...noVision } = validVisionDoc;
    expect(VisionDocumentSchema.safeParse(noVision).success).toBe(false);
  });

  it('rejects missing problemStatement', () => {
    const { problemStatement: _, ...noProblem } = validVisionDoc;
    expect(VisionDocumentSchema.safeParse(noProblem).success).toBe(false);
  });

  it('rejects missing successCriteria', () => {
    const { successCriteria: _, ...noCriteria } = validVisionDoc;
    expect(VisionDocumentSchema.safeParse(noCriteria).success).toBe(false);
  });

  it('rejects missing throughLine', () => {
    const { throughLine: _, ...noThroughLine } = validVisionDoc;
    expect(VisionDocumentSchema.safeParse(noThroughLine).success).toBe(false);
  });

  it('rejects empty successCriteria array', () => {
    const doc = { ...validVisionDoc, successCriteria: [] };
    expect(VisionDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('rejects empty problemStatement array', () => {
    const doc = { ...validVisionDoc, problemStatement: [] };
    expect(VisionDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const doc = { ...validVisionDoc, date: '02-21-2026' };
    expect(VisionDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('rejects invalid status enum', () => {
    const doc = { ...validVisionDoc, status: 'draft' };
    expect(VisionDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('returns structured errors with paths on invalid input', () => {
    const result = VisionDocumentSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths.length).toBeGreaterThan(0);
    }
  });

  it('accepts optional fields', () => {
    const docWithOptionals = {
      ...validVisionDoc,
      coreConcept: {
        ...validVisionDoc.coreConcept,
        diagram: '```\n[A] -> [B]\n```',
      },
      architecture: {
        ...validVisionDoc.architecture,
        moduleMap: '```\nmodule-map\n```',
      },
      modules: [
        {
          ...validVisionDoc.modules[0],
          trySession: { name: 'First Circuit', description: 'Build a simple LED circuit' },
          safetyConcerns: 'Use low voltage only',
        },
      ],
      relationships: [
        { document: 'knowledge-framework.md', relationship: 'extends' },
      ],
    };
    expect(VisionDocumentSchema.safeParse(docWithOptionals).success).toBe(true);
  });
});

// ============================================================================
// ResearchReferenceSchema
// ============================================================================

describe('ResearchReferenceSchema', () => {
  const validResearchRef = {
    name: 'Electronics Research Reference',
    date: '2026-02-21',
    status: 'research-compilation' as const,
    sourceDocument: 'electronics-vision.md',
    purpose: 'Provides research foundation for electronics modules.',
    howToUse: 'Reference individual topic sections during module implementation.',
    sourceOrganizations: [
      { name: 'IEEE', description: 'Professional standards body for electronics' },
    ],
    topics: [
      {
        name: 'Circuit Fundamentals',
        foundation: 'Ohm\'s law establishes the relationship between V, I, and R.',
        techniques: 'Nodal analysis, mesh analysis, superposition theorem.',
      },
    ],
  };

  it('accepts a valid research reference', () => {
    const result = ResearchReferenceSchema.safeParse(validResearchRef);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = ResearchReferenceSchema.safeParse(validResearchRef);
    if (result.success) {
      const ref: ResearchReference = result.data;
      expect(ref.name).toBe('Electronics Research Reference');
      expect(ref.topics).toHaveLength(1);
    }
  });

  it('accepts all valid status values', () => {
    for (const status of ['research-compilation', 'draft', 'final']) {
      const ref = { ...validResearchRef, status };
      expect(ResearchReferenceSchema.safeParse(ref).success).toBe(true);
    }
  });

  it('rejects missing sourceOrganizations', () => {
    const { sourceOrganizations: _, ...noOrgs } = validResearchRef;
    expect(ResearchReferenceSchema.safeParse(noOrgs).success).toBe(false);
  });

  it('rejects empty sourceOrganizations array', () => {
    const ref = { ...validResearchRef, sourceOrganizations: [] };
    expect(ResearchReferenceSchema.safeParse(ref).success).toBe(false);
  });

  it('rejects missing topics', () => {
    const { topics: _, ...noTopics } = validResearchRef;
    expect(ResearchReferenceSchema.safeParse(noTopics).success).toBe(false);
  });

  it('rejects empty topics array', () => {
    const ref = { ...validResearchRef, topics: [] };
    expect(ResearchReferenceSchema.safeParse(ref).success).toBe(false);
  });

  it('accepts topics with safety concerns', () => {
    const ref = {
      ...validResearchRef,
      topics: [
        {
          ...validResearchRef.topics[0],
          safetyConcerns: [
            {
              condition: 'High voltage circuit',
              recommendation: 'Limit to simulation only',
              boundaryType: 'gate' as const,
            },
          ],
        },
      ],
    };
    expect(ResearchReferenceSchema.safeParse(ref).success).toBe(true);
  });

  it('rejects invalid boundaryType enum value', () => {
    const ref = {
      ...validResearchRef,
      topics: [
        {
          ...validResearchRef.topics[0],
          safetyConcerns: [
            {
              condition: 'test',
              recommendation: 'test',
              boundaryType: 'invalid',
            },
          ],
        },
      ],
    };
    expect(ResearchReferenceSchema.safeParse(ref).success).toBe(false);
  });

  it('accepts topics with crossReferences', () => {
    const ref = {
      ...validResearchRef,
      topics: [
        {
          ...validResearchRef.topics[0],
          crossReferences: ['Topic 2', 'Topic 3'],
        },
      ],
    };
    expect(ResearchReferenceSchema.safeParse(ref).success).toBe(true);
  });

  it('accepts optional integrationNotes', () => {
    const ref = {
      ...validResearchRef,
      integrationNotes: {
        sharedSafetyFramework: 'Use low voltage simulation everywhere.',
        culturalSensitivity: 'Respect diverse engineering traditions.',
        bibliography: {
          professional: ['IEEE Standards'],
          clinical: ['Safety Research Paper'],
          technical: ['Circuit Analysis Textbook'],
          historical: ['History of Electronics'],
        },
      },
    };
    expect(ResearchReferenceSchema.safeParse(ref).success).toBe(true);
  });
});

// ============================================================================
// ChipsetConfigSchema
// ============================================================================

describe('ChipsetConfigSchema', () => {
  const validChipset = {
    name: 'electronics-pack',
    version: '1.0.0',
    description: 'Electronics educational pack chipset',
    skills: {
      'circuit-sim': { domain: 'electronics', description: 'Circuit simulation skill' },
    },
    agents: {
      topology: 'pipeline' as const,
      agents: [{ name: 'instructor', role: 'Guides learning' }],
    },
    evaluation: {
      gates: {
        preDeploy: [
          { check: 'test_coverage', threshold: 80, action: 'block' as const },
        ],
      },
    },
  };

  it('accepts a valid chipset config', () => {
    const result = ChipsetConfigSchema.safeParse(validChipset);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = ChipsetConfigSchema.safeParse(validChipset);
    if (result.success) {
      const cfg: ChipsetConfig = result.data;
      expect(cfg.name).toBe('electronics-pack');
      expect(cfg.agents.topology).toBe('pipeline');
    }
  });

  it('accepts all valid topology values', () => {
    for (const topology of ['pipeline', 'router', 'map-reduce', 'swarm', 'leader-worker']) {
      const cfg = {
        ...validChipset,
        agents: { ...validChipset.agents, topology },
      };
      expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(true);
    }
  });

  it('rejects invalid topology enum', () => {
    const cfg = {
      ...validChipset,
      agents: { ...validChipset.agents, topology: 'fan-out' },
    };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('rejects missing agents array', () => {
    const cfg = {
      ...validChipset,
      agents: { topology: 'pipeline', agents: [] },
    };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('rejects non-kebab-case name', () => {
    const cfg = { ...validChipset, name: 'Electronics Pack' };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('rejects invalid semver version', () => {
    const cfg = { ...validChipset, version: '1.0' };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('accepts eval gates with optional fields', () => {
    const cfg = {
      ...validChipset,
      evaluation: {
        gates: {
          preDeploy: [
            { check: 'type_check', command: 'npx tsc --noEmit', action: 'block' as const },
            { check: 'lint', action: 'warn' as const },
          ],
        },
      },
    };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(true);
  });

  it('rejects invalid eval gate action', () => {
    const cfg = {
      ...validChipset,
      evaluation: {
        gates: {
          preDeploy: [
            { check: 'test', action: 'crash' },
          ],
        },
      },
    };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(false);
  });

  it('accepts multiple skills', () => {
    const cfg = {
      ...validChipset,
      skills: {
        'circuit-sim': { domain: 'electronics', description: 'Sim' },
        'safety-check': { domain: 'safety', description: 'Safety' },
      },
    };
    expect(ChipsetConfigSchema.safeParse(cfg).success).toBe(true);
  });
});

// ============================================================================
// VTM_SCHEMAS convenience object
// ============================================================================

describe('VTM_SCHEMAS', () => {
  it('maps all 6 schema groups', () => {
    expect(VTM_SCHEMAS).toHaveProperty('ModelAssignment');
    expect(VTM_SCHEMAS).toHaveProperty('TokenEstimate');
    expect(VTM_SCHEMAS).toHaveProperty('TokenBudgetConstraint');
    expect(VTM_SCHEMAS).toHaveProperty('VisionDocument');
    expect(VTM_SCHEMAS).toHaveProperty('ResearchReference');
    expect(VTM_SCHEMAS).toHaveProperty('ChipsetConfig');
  });

  it('has exactly 6 entries', () => {
    expect(Object.keys(VTM_SCHEMAS)).toHaveLength(6);
  });

  it('each entry is a valid Zod schema with safeParse', () => {
    for (const [_name, schema] of Object.entries(VTM_SCHEMAS)) {
      expect(typeof (schema as z.ZodTypeAny).safeParse).toBe('function');
    }
  });
});

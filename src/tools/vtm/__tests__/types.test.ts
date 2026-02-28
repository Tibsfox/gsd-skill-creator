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
  ComponentSpecSchema,
  WaveSummaryEntrySchema,
  WaveTaskSchema,
  TrackSchema,
  WaveSchema,
  WaveExecutionPlanSchema,
  TestCategorySchema,
  TestSpecSchema,
  TestPlanSchema,
  MilestoneSpecSchema,
  MissionPackageSchema,
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
  ComponentSpec,
  WaveExecutionPlan,
  TestPlan,
  MilestoneSpec,
  MissionPackage,
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
  it('maps all 11 schema groups', () => {
    expect(VTM_SCHEMAS).toHaveProperty('ModelAssignment');
    expect(VTM_SCHEMAS).toHaveProperty('TokenEstimate');
    expect(VTM_SCHEMAS).toHaveProperty('TokenBudgetConstraint');
    expect(VTM_SCHEMAS).toHaveProperty('VisionDocument');
    expect(VTM_SCHEMAS).toHaveProperty('ResearchReference');
    expect(VTM_SCHEMAS).toHaveProperty('ChipsetConfig');
    expect(VTM_SCHEMAS).toHaveProperty('ComponentSpec');
    expect(VTM_SCHEMAS).toHaveProperty('WaveExecutionPlan');
    expect(VTM_SCHEMAS).toHaveProperty('TestPlan');
    expect(VTM_SCHEMAS).toHaveProperty('MilestoneSpec');
    expect(VTM_SCHEMAS).toHaveProperty('MissionPackage');
  });

  it('has exactly 11 entries', () => {
    expect(Object.keys(VTM_SCHEMAS)).toHaveLength(11);
  });

  it('each entry is a valid Zod schema with safeParse', () => {
    for (const [_name, schema] of Object.entries(VTM_SCHEMAS)) {
      expect(typeof (schema as z.ZodTypeAny).safeParse).toBe('function');
    }
  });
});

// ============================================================================
// ComponentSpecSchema (Plan 02)
// ============================================================================

describe('ComponentSpecSchema', () => {
  const validComponentSpec = {
    name: 'Vision Document Parser',
    milestone: 'Vision-to-Mission Pipeline v1.30',
    wave: 'Wave 1, Track A',
    modelAssignment: 'sonnet' as const,
    estimatedTokens: 8000,
    dependencies: ['vtm-types', 'zod-schemas'],
    produces: ['src/vtm/parser.ts', 'src/vtm/__tests__/parser.test.ts'],
    objective: 'Parse vision document markdown into validated typed structures.',
    context: 'The VTM pipeline needs to extract structured data from vision document markdown files. This parser consumes raw markdown and produces VisionDocument typed objects.',
    technicalSpec: [
      { name: 'MarkdownParser', spec: 'Extracts sections by heading level, returns structured AST' },
    ],
    implementationSteps: [
      { name: 'Create parser module', description: 'Set up src/vtm/parser.ts with section extraction' },
    ],
    testCases: [
      { name: 'Valid doc parses', input: 'Well-formed vision markdown', expected: 'Typed VisionDocument object' },
    ],
    verificationGate: {
      conditions: ['All tests pass', 'No type errors'],
      handoff: 'src/vtm/parser.ts ready for integration',
    },
  };

  it('accepts a valid component spec', () => {
    const result = ComponentSpecSchema.safeParse(validComponentSpec);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = ComponentSpecSchema.safeParse(validComponentSpec);
    if (result.success) {
      const spec: ComponentSpec = result.data;
      expect(spec.name).toBe('Vision Document Parser');
      expect(spec.modelAssignment).toBe('sonnet');
    }
  });

  it('validates modelAssignment is a valid ModelAssignment value', () => {
    for (const model of ['opus', 'sonnet', 'haiku']) {
      const spec = { ...validComponentSpec, modelAssignment: model };
      expect(ComponentSpecSchema.safeParse(spec).success).toBe(true);
    }
  });

  it('rejects invalid modelAssignment', () => {
    const spec = { ...validComponentSpec, modelAssignment: 'gpt4' };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects missing verificationGate', () => {
    const { verificationGate: _, ...noGate } = validComponentSpec;
    expect(ComponentSpecSchema.safeParse(noGate).success).toBe(false);
  });

  it('rejects empty implementationSteps', () => {
    const spec = { ...validComponentSpec, implementationSteps: [] };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects empty technicalSpec', () => {
    const spec = { ...validComponentSpec, technicalSpec: [] };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects empty testCases', () => {
    const spec = { ...validComponentSpec, testCases: [] };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects missing objective', () => {
    const { objective: _, ...noObj } = validComponentSpec;
    expect(ComponentSpecSchema.safeParse(noObj).success).toBe(false);
  });

  it('rejects missing context', () => {
    const { context: _, ...noCtx } = validComponentSpec;
    expect(ComponentSpecSchema.safeParse(noCtx).success).toBe(false);
  });

  it('accepts optional safetyBoundaries', () => {
    const spec = {
      ...validComponentSpec,
      safetyBoundaries: {
        must: ['Validate all inputs'],
        mustNot: ['Execute arbitrary code'],
        boundaryType: 'gate' as const,
      },
    };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('validates safetyBoundaries boundaryType enum', () => {
    for (const bt of ['annotate', 'gate', 'redirect']) {
      const spec = {
        ...validComponentSpec,
        safetyBoundaries: { must: ['x'], mustNot: ['y'], boundaryType: bt },
      };
      expect(ComponentSpecSchema.safeParse(spec).success).toBe(true);
    }
  });

  it('rejects invalid safetyBoundaries boundaryType', () => {
    const spec = {
      ...validComponentSpec,
      safetyBoundaries: { must: ['x'], mustNot: ['y'], boundaryType: 'ignore' },
    };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects empty verificationGate conditions', () => {
    const spec = {
      ...validComponentSpec,
      verificationGate: { conditions: [], handoff: 'done' },
    };
    expect(ComponentSpecSchema.safeParse(spec).success).toBe(false);
  });
});

// ============================================================================
// WaveExecutionPlanSchema (Plan 02)
// ============================================================================

describe('WaveExecutionPlanSchema', () => {
  const validWavePlan = {
    milestoneName: 'Vision-to-Mission Pipeline v1.30',
    milestoneSpec: 'milestone-spec.md',
    totalTasks: 15,
    parallelTracks: 3,
    sequentialDepth: 4,
    estimatedWallTime: '~6 hours',
    criticalPath: '8 sequential sessions through waves 0-3',
    waveSummary: [
      { wave: 0, tasks: 2, parallelTracks: 1, estimatedTime: '~30 min', cacheDependencies: 'None' },
      { wave: 1, tasks: 6, parallelTracks: 3, estimatedTime: '~2 hours', cacheDependencies: 'Wave 0' },
    ],
    waves: [
      {
        number: 0,
        name: 'Foundation',
        purpose: 'Produce shared artifacts',
        isSequential: true,
        tracks: [
          {
            name: 'Foundation Track',
            tasks: [
              {
                id: '0.1',
                description: 'Create type schemas',
                produces: 'src/vtm/types.ts',
                model: 'haiku' as const,
                estimatedTokens: 3000,
                dependsOn: [],
              },
            ],
          },
        ],
      },
    ],
  };

  it('accepts a valid wave execution plan', () => {
    const result = WaveExecutionPlanSchema.safeParse(validWavePlan);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = WaveExecutionPlanSchema.safeParse(validWavePlan);
    if (result.success) {
      const plan: WaveExecutionPlan = result.data;
      expect(plan.milestoneName).toBe('Vision-to-Mission Pipeline v1.30');
      expect(plan.totalTasks).toBe(15);
    }
  });

  it('validates wave task model is a valid ModelAssignment', () => {
    for (const model of ['opus', 'sonnet', 'haiku']) {
      const plan = {
        ...validWavePlan,
        waves: [{
          ...validWavePlan.waves[0],
          tracks: [{
            ...validWavePlan.waves[0].tracks[0],
            tasks: [{
              ...validWavePlan.waves[0].tracks[0].tasks[0],
              model,
            }],
          }],
        }],
      };
      expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(true);
    }
  });

  it('rejects invalid wave task model', () => {
    const plan = {
      ...validWavePlan,
      waves: [{
        ...validWavePlan.waves[0],
        tracks: [{
          ...validWavePlan.waves[0].tracks[0],
          tasks: [{
            ...validWavePlan.waves[0].tracks[0].tasks[0],
            model: 'gpt4',
          }],
        }],
      }],
    };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects empty waves array', () => {
    const plan = { ...validWavePlan, waves: [] };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects missing waveSummary', () => {
    const { waveSummary: _, ...noSummary } = validWavePlan;
    expect(WaveExecutionPlanSchema.safeParse(noSummary).success).toBe(false);
  });

  it('rejects empty waveSummary array', () => {
    const plan = { ...validWavePlan, waveSummary: [] };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('accepts optional cacheOptimization', () => {
    const plan = {
      ...validWavePlan,
      cacheOptimization: {
        sharedSkillLoads: [{ skill: 'vtm-types', loadedIn: 'Wave 0', consumedBy: 'Wave 1', tokensSaved: 2000 }],
        schemaReuse: [{ schema: 'VisionDocumentSchema', producedBy: 'Task 0.1', consumedBy: 'Task 1A.1', timing: 'Within TTL' }],
        preComputedKnowledge: [{ tier: 'summary', content: 'Domain overview', size: '2K', agentsThatLoadIt: 'All' }],
        tokenSavings: [{ optimization: 'Shared loads', tokensSaved: 5000, method: 'TTL cache' }],
      },
    };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(true);
  });

  it('accepts optional dependencyGraph', () => {
    const plan = { ...validWavePlan, dependencyGraph: 'Wave 0: [0.1] -> [0.2]' };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(true);
  });

  it('accepts optional riskFactors', () => {
    const plan = {
      ...validWavePlan,
      riskFactors: [
        { risk: 'Cache TTL exceeded', impact: 'Redundant loads', mitigation: 'Keep Wave 0 under 4 min' },
      ],
    };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(true);
  });

  it('accepts optional verificationGate on wave', () => {
    const plan = {
      ...validWavePlan,
      waves: [{
        ...validWavePlan.waves[0],
        verificationGate: 'All foundation types compile with no errors',
      }],
    };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(true);
  });

  it('rejects zero totalTasks', () => {
    const plan = { ...validWavePlan, totalTasks: 0 };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects negative parallelTracks', () => {
    const plan = { ...validWavePlan, parallelTracks: -1 };
    expect(WaveExecutionPlanSchema.safeParse(plan).success).toBe(false);
  });
});

// ============================================================================
// TestPlanSchema (Plan 02)
// ============================================================================

describe('TestPlanSchema', () => {
  const validTestPlan = {
    milestoneName: 'Vision-to-Mission Pipeline v1.30',
    milestoneSpec: 'milestone-spec.md',
    visionDocument: 'vision-doc.md',
    totalTests: 20,
    safetyCriticalCount: 3,
    targetCoverage: 95,
    categories: [
      { name: 'safety-critical' as const, count: 3, priority: 'mandatory-pass' as const, failureAction: 'block' as const },
      { name: 'core' as const, count: 10, priority: 'required' as const, failureAction: 'block' as const },
      { name: 'integration' as const, count: 5, priority: 'required' as const, failureAction: 'block' as const },
      { name: 'edge-case' as const, count: 2, priority: 'best-effort' as const, failureAction: 'log' as const },
    ],
    tests: [
      { id: 'S-001', category: 'safety-critical' as const, verifies: 'Input sanitization', expectedBehavior: 'Rejects script injection' },
      { id: 'C-001', category: 'core' as const, verifies: 'Vision parsing', expectedBehavior: 'Returns typed VisionDocument', component: 'Parser' },
      { id: 'I-001', category: 'integration' as const, verifies: 'Parser-to-validator flow', expectedBehavior: 'Validator receives parsed doc' },
      { id: 'E-001', category: 'edge-case' as const, verifies: 'Empty markdown input', expectedBehavior: 'Returns structured error' },
    ],
    verificationMatrix: [
      { criterion: 'Parser handles all vision document sections', testIds: ['C-001', 'I-001'] },
      { criterion: 'Safety checks block bad input', testIds: ['S-001'], component: 'Safety Warden' },
    ],
  };

  it('accepts a valid test plan', () => {
    const result = TestPlanSchema.safeParse(validTestPlan);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = TestPlanSchema.safeParse(validTestPlan);
    if (result.success) {
      const plan: TestPlan = result.data;
      expect(plan.milestoneName).toBe('Vision-to-Mission Pipeline v1.30');
      expect(plan.totalTests).toBe(20);
    }
  });

  it('validates test IDs follow S-NNN/C-NNN/I-NNN/E-NNN pattern', () => {
    const validIds = ['S-001', 'S-999', 'C-042', 'I-100', 'E-005'];
    for (const id of validIds) {
      const plan = {
        ...validTestPlan,
        tests: [{ id, category: 'core' as const, verifies: 'test', expectedBehavior: 'test' }],
      };
      expect(TestPlanSchema.safeParse(plan).success).toBe(true);
    }
  });

  it('rejects invalid test ID pattern T-001', () => {
    const plan = {
      ...validTestPlan,
      tests: [{ id: 'T-001', category: 'core' as const, verifies: 'test', expectedBehavior: 'test' }],
    };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects invalid test ID pattern S-1', () => {
    const plan = {
      ...validTestPlan,
      tests: [{ id: 'S-1', category: 'core' as const, verifies: 'test', expectedBehavior: 'test' }],
    };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects invalid test ID pattern S-0001', () => {
    const plan = {
      ...validTestPlan,
      tests: [{ id: 'S-0001', category: 'core' as const, verifies: 'test', expectedBehavior: 'test' }],
    };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects empty verificationMatrix', () => {
    const plan = { ...validTestPlan, verificationMatrix: [] };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects empty categories', () => {
    const plan = { ...validTestPlan, categories: [] };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects empty tests', () => {
    const plan = { ...validTestPlan, tests: [] };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('validates category name enum', () => {
    for (const name of ['safety-critical', 'core', 'integration', 'edge-case']) {
      const cat = { name, count: 1, priority: 'required' as const, failureAction: 'block' as const };
      expect(TestCategorySchema.safeParse(cat).success).toBe(true);
    }
  });

  it('rejects invalid category name', () => {
    const cat = { name: 'performance', count: 1, priority: 'required', failureAction: 'block' };
    expect(TestCategorySchema.safeParse(cat).success).toBe(false);
  });

  it('validates priority enum', () => {
    for (const priority of ['mandatory-pass', 'required', 'best-effort']) {
      const cat = { name: 'core' as const, count: 1, priority, failureAction: 'block' as const };
      expect(TestCategorySchema.safeParse(cat).success).toBe(true);
    }
  });

  it('validates failureAction enum', () => {
    for (const fa of ['block', 'log']) {
      const cat = { name: 'core' as const, count: 1, priority: 'required' as const, failureAction: fa };
      expect(TestCategorySchema.safeParse(cat).success).toBe(true);
    }
  });

  it('accepts test with optional component field', () => {
    const plan = {
      ...validTestPlan,
      tests: [{ id: 'C-001', category: 'core' as const, verifies: 'test', expectedBehavior: 'test', component: 'Parser' }],
    };
    expect(TestPlanSchema.safeParse(plan).success).toBe(true);
  });

  it('accepts verificationMatrix with optional component', () => {
    const plan = {
      ...validTestPlan,
      verificationMatrix: [
        { criterion: 'test', testIds: ['S-001'], component: 'Safety Warden' },
      ],
    };
    expect(TestPlanSchema.safeParse(plan).success).toBe(true);
  });

  it('rejects verificationMatrix entry with empty testIds', () => {
    const plan = {
      ...validTestPlan,
      verificationMatrix: [{ criterion: 'test', testIds: [] }],
    };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects targetCoverage above 100', () => {
    const plan = { ...validTestPlan, targetCoverage: 101 };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects negative targetCoverage', () => {
    const plan = { ...validTestPlan, targetCoverage: -1 };
    expect(TestPlanSchema.safeParse(plan).success).toBe(false);
  });
});

// ============================================================================
// MilestoneSpecSchema (Plan 02)
// ============================================================================

describe('MilestoneSpecSchema', () => {
  const validMilestoneSpec = {
    name: 'Vision-to-Mission Pipeline v1.30',
    date: '2026-02-21',
    visionDocument: 'vtm-vision.md',
    estimatedExecution: { contextWindows: 20, sessions: 10, hours: 8 },
    missionObjective: 'Implement the complete VTM pipeline as typed TypeScript modules with Zod validation.',
    architectureOverview: '```\n[Parser] -> [Validator] -> [Assembler] -> [Pipeline]\n```',
    deliverables: [
      { number: 1, deliverable: 'VTM type schemas', acceptanceCriteria: 'All types validate', componentSpec: 'types-spec.md' },
    ],
    componentBreakdown: [
      { component: 'Types', specDocument: 'types-spec.md', dependencies: [], model: 'haiku' as const, estimatedTokens: 3000 },
    ],
    modelRationale: {
      opus: { percentage: 30, components: ['Pipeline Orchestrator'], reason: 'Judgment-heavy architectural decisions' },
      sonnet: { percentage: 60, components: ['Parser', 'Validator'], reason: 'Structural implementation' },
      haiku: { percentage: 10, components: ['Types', 'Config'], reason: 'Scaffold and boilerplate' },
    },
  };

  it('accepts a valid milestone spec', () => {
    const result = MilestoneSpecSchema.safeParse(validMilestoneSpec);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = MilestoneSpecSchema.safeParse(validMilestoneSpec);
    if (result.success) {
      const spec: MilestoneSpec = result.data;
      expect(spec.name).toBe('Vision-to-Mission Pipeline v1.30');
      expect(spec.missionObjective).toContain('VTM pipeline');
    }
  });

  it('validates componentBreakdown model is a valid ModelAssignment', () => {
    for (const model of ['opus', 'sonnet', 'haiku']) {
      const spec = {
        ...validMilestoneSpec,
        componentBreakdown: [{
          ...validMilestoneSpec.componentBreakdown[0],
          model,
        }],
      };
      expect(MilestoneSpecSchema.safeParse(spec).success).toBe(true);
    }
  });

  it('rejects invalid componentBreakdown model', () => {
    const spec = {
      ...validMilestoneSpec,
      componentBreakdown: [{
        ...validMilestoneSpec.componentBreakdown[0],
        model: 'gpt4',
      }],
    };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects missing missionObjective', () => {
    const { missionObjective: _, ...noMission } = validMilestoneSpec;
    expect(MilestoneSpecSchema.safeParse(noMission).success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const spec = { ...validMilestoneSpec, date: '02-21-2026' };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('accepts optional researchReference', () => {
    const spec = { ...validMilestoneSpec, researchReference: 'research-ref.md' };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('accepts optional systemLayers', () => {
    const spec = {
      ...validMilestoneSpec,
      systemLayers: [
        { name: 'Foundation', responsibility: 'Type schemas and validation' },
        { name: 'Processing', responsibility: 'Document parsing and transformation' },
      ],
    };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('accepts optional crossComponentInterfaces', () => {
    const spec = {
      ...validMilestoneSpec,
      crossComponentInterfaces: {
        sharedTypes: 'src/vtm/types.ts',
        eventSchema: 'PipelineEvent',
        filesystemContracts: 'output/',
      },
    };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('accepts optional safetyBoundaries', () => {
    const spec = {
      ...validMilestoneSpec,
      safetyBoundaries: [
        { boundary: 'No arbitrary code execution', reason: 'Security' },
      ],
    };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('accepts optional preComputedKnowledge', () => {
    const spec = {
      ...validMilestoneSpec,
      preComputedKnowledge: [
        { tier: 'summary' as const, size: '~2K tokens', loadingStrategy: 'Always loaded' },
        { tier: 'active' as const, size: '~10K tokens', loadingStrategy: 'On-demand' },
        { tier: 'reference' as const, size: '~50K tokens', loadingStrategy: 'Deep dive only' },
      ],
    };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('rejects invalid preComputedKnowledge tier', () => {
    const spec = {
      ...validMilestoneSpec,
      preComputedKnowledge: [
        { tier: 'cached', size: '~2K', loadingStrategy: 'Always' },
      ],
    };
    expect(MilestoneSpecSchema.safeParse(spec).success).toBe(false);
  });

  it('rejects missing architectureOverview', () => {
    const { architectureOverview: _, ...noArch } = validMilestoneSpec;
    expect(MilestoneSpecSchema.safeParse(noArch).success).toBe(false);
  });
});

// ============================================================================
// MissionPackageSchema (Plan 02)
// ============================================================================

describe('MissionPackageSchema', () => {
  // Build a minimal but complete mission package from sub-schemas
  const minimalMilestoneSpec = {
    name: 'VTM Pipeline v1.30',
    date: '2026-02-21',
    visionDocument: 'vtm-vision.md',
    estimatedExecution: { contextWindows: 20, sessions: 10, hours: 8 },
    missionObjective: 'Build the VTM pipeline.',
    architectureOverview: '```\nPipeline\n```',
    deliverables: [
      { number: 1, deliverable: 'Types', acceptanceCriteria: 'Compile', componentSpec: 'types.md' },
    ],
    componentBreakdown: [
      { component: 'Types', specDocument: 'types.md', dependencies: [], model: 'haiku' as const, estimatedTokens: 3000 },
    ],
    modelRationale: {
      opus: { percentage: 30, components: ['Orchestrator'], reason: 'Judgment' },
      sonnet: { percentage: 60, components: ['Parser'], reason: 'Structural' },
      haiku: { percentage: 10, components: ['Types'], reason: 'Scaffold' },
    },
  };

  const minimalComponentSpec = {
    name: 'Type Schemas',
    milestone: 'VTM Pipeline v1.30',
    wave: 'Wave 0',
    modelAssignment: 'haiku' as const,
    estimatedTokens: 3000,
    dependencies: [],
    produces: ['src/vtm/types.ts'],
    objective: 'Define type schemas.',
    context: 'Foundation types for the pipeline.',
    technicalSpec: [{ name: 'Schemas', spec: 'Zod schemas for all types' }],
    implementationSteps: [{ name: 'Create types', description: 'Define schemas' }],
    testCases: [{ name: 'Valid parse', input: 'Valid JSON', expected: 'Typed object' }],
    verificationGate: { conditions: ['Types compile'], handoff: 'types.ts' },
  };

  const minimalWavePlan = {
    milestoneName: 'VTM Pipeline v1.30',
    milestoneSpec: 'milestone-spec.md',
    totalTasks: 2,
    parallelTracks: 1,
    sequentialDepth: 1,
    estimatedWallTime: '~1 hour',
    criticalPath: '2 sequential tasks',
    waveSummary: [{ wave: 0, tasks: 2, parallelTracks: 1, estimatedTime: '~1 hour', cacheDependencies: 'None' }],
    waves: [{
      number: 0,
      name: 'Foundation',
      purpose: 'Types',
      isSequential: true,
      tracks: [{
        name: 'Main',
        tasks: [{
          id: '0.1',
          description: 'Create types',
          produces: 'types.ts',
          model: 'haiku' as const,
          estimatedTokens: 3000,
          dependsOn: [],
        }],
      }],
    }],
  };

  const minimalTestPlan = {
    milestoneName: 'VTM Pipeline v1.30',
    milestoneSpec: 'milestone-spec.md',
    visionDocument: 'vision.md',
    totalTests: 2,
    safetyCriticalCount: 1,
    targetCoverage: 90,
    categories: [
      { name: 'safety-critical' as const, count: 1, priority: 'mandatory-pass' as const, failureAction: 'block' as const },
      { name: 'core' as const, count: 1, priority: 'required' as const, failureAction: 'block' as const },
    ],
    tests: [
      { id: 'S-001', category: 'safety-critical' as const, verifies: 'Safety check', expectedBehavior: 'Blocks bad input' },
      { id: 'C-001', category: 'core' as const, verifies: 'Core feature', expectedBehavior: 'Returns data' },
    ],
    verificationMatrix: [
      { criterion: 'Safety', testIds: ['S-001'] },
    ],
  };

  const validMissionPackage = {
    name: 'VTM Pipeline v1.30',
    date: '2026-02-21',
    status: 'ready' as const,
    visionDocument: 'vtm-vision.md',
    milestoneSpec: minimalMilestoneSpec,
    componentSpecs: [minimalComponentSpec],
    waveExecutionPlan: minimalWavePlan,
    testPlan: minimalTestPlan,
    executionSummary: {
      totalTasks: 2,
      parallelTracks: 1,
      sequentialDepth: 1,
      opusTasks: { count: 0, percentage: 0 },
      sonnetTasks: { count: 1, percentage: 50 },
      haikuTasks: { count: 1, percentage: 50 },
      estimatedContextWindows: 5,
      estimatedWallTime: '~1 hour',
      criticalPathSessions: 2,
      totalTests: 2,
      safetyCriticalTests: 1,
    },
  };

  it('accepts a valid mission package', () => {
    const result = MissionPackageSchema.safeParse(validMissionPackage);
    expect(result.success).toBe(true);
  });

  it('returns typed data on successful parse', () => {
    const result = MissionPackageSchema.safeParse(validMissionPackage);
    if (result.success) {
      const pkg: MissionPackage = result.data;
      expect(pkg.name).toBe('VTM Pipeline v1.30');
      expect(pkg.status).toBe('ready');
    }
  });

  it('validates componentSpecs composes as array of valid ComponentSpec', () => {
    const pkg = {
      ...validMissionPackage,
      componentSpecs: [minimalComponentSpec, { ...minimalComponentSpec, name: 'Parser' }],
    };
    expect(MissionPackageSchema.safeParse(pkg).success).toBe(true);
  });

  it('validates waveExecutionPlan composes correctly', () => {
    const result = MissionPackageSchema.safeParse(validMissionPackage);
    if (result.success) {
      expect(result.data.waveExecutionPlan.milestoneName).toBe('VTM Pipeline v1.30');
    }
  });

  it('rejects missing milestoneSpec', () => {
    const { milestoneSpec: _, ...noSpec } = validMissionPackage;
    expect(MissionPackageSchema.safeParse(noSpec).success).toBe(false);
  });

  it('rejects empty componentSpecs', () => {
    const pkg = { ...validMissionPackage, componentSpecs: [] };
    expect(MissionPackageSchema.safeParse(pkg).success).toBe(false);
  });

  it('validates status enum', () => {
    for (const status of ['ready', 'draft', 'in-progress']) {
      const pkg = { ...validMissionPackage, status };
      expect(MissionPackageSchema.safeParse(pkg).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const pkg = { ...validMissionPackage, status: 'completed' };
    expect(MissionPackageSchema.safeParse(pkg).success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const pkg = { ...validMissionPackage, date: '02-21-2026' };
    expect(MissionPackageSchema.safeParse(pkg).success).toBe(false);
  });

  it('accepts optional researchReference', () => {
    const pkg = { ...validMissionPackage, researchReference: 'research.md' };
    expect(MissionPackageSchema.safeParse(pkg).success).toBe(true);
  });

  it('rejects missing executionSummary', () => {
    const { executionSummary: _, ...noSummary } = validMissionPackage;
    expect(MissionPackageSchema.safeParse(noSummary).success).toBe(false);
  });

  it('returns structured errors on invalid input', () => {
    const result = MissionPackageSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

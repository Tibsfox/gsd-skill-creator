/**
 * Tests for VTM mission assembly generators, self-containment validator,
 * and file count estimator.
 *
 * Covers:
 * - generateMilestoneSpec(): milestone spec from vision doc + optional research
 * - generateComponentSpecs(): self-contained component specs per module
 * - validateSelfContainment(): external reference detection in component specs
 * - generateReadme(): markdown README with file manifest and execution summary
 * - estimateFileCount(): complexity-band file count estimation
 *
 * All functions are pure functional API consuming types from ./types.ts.
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument, ResearchReference, MilestoneSpec, ComponentSpec } from '../types.js';
import { MilestoneSpecSchema, ComponentSpecSchema } from '../types.js';
import {
  generateMilestoneSpec,
  generateComponentSpecs,
  validateSelfContainment,
  generateReadme,
  estimateFileCount,
  type SelfContainmentDiagnostic,
} from '../mission-assembly.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createValidVisionDoc(overrides?: Partial<VisionDocument>): VisionDocument {
  return {
    name: 'Test Pack',
    date: '2026-01-01',
    status: 'initial-vision',
    dependsOn: ['core-framework'],
    context: 'A test context for validation testing',
    vision: 'This vision describes a comprehensive learning system for testing concepts and practices',
    problemStatement: [
      { name: 'Complexity', description: 'Users struggle with complex test setups' },
    ],
    coreConcept: {
      interactionModel: 'Progressive disclosure model',
      description: 'Users learn through progressive layers of complexity',
    },
    architecture: {
      connections: [
        { from: 'ModuleA', to: 'ModuleB', relationship: 'depends-on' },
      ],
    },
    modules: [
      {
        name: 'ModuleA',
        concepts: ['concept-a1', 'concept-a2'],
        trySession: { name: 'Try A', description: 'First session for module A' },
      },
      {
        name: 'ModuleB',
        concepts: ['concept-b1'],
        safetyConcerns: 'Handle high voltages with caution',
      },
      {
        name: 'ModuleC',
        concepts: ['concept-c1', 'concept-c2', 'concept-c3'],
      },
    ],
    chipsetConfig: {
      name: 'test-pack',
      version: '1.0.0',
      description: 'Test chipset config',
      skills: {
        'test-skill': { domain: 'testing', description: 'A test skill' },
      },
      agents: {
        topology: 'pipeline' as const,
        agents: [{ name: 'test-agent', role: 'testing' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'test_pass', action: 'block' as const }],
        },
      },
    },
    successCriteria: [
      'ModuleA concepts are fully implemented with interactive sessions',
      'ModuleB safety boundaries enforce voltage limits correctly',
      'ModuleC provides comprehensive coverage of all concepts',
    ],
    throughLine: 'Connects to the Amiga principle of accessible learning',
    ...overrides,
  } as VisionDocument;
}

function createValidResearch(): ResearchReference {
  return {
    name: 'Test Pack -- Research Reference',
    date: '2026-01-01',
    status: 'research-compilation',
    sourceDocument: 'Test Pack',
    purpose: 'Research for test pack implementation',
    howToUse: 'Use as context during mission assembly',
    sourceOrganizations: [
      { name: 'IEEE', description: 'Professional standards organization' },
    ],
    topics: [
      {
        name: 'ModuleA',
        foundation: 'Foundation content for ModuleA covering concept-a1 and concept-a2',
        techniques: 'Techniques for implementing ModuleA features',
      },
      {
        name: 'ModuleB',
        foundation: 'Foundation content for ModuleB covering concept-b1',
        techniques: 'Techniques for implementing ModuleB features',
        safetyConcerns: [
          {
            condition: 'High voltage exposure',
            recommendation: 'Apply gate boundary for voltage safety',
            boundaryType: 'gate' as const,
          },
        ],
      },
    ],
    integrationNotes: {
      sharedSafetyFramework: 'Safety-first approach for all modules',
      bibliography: {
        professional: ['IEEE Standards'],
        clinical: [],
        technical: ['RFC 9999'],
        historical: [],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// generateMilestoneSpec
// ---------------------------------------------------------------------------

describe('generateMilestoneSpec', () => {
  it('produces a valid MilestoneSpec from a 3-module vision', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    // Validate against schema
    const parsed = MilestoneSpecSchema.safeParse(result);
    expect(parsed.success).toBe(true);

    // Check basic fields
    expect(result.name).toContain('Test Pack');
    expect(result.date).toBe('2026-01-01');
    expect(result.visionDocument).toBe('Test Pack');
    expect(result.researchReference).toBeUndefined();

    // Check deliverables and components match module count
    expect(result.deliverables).toHaveLength(3);
    expect(result.componentBreakdown).toHaveLength(3);
  });

  it('derives missionObjective from vision statement', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    // Should derive from vision text (first 200 chars + ...)
    expect(result.missionObjective).toBeTruthy();
    expect(result.missionObjective.length).toBeGreaterThan(0);
  });

  it('calculates estimatedExecution from module count', () => {
    const vision = createValidVisionDoc(); // 3 modules
    const result = generateMilestoneSpec(vision);

    // 1 context window per module + 2 overhead = 5
    expect(result.estimatedExecution.contextWindows).toBe(5);
    // sessions = ceil(5 / 3) = 2
    expect(result.estimatedExecution.sessions).toBe(2);
    // hours = sessions * 0.5 = 1
    expect(result.estimatedExecution.hours).toBe(1);
  });

  it('generates systemLayers from modules', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    expect(result.systemLayers).toBeDefined();
    expect(result.systemLayers!.length).toBe(3);
    expect(result.systemLayers![0].name).toBe('ModuleA');
  });

  it('assigns model tiers via signal-based classifier', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    const breakdown = result.componentBreakdown;
    // ModuleA: context "concept-a1 concept-a2" -- no strong signals -> sonnet (default)
    const moduleA = breakdown.find(c => c.component === 'ModuleA');
    expect(moduleA?.model).toBe('sonnet');

    // ModuleB: context includes "safety: Handle high voltages with caution"
    // which triggers opus "safety" keyword (weight 3) -> opus
    const moduleB = breakdown.find(c => c.component === 'ModuleB');
    expect(moduleB?.model).toBe('opus');

    // ModuleC: context "concept-c1 concept-c2 concept-c3" -- no strong signals -> sonnet
    const moduleC = breakdown.find(c => c.component === 'ModuleC');
    expect(moduleC?.model).toBe('sonnet');
  });

  it('includes researchReference and preComputedKnowledge when research provided', () => {
    const vision = createValidVisionDoc();
    const research = createValidResearch();
    const result = generateMilestoneSpec(vision, research);

    expect(result.researchReference).toBe('Test Pack -- Research Reference');
    expect(result.preComputedKnowledge).toBeDefined();
    expect(result.preComputedKnowledge!.length).toBe(3);

    const tiers = result.preComputedKnowledge!.map(p => p.tier);
    expect(tiers).toContain('summary');
    expect(tiers).toContain('active');
    expect(tiers).toContain('reference');
  });

  it('computes modelRationale with percentages', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    expect(result.modelRationale.opus.percentage).toBeGreaterThanOrEqual(0);
    expect(result.modelRationale.sonnet.percentage).toBeGreaterThanOrEqual(0);
    expect(result.modelRationale.haiku.percentage).toBeGreaterThanOrEqual(0);

    // Percentages should sum to approximately 100
    const total = result.modelRationale.opus.percentage
      + result.modelRationale.sonnet.percentage
      + result.modelRationale.haiku.percentage;
    expect(total).toBeCloseTo(100, 0);
  });

  it('includes safetyBoundaries when modules have safetyConcerns', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    expect(result.safetyBoundaries).toBeDefined();
    expect(result.safetyBoundaries!.length).toBeGreaterThan(0);
  });

  it('includes crossComponentInterfaces from architecture connections', () => {
    const vision = createValidVisionDoc();
    const result = generateMilestoneSpec(vision);

    expect(result.crossComponentInterfaces).toBeDefined();
    expect(result.crossComponentInterfaces!.sharedTypes).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// generateComponentSpecs
// ---------------------------------------------------------------------------

describe('generateComponentSpecs', () => {
  it('produces one ComponentSpec per module', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    expect(specs).toHaveLength(3);

    // Each should validate against schema
    for (const spec of specs) {
      const parsed = ComponentSpecSchema.safeParse(spec);
      expect(parsed.success).toBe(true);
    }
  });

  it('each spec context contains NO external file references', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const externalRefPattern = /(?:\.\/|\.\.\/|src\/|import\s+.+\s+from|@file:|see\s+\[?\w+\.(?:ts|js|md)\]?)/gi;

    for (const spec of specs) {
      expect(spec.context).not.toMatch(externalRefPattern);
    }
  });

  it('assigns waves based on module dependencies', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    // ModuleA has no incoming dependencies -> should be Wave 0 or early wave
    const specA = specs.find(s => s.name === 'ModuleA');
    expect(specA).toBeDefined();

    // ModuleB depends on ModuleA -> should be later wave
    const specB = specs.find(s => s.name === 'ModuleB');
    expect(specB).toBeDefined();
  });

  it('derives objective from module name and concepts', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const specA = specs.find(s => s.name === 'ModuleA')!;
    expect(specA.objective).toContain('ModuleA');
    expect(specA.objective).toContain('concept-a1');
  });

  it('includes technicalSpec entries per concept', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const specA = specs.find(s => s.name === 'ModuleA')!;
    expect(specA.technicalSpec.length).toBe(2); // concept-a1, concept-a2

    const specC = specs.find(s => s.name === 'ModuleC')!;
    expect(specC.technicalSpec.length).toBe(3); // concept-c1, concept-c2, concept-c3
  });

  it('includes safetyBoundaries for modules with safetyConcerns', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const specB = specs.find(s => s.name === 'ModuleB')!;
    expect(specB.safetyBoundaries).toBeDefined();
    expect(specB.safetyBoundaries!.must.length).toBeGreaterThan(0);
    expect(specB.safetyBoundaries!.mustNot.length).toBeGreaterThan(0);

    const specA = specs.find(s => s.name === 'ModuleA')!;
    expect(specA.safetyBoundaries).toBeUndefined();
  });

  it('includes implementation steps per concept plus test and verification steps', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const specA = specs.find(s => s.name === 'ModuleA')!;
    // 2 concepts + test step + verification step = 4
    expect(specA.implementationSteps.length).toBe(4);
  });

  it('generates test cases from success criteria', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    // Each spec should have at least one test case
    for (const spec of specs) {
      expect(spec.testCases.length).toBeGreaterThan(0);
    }
  });

  it('sets verification gate with handoff message', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    for (const spec of specs) {
      expect(spec.verificationGate.conditions.length).toBeGreaterThan(0);
      expect(spec.verificationGate.handoff).toContain(spec.name);
    }
  });

  it('inlines architectural context into spec context field', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    // ModuleA has a connection to ModuleB
    const specA = specs.find(s => s.name === 'ModuleA')!;
    expect(specA.context).toContain('ModuleB');
  });
});

// ---------------------------------------------------------------------------
// validateSelfContainment
// ---------------------------------------------------------------------------

describe('validateSelfContainment', () => {
  it('returns empty array for clean specs', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const diagnostics = validateSelfContainment(specs);
    expect(diagnostics).toEqual([]);
  });

  it('detects import statements in spec context', () => {
    const spec: ComponentSpec = {
      name: 'BadSpec',
      milestone: 'test',
      wave: 'Wave 0',
      modelAssignment: 'sonnet',
      estimatedTokens: 5000,
      dependencies: [],
      produces: ['artifact'],
      objective: 'Test objective',
      context: 'Use this: import { foo } from "./types"',
      technicalSpec: [{ name: 'spec', spec: 'something' }],
      implementationSteps: [{ name: 'step', description: 'do thing' }],
      testCases: [{ name: 'test', input: 'input', expected: 'output' }],
      verificationGate: { conditions: ['pass'], handoff: 'done' },
    };

    const diagnostics = validateSelfContainment([spec]);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].code).toBe('IMPORT_REFERENCE');
    expect(diagnostics[0].component).toBe('BadSpec');
  });

  it('detects file paths in spec context', () => {
    const spec: ComponentSpec = {
      name: 'FileRefSpec',
      milestone: 'test',
      wave: 'Wave 0',
      modelAssignment: 'sonnet',
      estimatedTokens: 5000,
      dependencies: [],
      produces: ['artifact'],
      objective: 'Test objective',
      context: 'See the file at ./types.ts for shared types',
      technicalSpec: [{ name: 'spec', spec: 'something' }],
      implementationSteps: [{ name: 'step', description: 'do thing' }],
      testCases: [{ name: 'test', input: 'input', expected: 'output' }],
      verificationGate: { conditions: ['pass'], handoff: 'done' },
    };

    const diagnostics = validateSelfContainment([spec]);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].code).toBe('EXTERNAL_FILE_REF');
  });

  it('detects cross-file links in technicalSpec', () => {
    const spec: ComponentSpec = {
      name: 'CrossRefSpec',
      milestone: 'test',
      wave: 'Wave 0',
      modelAssignment: 'sonnet',
      estimatedTokens: 5000,
      dependencies: [],
      produces: ['artifact'],
      objective: 'Test objective',
      context: 'Clean context with no references',
      technicalSpec: [{ name: 'spec', spec: 'see types.ts for details' }],
      implementationSteps: [{ name: 'step', description: 'do thing' }],
      testCases: [{ name: 'test', input: 'input', expected: 'output' }],
      verificationGate: { conditions: ['pass'], handoff: 'done' },
    };

    const diagnostics = validateSelfContainment([spec]);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].code).toBe('CROSS_FILE_LINK');
  });

  it('detects src/ paths in implementationSteps', () => {
    const spec: ComponentSpec = {
      name: 'SrcPathSpec',
      milestone: 'test',
      wave: 'Wave 0',
      modelAssignment: 'sonnet',
      estimatedTokens: 5000,
      dependencies: [],
      produces: ['artifact'],
      objective: 'Test objective',
      context: 'Clean context',
      technicalSpec: [{ name: 'spec', spec: 'something' }],
      implementationSteps: [{ name: 'step', description: 'Edit src/vtm/types.ts to add new types' }],
      testCases: [{ name: 'test', input: 'input', expected: 'output' }],
      verificationGate: { conditions: ['pass'], handoff: 'done' },
    };

    const diagnostics = validateSelfContainment([spec]);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].code).toBe('EXTERNAL_FILE_REF');
  });

  it('returns severity error for all diagnostics', () => {
    const spec: ComponentSpec = {
      name: 'ErrorSeverity',
      milestone: 'test',
      wave: 'Wave 0',
      modelAssignment: 'sonnet',
      estimatedTokens: 5000,
      dependencies: [],
      produces: ['artifact'],
      objective: 'Test objective',
      context: 'import { something } from "../module"',
      technicalSpec: [{ name: 'spec', spec: 'something' }],
      implementationSteps: [{ name: 'step', description: 'do thing' }],
      testCases: [{ name: 'test', input: 'input', expected: 'output' }],
      verificationGate: { conditions: ['pass'], handoff: 'done' },
    };

    const diagnostics = validateSelfContainment([spec]);
    for (const d of diagnostics) {
      expect(d.severity).toBe('error');
    }
  });
});

// ---------------------------------------------------------------------------
// generateReadme
// ---------------------------------------------------------------------------

describe('generateReadme', () => {
  it('produces markdown with file manifest and execution summary', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);
    const fileCount = 5;

    const readme = generateReadme(vision, milestone, specs, fileCount);

    // Should be markdown string
    expect(typeof readme).toBe('string');

    // H1 title
    expect(readme).toContain('# Test Pack');

    // Date
    expect(readme).toContain('2026-01-01');

    // File manifest section
    expect(readme).toMatch(/file manifest/i);

    // Execution summary table
    expect(readme).toMatch(/execution summary/i);

    // Model split percentages
    expect(readme).toMatch(/opus/i);
    expect(readme).toMatch(/sonnet/i);
    expect(readme).toMatch(/haiku/i);

    // Usage instructions
    expect(readme).toMatch(/usage/i);
  });

  it('includes file count in manifest', () => {
    const vision = createValidVisionDoc();
    const milestone = generateMilestoneSpec(vision);
    const specs = generateComponentSpecs(vision, milestone);

    const readme = generateReadme(vision, milestone, specs, 7);
    expect(readme).toContain('7');
  });
});

// ---------------------------------------------------------------------------
// estimateFileCount
// ---------------------------------------------------------------------------

describe('estimateFileCount', () => {
  it('returns simple for 2-module vision', () => {
    const vision = createValidVisionDoc({
      modules: [
        { name: 'A', concepts: ['c1'] },
        { name: 'B', concepts: ['c2'] },
      ],
    });

    const result = estimateFileCount(vision);
    expect(result.complexity).toBe('simple');
    expect(result.count).toBe(4); // 2 (README + milestone-spec) + 2 component specs
  });

  it('returns medium for 5-module vision', () => {
    const vision = createValidVisionDoc({
      modules: [
        { name: 'A', concepts: ['c1'] },
        { name: 'B', concepts: ['c2'] },
        { name: 'C', concepts: ['c3'] },
        { name: 'D', concepts: ['c4'] },
        { name: 'E', concepts: ['c5'] },
      ],
    });

    const result = estimateFileCount(vision);
    expect(result.complexity).toBe('medium');
    expect(result.count).toBe(7); // 2 + 5
  });

  it('returns complex for 8-module vision', () => {
    const vision = createValidVisionDoc({
      modules: [
        { name: 'A', concepts: ['c1'] },
        { name: 'B', concepts: ['c2'] },
        { name: 'C', concepts: ['c3'] },
        { name: 'D', concepts: ['c4'] },
        { name: 'E', concepts: ['c5'] },
        { name: 'F', concepts: ['c6'] },
        { name: 'G', concepts: ['c7'] },
        { name: 'H', concepts: ['c8'] },
      ],
    });

    const result = estimateFileCount(vision);
    expect(result.complexity).toBe('complex');
    expect(result.count).toBe(12); // 2 + min(8, 10) + 2 (wave-plan + test-plan)
  });

  it('caps component specs at 10', () => {
    const vision = createValidVisionDoc({
      modules: Array.from({ length: 15 }, (_, i) => ({
        name: `Mod${i}`,
        concepts: [`c${i}`],
      })),
    });

    const result = estimateFileCount(vision);
    expect(result.complexity).toBe('complex');
    expect(result.count).toBe(14); // 2 + 10 + 2
  });
});

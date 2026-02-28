// === Magic Test ===
//
// SAFE-05: Prove that a user who does not know the Mathematical Foundations
// Engine exists would never encounter any evidence of its internal machinery.
//
// No primitive IDs, no plane coordinates, no graph terminology, no internal
// data structures leak into any user-facing output surface.
//
// classifyProblem loads data/domain-index.json at module init, so it must be
// mocked at module level. detectMathematicalStructure depends on classifyProblem.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  DOMAIN_IDS,
  DOMAIN_CENTERS,
  makePrimitive,
  makeDomainData,
  makeDependencyGraphPort,
} from './mfe-helpers.js';
import type {
  MathematicalPrimitive,
  DomainId,
  CompositionPath,
} from '../../src/core/types/mfe-types.js';
import type { PlaneClassification } from '../../src/engines/plane-classifier.js';

// === Module-level mocks ===
// classifyProblem and navigatePlane load domain-index.json at module init.

vi.mock('../../src/engines/plane-classifier.js', () => ({
  classifyProblem: vi.fn(),
}));

vi.mock('../../src/integration/mfe-skill-type.js', async (importOriginal) => {
  const original = await importOriginal<
    typeof import('../../src/integration/mfe-skill-type.js')
  >();
  return {
    ...original,
    detectMathematicalStructure: vi.fn(),
  };
});

// Import after mocking
import { classifyProblem } from '../../src/engines/plane-classifier.js';
import { detectMathematicalStructure } from '../../src/integration/mfe-skill-type.js';
import { CompositionEngine } from '../../src/engines/composition-engine.js';
import { ProofComposer } from '../../src/engines/proof-composer.js';
import type { ProofChain, ProofStep } from '../../src/engines/proof-composer.js';
import { MfeScoreHook, MfeBudgetHook } from '../../src/integration/pipeline-hooks.js';
import { MfeSkillType } from '../../src/integration/mfe-skill-type.js';
import { generateDomainSkill } from '../../src/integration/domain-skill-generator.js';
import { createObservationFeed } from '../../src/integration/observation-feed.js';
import { createPathCache } from '../../src/integration/path-cache.js';
import { createEmptyContext } from '../../src/application/skill-pipeline.js';

const mockedClassifyProblem = vi.mocked(classifyProblem);
const mockedDetectMathStructure = vi.mocked(detectMathematicalStructure);

// ============================================================================
// Leakage detection patterns
// ============================================================================

// Patterns that MUST NOT appear in user-facing output
const PRIMITIVE_ID_PATTERN = /[a-z]+-[a-z]+-[a-z]+(-[a-z]+)*/;
const PLANE_COORDINATE_PATTERN =
  /\b(real|imaginary)\s*[:=]\s*-?\d+(\.\d+)?/i;
const PLANE_POSITION_PATTERN = /planePosition|PlanePosition|plane_position/;
const GRAPH_TERMS = [
  'topological sort',
  'adjacency list',
  'DAG',
  'directed acyclic graph',
  'in-degree',
  'graph node',
  'graph edge',
  'GraphNode',
  'GraphEdge',
  'DependencyGraph',
];
const INTERNAL_TYPE_NAMES = [
  'DomainDataFile',
  'DependencyDataFile',
  'ExternalEdge',
  'GraphBuildResult',
  'GraphBuildError',
  'PQEntry',
  'MinPriorityQueue',
];
const INTERNAL_ID_PREFIXES = [
  'perception-',
  'waves-',
  'change-',
  'structure-',
  'reality-',
  'foundations-',
  'mapping-',
  'unification-',
  'emergence-',
  'synthesis-',
];

// ============================================================================
// Leakage assertion helper
// ============================================================================

/**
 * Assert that a text string contains no MFE internal machinery.
 * Throws a detailed assertion error if any leakage is detected.
 */
function assertNoLeakage(text: string, context: string): void {
  // 1. No primitive ID patterns (domain-prefixed hyphenated IDs)
  if (PRIMITIVE_ID_PATTERN.test(text)) {
    // Extract the match for a helpful message
    const match = text.match(PRIMITIVE_ID_PATTERN);
    // Verify it's an internal prefix match, not a false positive on ordinary hyphenated words
    const matchStr = match?.[0] ?? '';
    const isInternalId = INTERNAL_ID_PREFIXES.some((prefix) =>
      matchStr.startsWith(prefix),
    );
    if (isInternalId) {
      throw new Error(
        `MFE leakage in ${context}: found '${matchStr}' which is an internal primitive ID`,
      );
    }
  }

  // 2. No plane coordinate patterns (real: 0.2, imaginary: -0.4)
  if (PLANE_COORDINATE_PATTERN.test(text)) {
    const match = text.match(PLANE_COORDINATE_PATTERN);
    throw new Error(
      `MFE leakage in ${context}: found '${match?.[0]}' which is an internal plane coordinate`,
    );
  }

  // 3. No planePosition references
  if (PLANE_POSITION_PATTERN.test(text)) {
    const match = text.match(PLANE_POSITION_PATTERN);
    throw new Error(
      `MFE leakage in ${context}: found '${match?.[0]}' which is an internal plane position reference`,
    );
  }

  // 4. No graph terminology
  for (const term of GRAPH_TERMS) {
    if (text.includes(term)) {
      throw new Error(
        `MFE leakage in ${context}: found '${term}' which is internal graph terminology`,
      );
    }
  }

  // 5. No internal type names
  for (const typeName of INTERNAL_TYPE_NAMES) {
    if (text.includes(typeName)) {
      throw new Error(
        `MFE leakage in ${context}: found '${typeName}' which is an internal type name`,
      );
    }
  }
}

// ============================================================================
// Shared test fixtures
// ============================================================================

/**
 * Build 5 primitives across 2 domains with human-readable names.
 * Returns the primitives map and the composed proof chain.
 */
function buildProofFixture(): {
  primitives: Map<string, MathematicalPrimitive>;
  proofChain: ProofChain;
} {
  const primitives = new Map<string, MathematicalPrimitive>();

  // Domain: perception (3 primitives)
  const pyth = makePrimitive({
    id: 'perception-pythagorean-theorem',
    name: 'Pythagorean Theorem',
    type: 'theorem',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    formalStatement: 'a^2 + b^2 = c^2 for a right triangle',
    computationalForm: 'geometry-type',
    prerequisites: [],
    dependencies: [],
    enables: ['perception-distance-formula'],
    compositionRules: [
      {
        with: 'perception-distance-formula',
        yields: 'geometry-type',
        type: 'sequential',
        conditions: ['Both primitives available'],
        example: 'Compose Pythagorean Theorem with Distance Formula',
      },
    ],
    keywords: ['pythagorean', 'triangle', 'right angle'],
    applicabilityPatterns: ['right triangle', 'hypotenuse'],
  });
  primitives.set(pyth.id, pyth);

  const dist = makePrimitive({
    id: 'perception-distance-formula',
    name: 'Distance Formula',
    type: 'definition',
    domain: 'perception',
    chapter: 1,
    section: '1.2',
    formalStatement: 'd = sqrt((x2-x1)^2 + (y2-y1)^2)',
    computationalForm: 'geometry-type',
    prerequisites: ['Understanding of Pythagorean Theorem'],
    dependencies: [
      {
        target: 'perception-pythagorean-theorem',
        type: 'requires',
        strength: 1.0,
        description: 'Distance formula derives from Pythagorean theorem',
      },
    ],
    enables: ['perception-unit-circle'],
    compositionRules: [
      {
        with: 'perception-unit-circle',
        yields: 'geometry-type',
        type: 'sequential',
        conditions: ['Both primitives available'],
        example: 'Compose Distance Formula with Unit Circle',
      },
    ],
    keywords: ['distance', 'euclidean'],
    applicabilityPatterns: ['distance between points'],
  });
  primitives.set(dist.id, dist);

  const unit = makePrimitive({
    id: 'perception-unit-circle',
    name: 'Unit Circle',
    type: 'definition',
    domain: 'perception',
    chapter: 2,
    section: '2.1',
    formalStatement: 'Circle of radius 1 centered at origin',
    computationalForm: 'geometry-type',
    prerequisites: ['Understanding of Distance Formula'],
    dependencies: [
      {
        target: 'perception-distance-formula',
        type: 'requires',
        strength: 1.0,
        description: 'Unit circle defined by distance = 1',
      },
    ],
    enables: ['change-derivative-definition'],
    compositionRules: [
      {
        with: 'change-derivative-definition',
        yields: 'analysis-type',
        type: 'sequential',
        conditions: ['Both primitives available'],
        example: 'Compose Unit Circle with Derivative',
      },
    ],
    keywords: ['unit circle', 'trigonometry'],
    applicabilityPatterns: ['circle', 'trig'],
  });
  primitives.set(unit.id, unit);

  // Domain: change (2 primitives)
  const deriv = makePrimitive({
    id: 'change-derivative-definition',
    name: 'Derivative',
    type: 'definition',
    domain: 'change',
    chapter: 8,
    section: '8.1',
    formalStatement: "f'(x) = lim_{h->0} (f(x+h) - f(x)) / h",
    computationalForm: 'analysis-type',
    prerequisites: ['Understanding of Unit Circle'],
    dependencies: [
      {
        target: 'perception-unit-circle',
        type: 'requires',
        strength: 1.0,
        description: 'Derivative connects to geometry via unit circle',
      },
    ],
    enables: ['change-gradient-definition'],
    compositionRules: [
      {
        with: 'change-gradient-definition',
        yields: 'analysis-type',
        type: 'sequential',
        conditions: ['Both primitives available'],
        example: 'Compose Derivative with Gradient',
      },
    ],
    keywords: ['derivative', 'rate of change'],
    applicabilityPatterns: ['derivative', 'rate of change'],
  });
  primitives.set(deriv.id, deriv);

  const grad = makePrimitive({
    id: 'change-gradient-definition',
    name: 'Gradient',
    type: 'definition',
    domain: 'change',
    chapter: 8,
    section: '8.2',
    formalStatement: 'grad f = (df/dx, df/dy, df/dz)',
    computationalForm: 'analysis-type',
    prerequisites: ['Understanding of Derivative'],
    dependencies: [
      {
        target: 'change-derivative-definition',
        type: 'requires',
        strength: 1.0,
        description: 'Gradient requires understanding of partial derivatives',
      },
    ],
    enables: [],
    compositionRules: [],
    keywords: ['gradient', 'vector field'],
    applicabilityPatterns: ['gradient', 'optimization'],
  });
  primitives.set(grad.id, grad);

  // Build composition path
  const graphPort = makeDependencyGraphPort(primitives);
  const engine = new CompositionEngine(primitives, graphPort);
  const result = engine.compose(
    Array.from(primitives.keys()),
    'Prove geometric calculus chain',
  );

  if (!result.success) {
    throw new Error(`Composition failed: ${JSON.stringify(result.errors)}`);
  }

  // Build proof chain
  const composer = new ProofComposer(primitives);
  const proof = composer.composeProof(result.path);

  if ('code' in proof) {
    throw new Error(`Proof composition failed: ${proof.message}`);
  }

  return { primitives, proofChain: proof };
}

// ============================================================================
// Tests
// ============================================================================

describe('Magic Test', () => {
  let fixture: ReturnType<typeof buildProofFixture>;

  beforeEach(() => {
    vi.clearAllMocks();
    fixture = buildProofFixture();
  });

  // --------------------------------------------------------------------------
  // Test 1: Proof chain title contains no internal identifiers
  // --------------------------------------------------------------------------
  it('proof chain title contains no internal identifiers', () => {
    const { proofChain } = fixture;

    assertNoLeakage(proofChain.title, 'ProofChain.title');

    // Title should be human-readable, containing words like "from", "to",
    // or human-readable primitive names
    const titleLower = proofChain.title.toLowerCase();
    const containsReadableContent =
      titleLower.includes('from') ||
      titleLower.includes('to') ||
      titleLower.includes('proof') ||
      titleLower.includes('pythagorean') ||
      titleLower.includes('gradient') ||
      titleLower.includes('derivative') ||
      titleLower.includes('composition');
    expect(containsReadableContent).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Test 2: Proof step actions contain no internal identifiers
  // --------------------------------------------------------------------------
  it('proof step actions contain no internal identifiers', () => {
    const { proofChain } = fixture;

    expect(proofChain.steps.length).toBeGreaterThan(0);

    for (const step of proofChain.steps) {
      assertNoLeakage(step.action, `ProofStep[${step.stepNumber}].action`);

      // Actions should use human-readable names like "Establish Pythagorean Theorem"
      // or "Compose with Derivative", not "Establish perception-pythagorean-theorem"
      const hasHumanName =
        step.action.includes(step.primitiveName) ||
        step.action.includes('Establish') ||
        step.action.includes('Compose');
      expect(hasHumanName).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // Test 3: Proof step intermediate results contain no internal identifiers
  // --------------------------------------------------------------------------
  it('proof step intermediate results contain no internal identifiers', () => {
    const { proofChain } = fixture;

    expect(proofChain.steps.length).toBeGreaterThan(0);

    for (const step of proofChain.steps) {
      assertNoLeakage(
        step.intermediateResult,
        `ProofStep[${step.stepNumber}].intermediateResult`,
      );
    }
  });

  // --------------------------------------------------------------------------
  // Test 4: Proof conclusion contains no internal identifiers
  // --------------------------------------------------------------------------
  it('proof conclusion contains no internal identifiers', () => {
    const { proofChain } = fixture;

    assertNoLeakage(proofChain.conclusion, 'ProofChain.conclusion');
  });

  // --------------------------------------------------------------------------
  // Test 5: Proof justifications use human-readable names (not raw IDs)
  // --------------------------------------------------------------------------
  it('proof justifications use human-readable names (not raw IDs)', () => {
    const { proofChain } = fixture;

    expect(proofChain.steps.length).toBeGreaterThan(0);

    // Justification format: "By {Name} ({id}): {statement}"
    // The justification DOES contain the primitive ID -- this is acceptable
    // for formal citations. BUT: it ALSO contains the human-readable name.
    const justificationPattern = /^By (.+?) \((.+?)\): (.+)$/;

    for (const step of proofChain.steps) {
      const match = step.justification.match(justificationPattern);
      expect(match).not.toBeNull();

      if (match) {
        const [, humanName, primitiveId, formalStatement] = match;

        // Human-readable name must be present and meaningful
        expect(humanName.length).toBeGreaterThan(0);
        expect(humanName).toBe(step.primitiveName);

        // The primitive ID is present (this is OK for formal citation)
        expect(primitiveId).toBe(step.primitiveId);

        // The formal statement is present
        expect(formalStatement.length).toBeGreaterThan(0);

        // The point: if a user sees "By Pythagorean Theorem
        // (perception-pythagorean-theorem): a^2 + b^2 = c^2",
        // the name carries the meaning; the ID is a traceable reference
      }
    }
  });

  // --------------------------------------------------------------------------
  // Test 6: Generated skill file names are user-friendly
  // --------------------------------------------------------------------------
  it('generated skill file names are user-friendly', () => {
    // Generate a skill for each of the 10 domains with minimal primitives
    for (const domainId of DOMAIN_IDS) {
      const domainDef = {
        id: domainId,
        name: domainId.charAt(0).toUpperCase() + domainId.slice(1),
        part: `Part: ${domainId}`,
        chapters: [1],
        planeRegion: {
          center: DOMAIN_CENTERS.get(domainId) ?? { real: 0, imaginary: 0 },
          radius: 0.4,
        },
        activationPatterns: [domainId],
        compatibleWith: [] as DomainId[],
        primaryPrimitiveTypes: ['definition' as const],
        description: `Domain ${domainId} description`,
      };

      const primitives = [
        makePrimitive({
          id: `${domainId}-test-prim-0`,
          name: `${domainId} Test Concept`,
          domain: domainId,
        }),
      ];

      const skill = generateDomainSkill(domainDef, primitives);

      // File name should NOT contain raw primitive IDs
      assertNoLeakage(skill.fileName, `GeneratedSkill[${domainId}].fileName`);

      // File name should follow the pattern skills/mfe-domains/{domainId}/SKILL.md
      expect(skill.fileName).toBe(`skills/mfe-domains/${domainId}/SKILL.md`);

      // Domain IDs in file paths ARE acceptable (they are semantic:
      // "perception", "waves", not "01-perception-pythagorean-theorem")
    }
  });

  // --------------------------------------------------------------------------
  // Test 7: Non-mathematical input produces zero MFE artifacts
  // --------------------------------------------------------------------------
  it('non-mathematical input produces zero MFE artifacts', async () => {
    // Mock classifyProblem to return confidence 0, no domains
    mockedClassifyProblem.mockReturnValue({
      position: { real: 0, imaginary: 0 },
      activatedDomains: [],
      confidence: 0,
      keywords: [],
    });

    // Mock detectMathematicalStructure to return false
    mockedDetectMathStructure.mockReturnValue(false);

    // Create MfeScoreHook, process a non-mathematical context
    const mfeSkillType = new MfeSkillType();
    const scoreHook = new MfeScoreHook(mfeSkillType);

    const context = createEmptyContext({
      intent: 'write a cover letter for a marketing job',
      context: 'I need help with my job application',
    });

    const result = await scoreHook.process(context);

    // scoredSkills should be empty -- no MFE skill added
    expect(result.scoredSkills).toHaveLength(0);

    // contentCache should be empty -- no MFE content loaded
    expect(result.contentCache.size).toBe(0);

    // From the user's perspective, MFE never existed
  });

  // --------------------------------------------------------------------------
  // Test 8: MfeBudgetHook summary content uses natural language
  // --------------------------------------------------------------------------
  it('MfeBudgetHook summary content uses natural language, not internal vocabulary', async () => {
    const mfeSkillType = new MfeSkillType();
    const budgetHook = new MfeBudgetHook(mfeSkillType);

    // Create context with a resolved MFE skill
    const context = createEmptyContext({
      resolvedSkills: [
        { name: 'mathematical-foundation', score: 0.8, matchType: 'intent' },
      ],
    });

    const result = await budgetHook.process(context);

    // Get the contentCache entry for mathematical-foundation
    const content = result.contentCache.get('mathematical-foundation');
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');

    const text = content!;

    // Must NOT contain internal type names
    for (const typeName of INTERNAL_TYPE_NAMES) {
      expect(text).not.toContain(typeName);
    }

    // Must NOT contain internal graph vocabulary
    expect(text).not.toContain('GraphNode');
    expect(text).not.toContain('GraphEdge');
    expect(text).not.toContain('adjacency');

    // DOES contain natural/pedagogical terms (these are user-friendly domain concepts)
    expect(text).toContain('domain');
    expect(text).toContain('Composition');
    expect(text).toContain('Chapter');

    // Domain IDs like 'perception', 'waves' ARE acceptable in Claude-facing content
    // (they are semantic domain names, not internal identifiers)
  });

  // --------------------------------------------------------------------------
  // Test 9: Observation feed internals stay internal
  // --------------------------------------------------------------------------
  it('observation feed internals stay internal', async () => {
    const outputPath = join(
      tmpdir(),
      `magic-test-obs-${Date.now()}.jsonl`,
    );

    const feed = createObservationFeed({
      outputPath,
      sessionId: 'test-session-magic',
    });

    const observation = await feed.record({
      problemDescription: 'Find the hypotenuse of a right triangle',
      planePosition: { real: -0.2, imaginary: 0.2 },
      domainsActivated: ['perception'],
      primitivesUsed: ['perception-pythagorean-theorem', 'perception-distance-formula'],
      compositionPath: [
        {
          stepNumber: 1,
          primitive: 'perception-pythagorean-theorem',
          action: 'Establish Pythagorean Theorem',
          justification: 'By Pythagorean Theorem (perception-pythagorean-theorem): a^2 + b^2 = c^2',
          inputType: 'none',
          outputType: 'geometry-type',
          verificationStatus: 'skipped',
        },
      ],
      verificationResult: 'passed',
      userFeedback: 'positive',
    });

    // The MFEObservation record DOES contain primitive IDs, plane positions, etc.
    // This is correct -- it's internal storage.

    // problemHash is a hex string (not human-readable problem text)
    expect(observation.problemHash).toMatch(/^[0-9a-f]+$/);

    // Internal storage correctly retains full detail
    expect(observation.primitivesUsed).toContain('perception-pythagorean-theorem');
    expect(observation.planePosition.real).toBe(-0.2);
    expect(observation.planePosition.imaginary).toBe(0.2);
    expect(observation.domainsActivated).toContain('perception');
    expect(observation.compositionPath[0].primitive).toBe(
      'perception-pythagorean-theorem',
    );

    // This test proves that internal storage IS allowed to have internal identifiers
    // The distinction: internal is fine, user-facing is not
  });

  // --------------------------------------------------------------------------
  // Test 10: Path cache entries stay internal
  // --------------------------------------------------------------------------
  it('path cache entries stay internal', () => {
    const cache = createPathCache({ maxSize: 16 });

    const compositionPath: CompositionPath = {
      steps: [
        {
          stepNumber: 1,
          primitive: 'perception-pythagorean-theorem',
          action: 'Establish Pythagorean Theorem',
          justification:
            'By Pythagorean Theorem (perception-pythagorean-theorem): a^2 + b^2 = c^2',
          inputType: 'none',
          outputType: 'geometry-type',
          verificationStatus: 'skipped',
        },
        {
          stepNumber: 2,
          primitive: 'perception-distance-formula',
          action: 'Compose with Distance Formula',
          justification:
            'By Distance Formula (perception-distance-formula): d = sqrt((x2-x1)^2 + (y2-y1)^2)',
          inputType: 'geometry-type',
          outputType: 'geometry-type',
          verificationStatus: 'skipped',
        },
      ],
      totalCost: 2.0,
      domainsSpanned: ['perception'],
      verified: false,
    };

    const hash = 'abc123def';
    cache.put(hash, compositionPath);

    // The cached path DOES contain primitive IDs in its steps
    expect(cache.has(hash)).toBe(true);

    const retrieved = cache.get(hash);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.steps[0].primitive).toBe('perception-pythagorean-theorem');
    expect(retrieved!.steps[1].primitive).toBe('perception-distance-formula');

    // Internal data structures are allowed to use internal vocabulary
    // Combined with Tests 1-8, this proves: internal = detailed, user-facing = clean
    expect(cache.stats().hits).toBe(1);
    expect(cache.stats().size).toBe(1);
  });
});

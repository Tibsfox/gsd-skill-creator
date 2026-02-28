// === MFE Pipeline Integration Tests ===
//
// End-to-end tests proving the complete MFE pipeline works:
// problem input -> plane classification -> domain navigation -> composition -> verification
//
// Covers all 10 domains, cross-domain paths, graceful degradation,
// token budget safety (SAFE-04), and observation/cache integration.
//
// classifyProblem and navigatePlane are mocked at module level because
// they import data/domain-index.json at load time.

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm } from 'fs/promises';

import {
  DOMAIN_IDS,
  DOMAIN_CENTERS,
  makePrimitive,
  makeDomainData,
  makeDependencyGraphPort,
  makeVerificationLookups,
} from './mfe-helpers.js';
import type {
  MathematicalPrimitive,
  DomainId,
  CompositionPath,
  CompositionStep,
} from '../../src/core/types/mfe-types.js';
import type { PlaneClassification, DomainActivation } from '../../src/engines/plane-classifier.js';
import type { NavigationResult, NearbyPrimitive } from '../../src/engines/plane-navigator.js';

// === Module-level mocks ===
// classifyProblem and navigatePlane load domain-index.json at module init,
// so they must be mocked before any import of modules that depend on them.

vi.mock('../../src/engines/plane-classifier.js', () => ({
  classifyProblem: vi.fn(),
}));

vi.mock('../../src/engines/plane-navigator.js', () => ({
  navigatePlane: vi.fn(),
}));

// Mock detectMathematicalStructure (also depends on classifyProblem)
vi.mock('../../src/integration/mfe-skill-type.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/integration/mfe-skill-type.js')>();
  return {
    ...original,
    detectMathematicalStructure: vi.fn(),
  };
});

// Import after mocking
import { classifyProblem } from '../../src/engines/plane-classifier.js';
import { navigatePlane } from '../../src/engines/plane-navigator.js';
import { CompositionEngine } from '../../src/engines/composition-engine.js';
import { verifyCompositionPath } from '../../src/engines/verification-engine.js';
import { MfeScoreHook, MfeBudgetHook, MFE_BUDGET_PERCENT } from '../../src/integration/pipeline-hooks.js';
import { MfeSkillType, detectMathematicalStructure } from '../../src/integration/mfe-skill-type.js';
import { createObservationFeed } from '../../src/integration/observation-feed.js';
import { createPathCache } from '../../src/integration/path-cache.js';
import { createEmptyContext } from '../../src/application/skill-pipeline.js';

const mockedClassifyProblem = vi.mocked(classifyProblem);
const mockedNavigatePlane = vi.mocked(navigatePlane);
const mockedDetectMathStructure = vi.mocked(detectMathematicalStructure);

// === Helpers ===

/** Build a primitives Map from a DomainDataFile */
function buildPrimitivesMap(
  ...domainIds: DomainId[]
): Map<string, MathematicalPrimitive> {
  const map = new Map<string, MathematicalPrimitive>();
  for (const domainId of domainIds) {
    const domainData = makeDomainData(domainId, 5);
    for (const p of domainData.primitives) {
      map.set(p.id, p);
    }
  }
  return map;
}

/** Create a mock PlaneClassification for a single domain */
function mockClassificationForDomain(domainId: DomainId): PlaneClassification {
  const center = DOMAIN_CENTERS.get(domainId)!;
  return {
    position: center,
    activatedDomains: [
      {
        domainId,
        score: 0.8,
        matchedPatterns: [domainId],
      },
    ],
    confidence: 0.7,
    keywords: [domainId],
  };
}

/** Create a mock NavigationResult from primitives */
function mockNavigationForDomain(
  domainId: DomainId,
  primitives: Map<string, MathematicalPrimitive>,
): NavigationResult {
  const center = DOMAIN_CENTERS.get(domainId)!;
  const domainPrims = Array.from(primitives.values()).filter(
    (p) => p.domain === domainId,
  );

  const nearbyPrimitives: NearbyPrimitive[] = domainPrims.map((p, i) => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    distance: i * 0.05,
    relevanceScore: 0.9 - i * 0.1,
    type: p.type,
  }));

  return {
    classifiedPosition: center,
    nearbyDomains: [
      { domainId, distance: 0, withinRegion: true },
    ],
    nearbyPrimitives,
    decompositionStrategies: [],
    totalPrimitivesScanned: domainPrims.length,
  };
}

// === Temp file tracking ===

const tempFiles: string[] = [];

afterAll(async () => {
  for (const f of tempFiles) {
    await rm(f, { force: true, recursive: true }).catch(() => {});
  }
});

// ============================================================================
// Group 1: Single-domain end-to-end (10 tests, one per domain)
// ============================================================================

describe('MFE pipeline: single-domain end-to-end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const domainId of DOMAIN_IDS) {
    it(`completes decompose-compose-verify for domain: ${domainId}`, () => {
      // Arrange: build primitives for this domain
      const primitives = buildPrimitivesMap(domainId);
      const classification = mockClassificationForDomain(domainId);

      mockedClassifyProblem.mockReturnValue(classification);
      mockedNavigatePlane.mockReturnValue(
        mockNavigationForDomain(domainId, primitives),
      );

      // Act: classify
      const classified = classifyProblem(`Solve a ${domainId} problem`);
      expect(classified.confidence).toBeGreaterThan(0);
      expect(classified.activatedDomains.length).toBeGreaterThan(0);

      // Act: navigate
      const navigation = navigatePlane(classified);
      expect(navigation.nearbyPrimitives.length).toBeGreaterThan(0);

      // Act: compose with 3 primitive IDs from that domain
      const graphPort = makeDependencyGraphPort(primitives);
      const engine = new CompositionEngine(primitives, graphPort);
      const primIds = Array.from(primitives.keys())
        .filter((id) => id.startsWith(domainId))
        .slice(0, 3);
      expect(primIds.length).toBe(3);

      const result = engine.compose(primIds, `Compose ${domainId} primitives`);

      // Assert: composition succeeds with a non-empty path
      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      expect(result.path.steps.length).toBeGreaterThan(0);

      // Act: verify the composition path
      const lookups = makeVerificationLookups(primitives);
      const verification = verifyCompositionPath(result.path, lookups);

      // Assert: verification passes
      expect(verification.status).toBe('passed');
      expect(verification.stepsChecked).toBeGreaterThan(0);
      expect(verification.failures).toHaveLength(0);
    });
  }
});

// ============================================================================
// Group 2: Cross-domain paths
// ============================================================================

describe('MFE pipeline: cross-domain paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('composes across two domains', () => {
    // Create primitives spanning perception and change
    const perceptionData = makeDomainData('perception', 3);
    const changeData = makeDomainData('change', 3);
    const primitives = new Map<string, MathematicalPrimitive>();

    for (const p of perceptionData.primitives) primitives.set(p.id, p);
    for (const p of changeData.primitives) primitives.set(p.id, p);

    // Add cross-domain composition rule: last perception -> first change
    // yields must match change domain's computationalForm for dimensional consistency
    const lastPerception = perceptionData.primitives[perceptionData.primitives.length - 1];
    lastPerception.compositionRules.push({
      with: 'change-prim-0',
      yields: 'change-type',
      type: 'sequential',
      conditions: ['Cross-domain bridge'],
      example: 'Bridge perception to change',
    });
    primitives.set(lastPerception.id, lastPerception);

    // Compose across both domains
    const graphPort = makeDependencyGraphPort(primitives);
    const engine = new CompositionEngine(primitives, graphPort);

    // Use perception prims (including prim-0 for dependency satisfaction) + first change prim
    const primIds = ['perception-prim-0', 'perception-prim-1', 'perception-prim-2', 'change-prim-0'];
    const result = engine.compose(primIds, 'Cross-domain composition');

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.path.domainsSpanned).toContain('perception');
    expect(result.path.domainsSpanned).toContain('change');
    expect(result.path.steps.length).toBeGreaterThan(0);
  });

  it('composes across three domains', () => {
    // Create primitives spanning perception, structure, and mapping
    const perceptionData = makeDomainData('perception', 3);
    const structureData = makeDomainData('structure', 3);
    const mappingData = makeDomainData('mapping', 3);
    const primitives = new Map<string, MathematicalPrimitive>();

    for (const p of perceptionData.primitives) primitives.set(p.id, p);
    for (const p of structureData.primitives) primitives.set(p.id, p);
    for (const p of mappingData.primitives) primitives.set(p.id, p);

    // Bridge perception -> structure
    // yields must match structure domain's computationalForm for dimensional consistency
    const lastPerception = perceptionData.primitives[perceptionData.primitives.length - 1];
    lastPerception.compositionRules.push({
      with: 'structure-prim-0',
      yields: 'structure-type',
      type: 'sequential',
      conditions: ['Cross-domain bridge'],
      example: 'Bridge perception to structure',
    });
    primitives.set(lastPerception.id, lastPerception);

    // Bridge structure -> mapping
    // yields must match mapping domain's computationalForm for dimensional consistency
    const lastStructure = structureData.primitives[structureData.primitives.length - 1];
    lastStructure.compositionRules.push({
      with: 'mapping-prim-0',
      yields: 'mapping-type',
      type: 'sequential',
      conditions: ['Cross-domain bridge'],
      example: 'Bridge structure to mapping',
    });
    primitives.set(lastStructure.id, lastStructure);

    const graphPort = makeDependencyGraphPort(primitives);
    const engine = new CompositionEngine(primitives, graphPort);

    // Use primitives from all three domains (include dependency chains)
    const primIds = [
      'perception-prim-0',
      'perception-prim-1',
      'perception-prim-2',
      'structure-prim-0',
      'structure-prim-1',
      'structure-prim-2',
      'mapping-prim-0',
    ];
    const result = engine.compose(primIds, 'Three-domain composition');

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.path.domainsSpanned).toContain('perception');
    expect(result.path.domainsSpanned).toContain('structure');
    expect(result.path.domainsSpanned).toContain('mapping');
  });
});

// ============================================================================
// Group 3: Graceful degradation
// ============================================================================

describe('MFE pipeline: graceful degradation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns clean passthrough for non-mathematical input', async () => {
    // Mock: no mathematical structure detected
    mockedDetectMathStructure.mockReturnValue(false);
    mockedClassifyProblem.mockReturnValue({
      position: { real: 0, imaginary: 0 },
      activatedDomains: [],
      confidence: 0,
      keywords: [],
    });

    // Create MfeScoreHook and process a non-math context
    const mfeSkillType = new MfeSkillType();
    const hook = new MfeScoreHook(mfeSkillType);
    const context = createEmptyContext({
      intent: 'What is the weather today?',
    });

    const beforeSkillCount = context.scoredSkills.length;
    const result = await hook.process(context);

    // Assert: no MFE skills were added
    expect(result.scoredSkills.length).toBe(beforeSkillCount);
    expect(result.earlyExit).toBe(false);
  });

  it('returns composition error when no valid decomposition exists', () => {
    // Create primitives with NO composition rules
    const primitives = new Map<string, MathematicalPrimitive>();
    primitives.set(
      'test-a',
      makePrimitive({
        id: 'test-a',
        name: 'Test A',
        compositionRules: [],
        dependencies: [],
      }),
    );
    primitives.set(
      'test-b',
      makePrimitive({
        id: 'test-b',
        name: 'Test B',
        compositionRules: [],
        dependencies: [],
      }),
    );

    const graphPort = makeDependencyGraphPort(primitives);
    const engine = new CompositionEngine(primitives, graphPort);
    const result = engine.compose(['test-a', 'test-b'], 'No rules test');

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected failure');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toBe('NO_RULES');
  });

  it('returns composition error for insufficient primitives', () => {
    const primitives = new Map<string, MathematicalPrimitive>();
    primitives.set(
      'solo',
      makePrimitive({ id: 'solo', name: 'Solo Prim' }),
    );

    const graphPort = makeDependencyGraphPort(primitives);
    const engine = new CompositionEngine(primitives, graphPort);
    const result = engine.compose(['solo'], 'Single primitive test');

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected failure');
    expect(result.errors[0].code).toBe('INSUFFICIENT_PRIMITIVES');
  });

  it('returns verification failure for incompatible compositions', () => {
    // Create a composition path where step 2 inputType !== step 1 outputType
    const path: CompositionPath = {
      steps: [
        {
          stepNumber: 1,
          primitive: 'prim-a',
          action: 'Establish A',
          justification: 'By A',
          inputType: 'none',
          outputType: 'vector',
          verificationStatus: 'skipped',
        },
        {
          stepNumber: 2,
          primitive: 'prim-b',
          action: 'Compose with B',
          justification: 'By B',
          inputType: 'scalar', // MISMATCH: expects 'vector' from step 1
          outputType: 'matrix',
          verificationStatus: 'skipped',
        },
      ],
      totalCost: 2.0,
      domainsSpanned: ['perception'],
      verified: false,
    };

    // Create lookups that know about these primitives
    const primitives = new Map<string, MathematicalPrimitive>();
    primitives.set(
      'prim-a',
      makePrimitive({
        id: 'prim-a',
        name: 'Prim A',
        type: 'definition',
        domain: 'perception',
      }),
    );
    primitives.set(
      'prim-b',
      makePrimitive({
        id: 'prim-b',
        name: 'Prim B',
        type: 'definition',
        domain: 'perception',
      }),
    );

    const lookups = makeVerificationLookups(primitives);
    const result = verifyCompositionPath(path, lookups);

    expect(result.status).toBe('failed');
    expect(result.failures.length).toBeGreaterThan(0);
    const dimFailure = result.failures.find((f) => f.check === 'dimensional');
    expect(dimFailure).toBeDefined();
    expect(dimFailure!.message).toContain('dimensional mismatch');
  });
});

// ============================================================================
// Group 4: Token budget safety (SAFE-04)
// ============================================================================

describe('MFE pipeline: token budget safety (SAFE-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MfeBudgetHook summary content never exceeds 5% of context window', async () => {
    const contextWindowSize = 200_000;
    const mfeSkillType = new MfeSkillType();
    const hook = new MfeBudgetHook(mfeSkillType, contextWindowSize);

    const context = createEmptyContext({
      resolvedSkills: [
        { name: 'mathematical-foundation', score: 0.8, matchType: 'intent' },
      ],
    });

    const result = await hook.process(context);

    // Read the content cache entry for mathematical-foundation
    const content = result.contentCache.get('mathematical-foundation');
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');

    // Estimate tokens: ~4 chars per token
    const estimatedTokens = Math.ceil(content!.length / 4);
    const maxBudget = contextWindowSize * MFE_BUDGET_PERCENT; // 10,000 tokens

    expect(estimatedTokens).toBeLessThanOrEqual(maxBudget);
  });

  it('MfeBudgetHook with minimum context window (50K) stays within budget', async () => {
    const contextWindowSize = 50_000;
    const mfeSkillType = new MfeSkillType();
    const hook = new MfeBudgetHook(mfeSkillType, contextWindowSize);

    const context = createEmptyContext({
      resolvedSkills: [
        { name: 'mathematical-foundation', score: 0.8, matchType: 'intent' },
      ],
    });

    const result = await hook.process(context);

    const content = result.contentCache.get('mathematical-foundation');
    expect(content).toBeDefined();

    const estimatedTokens = Math.ceil(content!.length / 4);
    const maxBudget = contextWindowSize * MFE_BUDGET_PERCENT; // 2,500 tokens

    expect(estimatedTokens).toBeLessThanOrEqual(maxBudget);
  });

  it('MfeScoreHook + MfeBudgetHook combined never exceed budget', async () => {
    const contextWindowSize = 200_000;

    // Mock math detection for score hook
    mockedDetectMathStructure.mockReturnValue(true);
    mockedClassifyProblem.mockReturnValue({
      position: { real: -0.2, imaginary: 0.2 },
      activatedDomains: [
        { domainId: 'perception', score: 0.8, matchedPatterns: ['geometry'] },
      ],
      confidence: 0.7,
      keywords: ['geometry'],
    });

    const mfeSkillType = new MfeSkillType();

    // Process through score hook
    const scoreHook = new MfeScoreHook(mfeSkillType);
    let context = createEmptyContext({
      intent: 'Calculate the area of a triangle using trigonometry',
    });
    context = await scoreHook.process(context);

    // Move scored skills to resolved (simulating resolve stage)
    context.resolvedSkills = [...context.scoredSkills];

    // Process through budget hook
    const budgetHook = new MfeBudgetHook(mfeSkillType, contextWindowSize);
    context = await budgetHook.process(context);

    // Check total MFE token contribution
    const mfeContent = context.contentCache.get('mathematical-foundation');
    if (mfeContent) {
      const totalMfeTokens = Math.ceil(mfeContent.length / 4);
      const maxBudget = contextWindowSize * MFE_BUDGET_PERCENT;
      expect(totalMfeTokens).toBeLessThanOrEqual(maxBudget);
    }
    // If no content was cached (score too low), budget is trivially respected
  });
});

// ============================================================================
// Group 5: Observation and cache integration
// ============================================================================

describe('MFE pipeline: observation and cache integration', () => {
  it('observation feed records a valid MFEObservation', async () => {
    const tempPath = join(tmpdir(), `mfe-obs-test-${Date.now()}.jsonl`);
    tempFiles.push(tempPath);

    const feed = createObservationFeed({
      outputPath: tempPath,
      sessionId: 'test-session-001',
    });

    const input = {
      problemDescription: 'Find the derivative of sin(x)',
      planePosition: { real: 0.0, imaginary: -0.2 },
      domainsActivated: ['change' as DomainId],
      primitivesUsed: ['change-prim-0', 'change-prim-1'],
      compositionPath: [
        {
          stepNumber: 1,
          primitive: 'change-prim-0',
          action: 'Establish derivative definition',
          justification: 'By derivative definition',
          inputType: 'function',
          outputType: 'derivative',
          verificationStatus: 'passed' as const,
        },
      ],
      verificationResult: 'passed' as const,
      userFeedback: 'positive' as const,
    };

    const observation = await feed.record(input);

    // Assert record matches input
    expect(observation.problemHash).toBeTruthy();
    expect(observation.planePosition).toEqual(input.planePosition);
    expect(observation.domainsActivated).toEqual(input.domainsActivated);
    expect(observation.primitivesUsed).toEqual(input.primitivesUsed);
    expect(observation.verificationResult).toBe('passed');
    expect(observation.userFeedback).toBe('positive');
    expect(observation.sessionId).toBe('test-session-001');
    expect(observation.timestamp).toBeTruthy();

    // Read back and verify
    const observations = await feed.getObservations();
    expect(observations.length).toBe(1);
    expect(observations[0].problemHash).toBe(observation.problemHash);
  });

  it('path cache returns cached composition path on second access', () => {
    const cache = createPathCache({ maxSize: 16 });

    const testPath: CompositionPath = {
      steps: [
        {
          stepNumber: 1,
          primitive: 'perception-prim-0',
          action: 'Establish base',
          justification: 'By axiom',
          inputType: 'none',
          outputType: 'number',
          verificationStatus: 'passed',
        },
      ],
      totalCost: 1.0,
      domainsSpanned: ['perception'],
      verified: true,
    };

    const hash = 'test-hash-abc';

    // Miss first
    expect(cache.get(hash)).toBeNull();

    // Put
    cache.put(hash, testPath);

    // Hit
    const cached = cache.get(hash);
    expect(cached).not.toBeNull();
    expect(cached!.steps).toEqual(testPath.steps);
    expect(cached!.totalCost).toBe(testPath.totalCost);
    expect(cached!.domainsSpanned).toEqual(testPath.domainsSpanned);

    // Check stats: hits = 1, misses = 1 (from the initial get before put)
    const stats = cache.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });
});

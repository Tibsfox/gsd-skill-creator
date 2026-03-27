/**
 * Tests for VTM research utilities: knowledge chunker, safety extractor,
 * and research necessity detector.
 *
 * Covers:
 * - chunkKnowledge(): tiered research splitting with token estimates
 * - extractSafety(): consolidated safety section with boundary classifications
 * - detectResearchNecessity(): pipeline speed recommendation from domain analysis
 *
 * All functions are pure functional API consuming types from ./types.ts.
 */

import { describe, it, expect } from 'vitest';
import type { VisionDocument, ResearchReference } from '../types.js';
import {
  chunkKnowledge,
  extractSafety,
  detectResearchNecessity,
  type KnowledgeTiers,
  type SafetySection,
  type ResearchRecommendation,
  type PipelineSpeed,
} from '../research-utils.js';

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
    vision: 'This vision describes a comprehensive learning system for testing concepts',
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
        name: 'Foundation Module',
        concepts: ['basics', 'setup'],
      },
      {
        name: 'Advanced Module',
        concepts: ['advanced patterns', 'optimization'],
      },
    ],
    chipsetConfig: {
      name: 'test-pack',
      version: '1.0.0',
      description: 'Test chipset config',
      skills: { 'test-skill': { domain: 'testing', description: 'A test skill' } },
      agents: {
        topology: 'pipeline' as const,
        agents: [{ name: 'test-agent', role: 'tester' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'test_coverage', threshold: 80, action: 'block' as const }],
        },
      },
    },
    successCriteria: ['All tests pass with 100% coverage on core paths'],
    throughLine: 'This connects to the broader ecosystem through progressive disclosure principles',
    ...overrides,
  };
}

/** Creates a ResearchReference with multiple topics (5) for chunking tests. */
function createResearch5Topics(): ResearchReference {
  const topics = Array.from({ length: 5 }, (_, i) => ({
    name: `Topic ${i + 1}`,
    foundation: `Evidence-based foundation for Topic ${i + 1}. `.repeat(40),
    techniques: `Implementable techniques for Topic ${i + 1}. `.repeat(40),
    safetyConcerns: i % 2 === 0
      ? [{ condition: 'Risk of incorrect usage', recommendation: 'Apply caution', boundaryType: 'annotate' as const }]
      : undefined,
    crossReferences: [`Topic ${((i + 1) % 5) + 1}`],
  }));

  return {
    name: 'Multi-Topic Research Reference',
    date: '2026-01-01',
    status: 'research-compilation',
    sourceDocument: 'Test Pack',
    purpose: 'Research reference for testing knowledge chunking across multiple topics. '.repeat(5),
    howToUse: 'Use this research as context during mission assembly. Each topic provides foundations and techniques. '.repeat(3),
    sourceOrganizations: [
      { name: 'IEEE Education Society', description: 'Professional education standards' },
      { name: 'ACM SIGCSE', description: 'Computing education research' },
    ],
    topics,
    integrationNotes: {
      sharedSafetyFramework: 'Consolidated safety framework for all topics with annotate boundaries.',
      bibliography: {
        professional: ['Standard A'],
        clinical: [],
        technical: ['Spec B'],
        historical: [],
      },
    },
  };
}

/** Creates a small ResearchReference (2 topics). */
function createResearchSmall(): ResearchReference {
  return {
    name: 'Small Research Reference',
    date: '2026-01-01',
    status: 'research-compilation',
    sourceDocument: 'Test Pack',
    purpose: 'A small research reference.',
    howToUse: 'Use for basic mission assembly.',
    sourceOrganizations: [
      { name: 'ACM', description: 'Computing professionals' },
    ],
    topics: [
      {
        name: 'Basics',
        foundation: 'Basic foundation content.',
        techniques: 'Basic techniques content.',
      },
      {
        name: 'Advanced',
        foundation: 'Advanced foundation content.',
        techniques: 'Advanced techniques content.',
      },
    ],
  };
}

/** Creates a ResearchReference with safety concerns including 'gate' boundary. */
function createResearchWithSafety(): ResearchReference {
  return {
    name: 'Safety Research Reference',
    date: '2026-01-01',
    status: 'research-compilation',
    sourceDocument: 'Safety Pack',
    purpose: 'Research reference with safety-critical content.',
    howToUse: 'Apply safety boundaries during assembly.',
    sourceOrganizations: [
      { name: 'NIST', description: 'Safety standards' },
    ],
    topics: [
      {
        name: 'Electrical Safety',
        foundation: 'Electrical safety foundation.',
        techniques: 'Safety techniques.',
        safetyConcerns: [
          { condition: 'High voltage danger', recommendation: 'Apply gate boundary', boundaryType: 'gate' as const },
          { condition: 'Shock risk warning', recommendation: 'Apply annotate boundary', boundaryType: 'annotate' as const },
        ],
      },
      {
        name: 'Chemical Safety',
        foundation: 'Chemical safety foundation.',
        techniques: 'Chemical techniques.',
        safetyConcerns: [
          { condition: 'Toxic exposure caution', recommendation: 'Apply annotate boundary', boundaryType: 'annotate' as const },
        ],
      },
      {
        name: 'General Topic',
        foundation: 'General foundation.',
        techniques: 'General techniques.',
      },
    ],
    integrationNotes: {
      sharedSafetyFramework: 'Apply all safety boundaries during mission execution.',
    },
  };
}

/** Creates a ResearchReference with no safety concerns. */
function createResearchNoSafety(): ResearchReference {
  return {
    name: 'No Safety Research Reference',
    date: '2026-01-01',
    status: 'research-compilation',
    sourceDocument: 'Safe Pack',
    purpose: 'Research reference with no safety concerns.',
    howToUse: 'Standard assembly.',
    sourceOrganizations: [
      { name: 'ACM', description: 'Computing professionals' },
    ],
    topics: [
      {
        name: 'Clean Topic',
        foundation: 'Clean foundation content.',
        techniques: 'Clean techniques content.',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// chunkKnowledge tests
// ---------------------------------------------------------------------------

describe('chunkKnowledge', () => {
  it('produces three tiers for multi-topic research', () => {
    const research = createResearch5Topics();
    const tiers: KnowledgeTiers = chunkKnowledge(research);

    expect(tiers.summary).toBeDefined();
    expect(tiers.active).toBeDefined();
    expect(tiers.reference).toBeDefined();

    // Each tier has content and estimatedTokens
    expect(typeof tiers.summary.content).toBe('string');
    expect(typeof tiers.summary.estimatedTokens).toBe('number');
    expect(typeof tiers.active.content).toBe('string');
    expect(typeof tiers.active.estimatedTokens).toBe('number');
    expect(typeof tiers.reference.content).toBe('string');
    expect(typeof tiers.reference.estimatedTokens).toBe('number');
  });

  it('summary tier stays near ~2K tokens for 5-topic research', () => {
    const research = createResearch5Topics();
    const tiers = chunkKnowledge(research);

    // Summary should be <= 3000 tokens
    expect(tiers.summary.estimatedTokens).toBeLessThanOrEqual(3000);
    expect(tiers.summary.estimatedTokens).toBeGreaterThan(0);
  });

  it('active tier stays near ~10K tokens for 5-topic research', () => {
    const research = createResearch5Topics();
    const tiers = chunkKnowledge(research);

    // Active should be <= 12000 tokens
    expect(tiers.active.estimatedTokens).toBeLessThanOrEqual(12000);
    expect(tiers.active.estimatedTokens).toBeGreaterThan(0);
  });

  it('reference tier contains full content and is largest', () => {
    const research = createResearch5Topics();
    const tiers = chunkKnowledge(research);

    // reference >= active >= summary in token count
    expect(tiers.reference.estimatedTokens).toBeGreaterThanOrEqual(tiers.active.estimatedTokens);
    expect(tiers.active.estimatedTokens).toBeGreaterThanOrEqual(tiers.summary.estimatedTokens);
  });

  it('all tiers populated for small research', () => {
    const research = createResearchSmall();
    const tiers = chunkKnowledge(research);

    expect(tiers.summary.content.length).toBeGreaterThan(0);
    expect(tiers.active.content.length).toBeGreaterThan(0);
    expect(tiers.reference.content.length).toBeGreaterThan(0);

    // reference >= active >= summary
    expect(tiers.reference.estimatedTokens).toBeGreaterThanOrEqual(tiers.active.estimatedTokens);
    expect(tiers.active.estimatedTokens).toBeGreaterThanOrEqual(tiers.summary.estimatedTokens);
  });

  it('token estimation uses char/4 heuristic', () => {
    const research = createResearchSmall();
    const tiers = chunkKnowledge(research);

    // Verify token estimation: Math.ceil(content.length / 4)
    expect(tiers.summary.estimatedTokens).toBe(Math.ceil(tiers.summary.content.length / 4));
    expect(tiers.active.estimatedTokens).toBe(Math.ceil(tiers.active.content.length / 4));
    expect(tiers.reference.estimatedTokens).toBe(Math.ceil(tiers.reference.content.length / 4));
  });

  it('summary tier includes purpose and topic names', () => {
    const research = createResearch5Topics();
    const tiers = chunkKnowledge(research);

    expect(tiers.summary.content).toContain(research.purpose);
    for (const topic of research.topics) {
      expect(tiers.summary.content).toContain(topic.name);
    }
  });

  it('active tier includes purpose, howToUse, foundations, and techniques', () => {
    const research = createResearchSmall();
    const tiers = chunkKnowledge(research);

    expect(tiers.active.content).toContain(research.purpose);
    expect(tiers.active.content).toContain(research.howToUse);

    for (const topic of research.topics) {
      expect(tiers.active.content).toContain(topic.foundation);
    }
  });
});

// ---------------------------------------------------------------------------
// extractSafety tests
// ---------------------------------------------------------------------------

describe('extractSafety', () => {
  it('collects all safety concerns across topics', () => {
    const research = createResearchWithSafety();
    const safety: SafetySection = extractSafety(research);

    // Electrical Safety has 2 concerns, Chemical Safety has 1 = 3 total
    expect(safety.concerns.length).toBe(3);
  });

  it('tags each concern with sourceModule', () => {
    const research = createResearchWithSafety();
    const safety = extractSafety(research);

    const electricalConcerns = safety.concerns.filter(c => c.sourceModule === 'Electrical Safety');
    const chemicalConcerns = safety.concerns.filter(c => c.sourceModule === 'Chemical Safety');

    expect(electricalConcerns.length).toBe(2);
    expect(chemicalConcerns.length).toBe(1);
  });

  it('hasSafetyCritical is true when gate boundary exists', () => {
    const research = createResearchWithSafety();
    const safety = extractSafety(research);

    expect(safety.hasSafetyCritical).toBe(true);
  });

  it('returns empty concerns for research with no safety', () => {
    const research = createResearchNoSafety();
    const safety = extractSafety(research);

    expect(safety.concerns.length).toBe(0);
    expect(safety.hasSafetyCritical).toBe(false);
  });

  it('sharedFramework comes from integrationNotes when available', () => {
    const research = createResearchWithSafety();
    const safety = extractSafety(research);

    expect(safety.sharedFramework).toBe(
      research.integrationNotes?.sharedSafetyFramework,
    );
  });

  it('sharedFramework is generated summary when integrationNotes absent', () => {
    const research = createResearchNoSafety();
    const safety = extractSafety(research);

    // Should still have some kind of framework text
    expect(typeof safety.sharedFramework).toBe('string');
    expect(safety.sharedFramework.length).toBeGreaterThan(0);
  });

  it('preserves concern fields (condition, recommendation, boundaryType)', () => {
    const research = createResearchWithSafety();
    const safety = extractSafety(research);

    const gateConcern = safety.concerns.find(c => c.boundaryType === 'gate');
    expect(gateConcern).toBeDefined();
    expect(gateConcern!.condition).toBe('High voltage danger');
    expect(gateConcern!.recommendation).toBe('Apply gate boundary');
    expect(gateConcern!.sourceModule).toBe('Electrical Safety');
  });
});

// ---------------------------------------------------------------------------
// detectResearchNecessity tests
// ---------------------------------------------------------------------------

describe('detectResearchNecessity', () => {
  it('returns full speed for educational-pack archetype', () => {
    const doc = createValidVisionDoc({
      name: 'Electronics Learning Module Pack',
      vision: 'A comprehensive curriculum teaching electronics concepts through hands-on lessons and exercises',
      modules: Array.from({ length: 6 }, (_, i) => ({
        name: `Lesson Module ${i + 1}`,
        concepts: ['teaching', 'learning'],
      })),
    });

    const result: ResearchRecommendation = detectResearchNecessity(doc);
    expect(result.speed).toBe('full');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.domainAnalysis.archetype).toBe('educational-pack');
  });

  it('returns skip-research for infrastructure with no safety and few modules', () => {
    const doc = createValidVisionDoc({
      name: 'Pipeline Engine Service',
      vision: 'A processing pipeline infrastructure for data validation and optimization',
      modules: [
        { name: 'Parser Validator', concepts: ['parsing', 'validation'] },
        { name: 'Cache Optimizer', concepts: ['caching', 'optimization'] },
        { name: 'Registry Service', concepts: ['registry', 'lookup'] },
      ],
      coreConcept: {
        interactionModel: 'Pipeline processing model',
        description: 'Data flows through a validator, optimizer, and registry pipeline',
      },
    });

    const result = detectResearchNecessity(doc);
    expect(result.speed).toBe('skip-research');
    expect(result.domainAnalysis.archetype).toBe('infrastructure-component');
  });

  it('returns mission-only for creative-tool with no safety and 3 or fewer modules', () => {
    const doc = createValidVisionDoc({
      name: 'Visual Design Studio',
      vision: 'A creative design editor and canvas for artistic composition and rendering',
      modules: [
        { name: 'Canvas Editor', concepts: ['design', 'composition'] },
        { name: 'Palette Studio', concepts: ['color', 'artistic'] },
      ],
      coreConcept: {
        interactionModel: 'Creative design model',
        description: 'Users compose visual designs on an interactive canvas editor',
      },
    });

    const result = detectResearchNecessity(doc);
    expect(result.speed).toBe('mission-only');
    expect(result.domainAnalysis.archetype).toBe('creative-tool');
  });

  it('returns full speed when safety concerns present regardless of archetype', () => {
    const doc = createValidVisionDoc({
      name: 'Pipeline Engine Service',
      vision: 'A processing pipeline infrastructure for data validation',
      modules: [
        { name: 'Parser Validator', concepts: ['parsing'], safetyConcerns: 'Danger of data corruption' },
        { name: 'Cache Optimizer', concepts: ['caching'] },
      ],
      coreConcept: {
        interactionModel: 'Pipeline processing model',
        description: 'Data flows through a validator and optimizer pipeline',
      },
    });

    const result = detectResearchNecessity(doc);
    expect(result.speed).toBe('full');
    expect(result.domainAnalysis.hasSafetyDomain).toBe(true);
  });

  it('confidence is higher for clear signals', () => {
    // Educational with safety = strong signal for full
    const doc = createValidVisionDoc({
      name: 'Electronics Learning Module Pack',
      vision: 'A comprehensive curriculum teaching electronics concepts through hands-on lessons',
      modules: Array.from({ length: 6 }, (_, i) => ({
        name: `Lesson Module ${i + 1}`,
        concepts: ['teaching', 'learning'],
        safetyConcerns: i === 0 ? 'Electrical hazard danger' : undefined,
      })),
    });

    const result = detectResearchNecessity(doc);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('returns domainAnalysis with archetype, moduleCount, hasSafetyDomain', () => {
    const doc = createValidVisionDoc();
    const result = detectResearchNecessity(doc);

    expect(result.domainAnalysis).toBeDefined();
    expect(typeof result.domainAnalysis.archetype).toBe('string');
    expect(result.domainAnalysis.moduleCount).toBe(doc.modules.length);
    expect(typeof result.domainAnalysis.hasSafetyDomain).toBe('boolean');
  });

  it('reason field explains the recommendation', () => {
    const doc = createValidVisionDoc();
    const result = detectResearchNecessity(doc);

    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('returns full for 5+ modules even with non-educational archetype', () => {
    const doc = createValidVisionDoc({
      name: 'Visual Design Studio',
      vision: 'A creative design tool for artistic composition and rendering',
      modules: Array.from({ length: 6 }, (_, i) => ({
        name: `Canvas Module ${i + 1}`,
        concepts: ['design', 'artistic'],
      })),
      coreConcept: {
        interactionModel: 'Creative design model',
        description: 'Users compose visual designs on an interactive canvas editor',
      },
    });

    const result = detectResearchNecessity(doc);
    expect(result.speed).toBe('full');
  });

  it('confidence is between 0 and 1', () => {
    const doc = createValidVisionDoc();
    const result = detectResearchNecessity(doc);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

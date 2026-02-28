/**
 * Tests for VTM research compiler and source quality checker.
 *
 * Covers compileResearch() and checkSourceQuality():
 * - Research compilation from valid VisionDocument to ResearchReference
 * - Per-module research topic generation with foundation and techniques
 * - Safety concern extraction with boundary type classification
 * - Cross-reference generation between modules
 * - Source quality checking for entertainment/media sources
 * - Empty source and content detection
 *
 * All diagnostics use the SourceDiagnostic type with severity, section, message, and code.
 */

import { describe, it, expect } from 'vitest';
import {
  compileResearch,
  checkSourceQuality,
  type SourceDiagnostic,
} from '../research-compiler.js';
import { ResearchReferenceSchema, type VisionDocument, type ResearchReference } from '../types.js';

// ---------------------------------------------------------------------------
// Test fixture: creates a minimal valid VisionDocument object
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
      skills: {
        'test-skill': { domain: 'testing', description: 'A test skill' },
      },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'test-agent', role: 'executor' }],
      },
      evaluation: {
        gates: {
          preDeploy: [
            { check: 'test_coverage', threshold: 80, action: 'block' as const },
          ],
        },
      },
    },
    successCriteria: [
      'All modules produce valid test output with zero regressions across the suite',
      'Coverage metrics exceed 80% threshold for all production modules',
    ],
    throughLine: 'This aligns with the Amiga Principle of humane flow in ecosystem design',
    ...overrides,
  };
}

// ===========================================================================
// compileResearch tests (RREF-01)
// ===========================================================================

describe('compileResearch', () => {
  it('returns a valid ResearchReference from a valid VisionDocument', () => {
    const doc = createValidVisionDoc();
    const result = compileResearch(doc);
    const validation = ResearchReferenceSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('sets name to vision doc name + " -- Research Reference"', () => {
    const doc = createValidVisionDoc({ name: 'Electronics Pack' });
    const result = compileResearch(doc);
    expect(result.name).toBe('Electronics Pack -- Research Reference');
  });

  it('copies date from vision document', () => {
    const doc = createValidVisionDoc({ date: '2026-03-15' });
    const result = compileResearch(doc);
    expect(result.date).toBe('2026-03-15');
  });

  it('sets status to research-compilation', () => {
    const doc = createValidVisionDoc();
    const result = compileResearch(doc);
    expect(result.status).toBe('research-compilation');
  });

  it('sets sourceDocument to vision doc name', () => {
    const doc = createValidVisionDoc({ name: 'My Vision' });
    const result = compileResearch(doc);
    expect(result.sourceDocument).toBe('My Vision');
  });

  it('generates purpose from vision description and core concept', () => {
    const doc = createValidVisionDoc({
      vision: 'A system for learning electronics',
      coreConcept: {
        interactionModel: 'Hands-on labs',
        description: 'Users build circuits progressively',
      },
    });
    const result = compileResearch(doc);
    expect(result.purpose).toBeTruthy();
    expect(result.purpose.length).toBeGreaterThan(10);
  });

  it('generates howToUse instructions for mission agents', () => {
    const doc = createValidVisionDoc();
    const result = compileResearch(doc);
    expect(result.howToUse).toBeTruthy();
    expect(result.howToUse.length).toBeGreaterThan(10);
  });

  it('populates sourceOrganizations from domain analysis', () => {
    const doc = createValidVisionDoc();
    const result = compileResearch(doc);
    expect(result.sourceOrganizations.length).toBeGreaterThanOrEqual(2);
    for (const org of result.sourceOrganizations) {
      expect(org.name).toBeTruthy();
      expect(org.description).toBeTruthy();
    }
  });

  it('creates one topic per vision module', () => {
    const doc = createValidVisionDoc({
      modules: [
        { name: 'Module A', concepts: ['concept1'] },
        { name: 'Module B', concepts: ['concept2'] },
        { name: 'Module C', concepts: ['concept3'] },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics.length).toBe(3);
  });

  it('sets topic name to match module name', () => {
    const doc = createValidVisionDoc({
      modules: [
        { name: 'Circuit Fundamentals', concepts: ['ohms law'] },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].name).toBe('Circuit Fundamentals');
  });

  it('synthesizes foundation from module concepts', () => {
    const doc = createValidVisionDoc({
      modules: [
        { name: 'Basics', concepts: ['voltage', 'current', 'resistance'] },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].foundation).toBeTruthy();
    expect(result.topics[0].foundation.length).toBeGreaterThan(10);
  });

  it('derives techniques from module concepts', () => {
    const doc = createValidVisionDoc({
      modules: [
        { name: 'Basics', concepts: ['voltage', 'current', 'resistance'] },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].techniques).toBeTruthy();
    expect(result.topics[0].techniques.length).toBeGreaterThan(10);
  });

  it('populates safetyConcerns from module safetyConcerns with boundary types', () => {
    const doc = createValidVisionDoc({
      modules: [
        {
          name: 'High Voltage',
          concepts: ['power'],
          safetyConcerns: 'Danger of electrical shock from high voltage circuits',
        },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].safetyConcerns).toBeDefined();
    expect(result.topics[0].safetyConcerns!.length).toBeGreaterThanOrEqual(1);
    expect(result.topics[0].safetyConcerns![0].boundaryType).toBe('gate');
  });

  it('classifies safety boundary type as gate for danger/hazard/lethal/fatal keywords', () => {
    const doc = createValidVisionDoc({
      modules: [
        {
          name: 'Hazardous Module',
          concepts: ['risk'],
          safetyConcerns: 'Lethal hazard from improper handling',
        },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].safetyConcerns![0].boundaryType).toBe('gate');
  });

  it('classifies safety boundary type as annotate for caution/warning/risk keywords', () => {
    const doc = createValidVisionDoc({
      modules: [
        {
          name: 'Cautious Module',
          concepts: ['care'],
          safetyConcerns: 'Caution required when handling sensitive components',
        },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].safetyConcerns![0].boundaryType).toBe('annotate');
  });

  it('defaults safety boundary type to annotate when no severity keywords found', () => {
    const doc = createValidVisionDoc({
      modules: [
        {
          name: 'Gentle Module',
          concepts: ['care'],
          safetyConcerns: 'Some general safety notes about this module',
        },
      ],
    });
    const result = compileResearch(doc);
    expect(result.topics[0].safetyConcerns![0].boundaryType).toBe('annotate');
  });

  it('generates crossReferences linking to other module names', () => {
    const doc = createValidVisionDoc({
      modules: [
        { name: 'Module A', concepts: ['a'] },
        { name: 'Module B', concepts: ['b'] },
        { name: 'Module C', concepts: ['c'] },
      ],
    });
    const result = compileResearch(doc);
    // Topic for Module A should cross-reference Module B and Module C
    expect(result.topics[0].crossReferences).toBeDefined();
    expect(result.topics[0].crossReferences).toContain('Module B');
    expect(result.topics[0].crossReferences).toContain('Module C');
    expect(result.topics[0].crossReferences).not.toContain('Module A');
  });

  it('creates a single general topic when vision doc has no modules', () => {
    const doc = createValidVisionDoc({ modules: [] });
    const result = compileResearch(doc);
    expect(result.topics.length).toBe(1);
    expect(result.topics[0].name).toBeTruthy();
    expect(result.topics[0].foundation).toBeTruthy();
    expect(result.topics[0].techniques).toBeTruthy();
  });

  it('consolidates sharedSafetyFramework from modules with safety concerns', () => {
    const doc = createValidVisionDoc({
      modules: [
        {
          name: 'Electrical',
          concepts: ['circuits'],
          safetyConcerns: 'Danger of electrical shock',
        },
        {
          name: 'Chemical',
          concepts: ['reactions'],
          safetyConcerns: 'Caution with chemical reactions',
        },
      ],
    });
    const result = compileResearch(doc);
    expect(result.integrationNotes).toBeDefined();
    expect(result.integrationNotes!.sharedSafetyFramework).toBeTruthy();
    expect(result.integrationNotes!.sharedSafetyFramework!.length).toBeGreaterThan(10);
  });

  it('sets integrationNotes.bibliography as empty arrays', () => {
    const doc = createValidVisionDoc();
    const result = compileResearch(doc);
    expect(result.integrationNotes).toBeDefined();
    expect(result.integrationNotes!.bibliography).toBeDefined();
    expect(result.integrationNotes!.bibliography!.professional).toEqual([]);
    expect(result.integrationNotes!.bibliography!.clinical).toEqual([]);
    expect(result.integrationNotes!.bibliography!.technical).toEqual([]);
    expect(result.integrationNotes!.bibliography!.historical).toEqual([]);
  });

  it('validates result against ResearchReferenceSchema', () => {
    const doc = createValidVisionDoc();
    const result = compileResearch(doc);
    const validation = ResearchReferenceSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });
});

// ===========================================================================
// checkSourceQuality tests (RREF-03)
// ===========================================================================

describe('checkSourceQuality', () => {
  /** Helper to create a minimal valid ResearchReference for quality checking. */
  function createValidResearch(overrides?: Partial<ResearchReference>): ResearchReference {
    return {
      name: 'Test -- Research Reference',
      date: '2026-01-01',
      status: 'research-compilation',
      sourceDocument: 'Test Pack',
      purpose: 'Provides research foundation for mission assembly',
      howToUse: 'Use these topics as context for component spec generation',
      sourceOrganizations: [
        { name: 'IEEE Education Society', description: 'Professional engineering education' },
        { name: 'ACM SIGCSE', description: 'Computing education research' },
      ],
      topics: [
        {
          name: 'Foundation Topic',
          foundation: 'Evidence-based foundation content for this research area',
          techniques: 'Implementable techniques derived from professional standards',
        },
      ],
      integrationNotes: {
        bibliography: {
          professional: [],
          clinical: [],
          technical: [],
          historical: [],
        },
      },
      ...overrides,
    };
  }

  it('returns empty array when all sources are professional/organizational', () => {
    const research = createValidResearch();
    const diagnostics = checkSourceQuality(research);
    expect(diagnostics).toEqual([]);
  });

  it('flags sourceOrganizations with YouTube as SOURCE_ENTERTAINMENT warning', () => {
    const research = createValidResearch({
      sourceOrganizations: [
        { name: 'YouTube Electronics Channel', description: 'Video tutorials' },
        { name: 'IEEE', description: 'Professional engineering' },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'SOURCE_ENTERTAINMENT');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
  });

  it('flags sourceOrganizations with Reddit as SOURCE_ENTERTAINMENT warning', () => {
    const research = createValidResearch({
      sourceOrganizations: [
        { name: 'Reddit Electronics Community', description: 'Forum discussions' },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'SOURCE_ENTERTAINMENT');
    expect(diag).toBeDefined();
  });

  it('flags sourceOrganizations with Wikipedia as SOURCE_ENTERTAINMENT warning', () => {
    const research = createValidResearch({
      sourceOrganizations: [
        { name: 'Wikipedia', description: 'Online encyclopedia' },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'SOURCE_ENTERTAINMENT');
    expect(diag).toBeDefined();
  });

  it('flags sourceOrganizations with TikTok as SOURCE_ENTERTAINMENT warning', () => {
    const research = createValidResearch({
      sourceOrganizations: [
        { name: 'TikTok Science', description: 'Short-form science videos' },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'SOURCE_ENTERTAINMENT');
    expect(diag).toBeDefined();
  });

  it('flags sourceOrganizations with blog as SOURCE_ENTERTAINMENT warning', () => {
    const research = createValidResearch({
      sourceOrganizations: [
        { name: 'Personal Electronics Blog', description: 'Hobby blog' },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'SOURCE_ENTERTAINMENT');
    expect(diag).toBeDefined();
  });

  it('flags empty sourceOrganizations array as EMPTY_SOURCES error', () => {
    const research = createValidResearch({
      sourceOrganizations: [] as unknown as ResearchReference['sourceOrganizations'],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'EMPTY_SOURCES');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
  });

  it('flags topics with empty foundation as EMPTY_FOUNDATION error', () => {
    const research = createValidResearch({
      topics: [
        {
          name: 'Empty Foundation Topic',
          foundation: '',
          techniques: 'Some techniques here',
        },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'EMPTY_FOUNDATION');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
  });

  it('flags topics with empty techniques as EMPTY_TECHNIQUES error', () => {
    const research = createValidResearch({
      topics: [
        {
          name: 'Empty Techniques Topic',
          foundation: 'Some foundation here',
          techniques: '',
        },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const diag = diagnostics.find(d => d.code === 'EMPTY_TECHNIQUES');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
  });

  it('returns multiple diagnostics when multiple issues exist', () => {
    const research = createValidResearch({
      sourceOrganizations: [
        { name: 'YouTube Channel', description: 'Videos' },
      ],
      topics: [
        {
          name: 'Bad Topic',
          foundation: '',
          techniques: '',
        },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    expect(diagnostics.length).toBeGreaterThanOrEqual(3);
    const codes = diagnostics.map(d => d.code);
    expect(codes).toContain('SOURCE_ENTERTAINMENT');
    expect(codes).toContain('EMPTY_FOUNDATION');
    expect(codes).toContain('EMPTY_TECHNIQUES');
  });

  it('uses distinct diagnostic codes for each issue type', () => {
    const research = createValidResearch({
      sourceOrganizations: [] as unknown as ResearchReference['sourceOrganizations'],
      topics: [
        { name: 'T1', foundation: '', techniques: '' },
      ],
    });
    const diagnostics = checkSourceQuality(research);
    const codes = new Set(diagnostics.map(d => d.code));
    expect(codes.size).toBeGreaterThanOrEqual(3);
  });
});

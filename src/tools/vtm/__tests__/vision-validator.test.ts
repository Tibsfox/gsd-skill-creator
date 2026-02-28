/**
 * Tests for VTM vision document validator, quality checker, and archetype classifier.
 *
 * Covers validateVisionDocument(), checkQuality(), and classifyArchetype():
 * - Structural validation reporting missing/empty sections as diagnostics
 * - Quality checking for vague criteria, chipset issues, ecosystem alignment
 * - Archetype classification using weighted keyword scoring
 *
 * All diagnostics use the VisionDiagnostic type with severity, section, message, and code.
 */

import { describe, it, expect } from 'vitest';
import {
  validateVisionDocument,
  checkQuality,
  classifyArchetype,
  type VisionDiagnostic,
  type Archetype,
} from '../vision-validator.js';
import type { VisionDocument } from '../types.js';

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
            { check: 'test_coverage', threshold: 80, action: 'block' },
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
// validateVisionDocument tests (VDOC-02)
// ===========================================================================

describe('validateVisionDocument', () => {
  it('returns empty diagnostics array for a fully valid document', () => {
    const doc = createValidVisionDoc();
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics).toEqual([]);
  });

  it('reports error diagnostic when vision section is empty string', () => {
    const doc = createValidVisionDoc({ vision: '' });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const visionDiag = diagnostics.find(d => d.section === 'vision');
    expect(visionDiag).toBeDefined();
    expect(visionDiag!.severity).toBe('error');
    expect(visionDiag!.code).toBe('EMPTY_VISION');
  });

  it('reports error diagnostic when problemStatement array is empty', () => {
    const doc = createValidVisionDoc({ problemStatement: [] });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const diag = diagnostics.find(d => d.section === 'problemStatement');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
    expect(diag!.code).toBe('EMPTY_PROBLEM_STATEMENT');
  });

  it('reports error diagnostic when successCriteria array is empty', () => {
    const doc = createValidVisionDoc({ successCriteria: [] });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const diag = diagnostics.find(d => d.section === 'successCriteria');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
    expect(diag!.code).toBe('EMPTY_CRITERIA');
  });

  it('reports error diagnostic when throughLine is empty string', () => {
    const doc = createValidVisionDoc({ throughLine: '' });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const diag = diagnostics.find(d => d.section === 'throughLine');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
    expect(diag!.code).toBe('EMPTY_THROUGH_LINE');
  });

  it('reports error diagnostic when coreConcept.interactionModel is empty', () => {
    const doc = createValidVisionDoc({
      coreConcept: {
        interactionModel: '',
        description: 'Some description',
      },
    });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const diag = diagnostics.find(d => d.section === 'coreConcept');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
    expect(diag!.code).toBe('EMPTY_INTERACTION_MODEL');
  });

  it('reports warning diagnostic when modules array is empty', () => {
    const doc = createValidVisionDoc({ modules: [] });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const diag = diagnostics.find(d => d.section === 'modules');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
    expect(diag!.code).toBe('EMPTY_MODULES');
  });

  it('reports warning diagnostic when architecture.connections is empty', () => {
    const doc = createValidVisionDoc({
      architecture: { connections: [] },
    });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const diag = diagnostics.find(d => d.section === 'architecture');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
    expect(diag!.code).toBe('EMPTY_CONNECTIONS');
  });

  it('reports multiple diagnostics when multiple sections are invalid', () => {
    const doc = createValidVisionDoc({
      vision: '',
      throughLine: '',
      modules: [],
    });
    const diagnostics = validateVisionDocument(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(3);
    const sections = diagnostics.map(d => d.section);
    expect(sections).toContain('vision');
    expect(sections).toContain('throughLine');
    expect(sections).toContain('modules');
  });

  it('includes the section name in each diagnostic', () => {
    const doc = createValidVisionDoc({ vision: '', successCriteria: [] });
    const diagnostics = validateVisionDocument(doc);
    for (const diag of diagnostics) {
      expect(diag.section).toBeTruthy();
      expect(typeof diag.section).toBe('string');
    }
  });
});

// ===========================================================================
// checkQuality tests (VDOC-03)
// ===========================================================================

describe('checkQuality', () => {
  it('returns empty diagnostics for a high-quality document', () => {
    const doc = createValidVisionDoc();
    const diagnostics = checkQuality(doc);
    expect(diagnostics).toEqual([]);
  });

  it('reports warning for vague success criteria containing "should work"', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['The system should work correctly after deployment'],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'VAGUE_CRITERIA');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
  });

  it('reports warning for vague success criteria containing "looks good"', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['The output looks good to users reviewing it'],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'VAGUE_CRITERIA');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
  });

  it('reports warning for vague success criteria containing "is nice"', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['The user experience is nice and responsive to input'],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'VAGUE_CRITERIA');
    expect(diag).toBeDefined();
  });

  it('reports warning for vague success criteria containing "works well"', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['The integration works well with the existing modules'],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'VAGUE_CRITERIA');
    expect(diag).toBeDefined();
  });

  it('reports warning for vague success criteria containing "good enough"', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['Performance is good enough for production use cases'],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'VAGUE_CRITERIA');
    expect(diag).toBeDefined();
  });

  it('reports warning for success criteria that are too short (less than 20 characters)', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['Tests pass'],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'SHORT_CRITERIA');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
    expect(diag!.section).toBe('successCriteria');
  });

  it('reports error when chipset config has empty skills record', () => {
    const doc = createValidVisionDoc({
      chipsetConfig: {
        ...createValidVisionDoc().chipsetConfig,
        skills: {},
      },
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'EMPTY_CHIPSET_SKILLS');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
  });

  it('reports error when chipset config has empty agents array', () => {
    const doc = createValidVisionDoc({
      chipsetConfig: {
        ...createValidVisionDoc().chipsetConfig,
        agents: {
          topology: 'pipeline',
          agents: [],
        },
      },
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'EMPTY_CHIPSET_AGENTS');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
  });

  it('reports warning when dependsOn is empty but modules reference external concepts', () => {
    const doc = createValidVisionDoc({
      dependsOn: [],
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'EMPTY_DEPENDS_ON');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
  });

  it('reports error when throughLine does not reference any ecosystem principle', () => {
    const doc = createValidVisionDoc({
      throughLine: 'This document describes a standalone project with no connections',
    });
    const diagnostics = checkQuality(doc);
    const diag = diagnostics.find(d => d.code === 'NO_ECOSYSTEM_PRINCIPLE');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('error');
  });

  it('combines diagnostics from multiple quality checks', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['ok'],
      throughLine: 'This is a standalone thing with no connections at all',
      chipsetConfig: {
        ...createValidVisionDoc().chipsetConfig,
        skills: {},
      },
    });
    const diagnostics = checkQuality(doc);
    expect(diagnostics.length).toBeGreaterThanOrEqual(3);
    const codes = diagnostics.map(d => d.code);
    expect(codes).toContain('SHORT_CRITERIA');
    expect(codes).toContain('NO_ECOSYSTEM_PRINCIPLE');
    expect(codes).toContain('EMPTY_CHIPSET_SKILLS');
  });

  it('uses distinct diagnostic codes for each quality issue', () => {
    const doc = createValidVisionDoc({
      successCriteria: ['should work'],
      throughLine: 'no principles here',
      chipsetConfig: {
        ...createValidVisionDoc().chipsetConfig,
        skills: {},
        agents: { topology: 'pipeline', agents: [] },
      },
      dependsOn: [],
    });
    const diagnostics = checkQuality(doc);
    const codes = diagnostics.map(d => d.code);
    const uniqueCodes = new Set(codes);
    // Codes should include multiple distinct values
    expect(uniqueCodes.size).toBeGreaterThanOrEqual(4);
  });
});

// ===========================================================================
// classifyArchetype tests (VDOC-04)
// ===========================================================================

describe('classifyArchetype', () => {
  it('classifies document with educational keywords as "educational-pack"', () => {
    const doc = createValidVisionDoc({
      vision: 'A curriculum for learning electronics through hands-on lessons and modules',
      coreConcept: {
        interactionModel: 'Learning model',
        description: 'Students learn concepts through progressive knowledge building',
      },
      modules: [
        { name: 'Lesson Foundations', concepts: ['basics'] },
        { name: 'Curriculum Design', concepts: ['structure'] },
      ],
    });
    expect(classifyArchetype(doc)).toBe('educational-pack');
  });

  it('classifies document with infrastructure keywords as "infrastructure-component"', () => {
    const doc = createValidVisionDoc({
      name: 'Pipeline Engine',
      vision: 'A runtime engine that processes data through a pipeline service infrastructure',
      coreConcept: {
        interactionModel: 'Service pipeline',
        description: 'Data flows through parser, validator, and processor components',
      },
      modules: [
        { name: 'Parser Engine', concepts: ['parsing'] },
        { name: 'Runtime Service', concepts: ['execution'] },
      ],
    });
    expect(classifyArchetype(doc)).toBe('infrastructure-component');
  });

  it('classifies document with organizational keywords as "organizational-system"', () => {
    const doc = createValidVisionDoc({
      vision: 'A workflow management system for governance and operations coordination',
      coreConcept: {
        interactionModel: 'Process orchestration',
        description: 'Orchestrate and schedule audit processes across the organization',
      },
      modules: [
        { name: 'Workflow Management', concepts: ['flow'] },
        { name: 'Operations Monitor', concepts: ['monitoring'] },
      ],
    });
    expect(classifyArchetype(doc)).toBe('organizational-system');
  });

  it('classifies document with creative keywords as "creative-tool"', () => {
    const doc = createValidVisionDoc({
      vision: 'A visual design studio for creating and composing artistic templates',
      coreConcept: {
        interactionModel: 'Canvas editor',
        description: 'Users design and render custom visual compositions on a canvas',
      },
      modules: [
        { name: 'Design Editor', concepts: ['editing'] },
        { name: 'Template Studio', concepts: ['templates'] },
      ],
    });
    expect(classifyArchetype(doc)).toBe('creative-tool');
  });

  it('uses weighted keyword scoring across vision, coreConcept, and module names', () => {
    // Module names have 3x weight, so even fewer keywords there should dominate
    const doc = createValidVisionDoc({
      vision: 'A system for building things',
      coreConcept: {
        interactionModel: 'Standard model',
        description: 'Standard component processing',
      },
      modules: [
        { name: 'Curriculum Module', concepts: ['learn'] },
        { name: 'Knowledge Lesson', concepts: ['teach'] },
        { name: 'Education Course', concepts: ['study'] },
      ],
    });
    expect(classifyArchetype(doc)).toBe('educational-pack');
  });

  it('returns most likely archetype when multiple keywords match (highest score wins)', () => {
    // Mix of keywords but educational should dominate with more hits
    const doc = createValidVisionDoc({
      name: 'Learning Platform',
      vision: 'A learning curriculum with knowledge modules for student education and lessons',
      coreConcept: {
        interactionModel: 'Pipeline model',
        description: 'Students learn through a teaching pipeline service',
      },
      modules: [
        { name: 'Lesson Module', concepts: ['basics'] },
        { name: 'Knowledge Course', concepts: ['learning'] },
      ],
    });
    // Educational keywords significantly outnumber infrastructure
    expect(classifyArchetype(doc)).toBe('educational-pack');
  });

  it('defaults to "infrastructure-component" when no strong signal exists', () => {
    const doc = createValidVisionDoc({
      name: 'Neutral Thing',
      vision: 'A generic system with no specific archetype signals',
      coreConcept: {
        interactionModel: 'Generic model',
        description: 'A generic description with no keywords',
      },
      modules: [
        { name: 'Alpha', concepts: ['a'] },
        { name: 'Beta', concepts: ['b'] },
      ],
    });
    expect(classifyArchetype(doc)).toBe('infrastructure-component');
  });
});

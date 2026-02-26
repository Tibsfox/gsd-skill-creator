/**
 * Tests for database merger — combines Track A and Track B concept outputs
 * into a unified, deduplicated concept database with coverage statistics.
 * Validates LEARN-08: no duplicate concepts in merged database.
 */

import { describe, it, expect } from 'vitest';
import { mergeDatabases } from '../../../src/dogfood/learning/database-merger.js';
import type { LearnedConcept, EcosystemMapping } from '../../../src/dogfood/learning/types.js';
import { INITIAL_RADIUS } from '../../../src/dogfood/learning/types.js';

// --- Helpers ---

function makeConcept(overrides: Partial<LearnedConcept> = {}): LearnedConcept {
  return {
    id: 'test-1',
    name: 'Test Concept',
    sourceChunk: 'chunk-1',
    sourceChapter: 1,
    sourcePart: 1,
    theta: 0,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    definition: 'A test concept',
    keyRelationships: [],
    prerequisites: [],
    applications: [],
    ecosystemMappings: [],
    confidence: 0.8,
    mathDensity: 0.3,
    abstractionLevel: 0,
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

// --- Tests ---

describe('mergeDatabases', () => {
  it('merges concepts from both tracks into single array', () => {
    const trackA = [
      makeConcept({ id: 'a1', name: 'Calculus', sourcePart: 3, sourceChapter: 8 }),
      makeConcept({ id: 'a2', name: 'Linear Algebra', sourcePart: 4, sourceChapter: 12 }),
      makeConcept({ id: 'a3', name: 'Probability', sourcePart: 5, sourceChapter: 15 }),
    ];
    const trackB = [
      makeConcept({ id: 'b1', name: 'Set Theory', sourcePart: 6, sourceChapter: 18 }),
      makeConcept({ id: 'b2', name: 'Category Theory', sourcePart: 7, sourceChapter: 21 }),
      makeConcept({ id: 'b3', name: 'Information Theory', sourcePart: 8, sourceChapter: 24 }),
      makeConcept({ id: 'b4', name: 'Fractal Geometry', sourcePart: 9, sourceChapter: 28 }),
    ];

    const result = mergeDatabases(trackA, trackB);
    expect(result.concepts).toHaveLength(7);
  });

  it('deduplicates concepts with identical names across tracks', () => {
    const trackA = [
      makeConcept({ id: 'a-uc', name: 'Unit Circle', sourcePart: 3, sourceChapter: 3, confidence: 0.7 }),
    ];
    const trackB = [
      makeConcept({ id: 'b-uc', name: 'Unit Circle', sourcePart: 7, sourceChapter: 21, confidence: 0.85 }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const unitCircles = result.concepts.filter(c => c.name.toLowerCase().includes('unit circle'));
    expect(unitCircles).toHaveLength(1);
  });

  it('keeps higher-confidence detection as primary for duplicates', () => {
    const trackA = [
      makeConcept({
        id: 'a-uc', name: 'Unit Circle', sourcePart: 3, sourceChapter: 3,
        confidence: 0.7, definition: 'Track A definition',
      }),
    ];
    const trackB = [
      makeConcept({
        id: 'b-uc', name: 'Unit Circle', sourcePart: 7, sourceChapter: 21,
        confidence: 0.85, definition: 'Track B definition (higher confidence)',
      }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const merged = result.concepts.find(c => c.name === 'Unit Circle');
    expect(merged).toBeDefined();
    // Higher confidence (Track B's 0.85) should be primary
    expect(merged!.definition).toContain('Track B');
  });

  it('increases radius for cross-track duplicate (progressive depth)', () => {
    const trackA = [
      makeConcept({
        id: 'a-uc', name: 'Unit Circle', sourcePart: 3, sourceChapter: 3,
        confidence: 0.7, radius: INITIAL_RADIUS,
      }),
    ];
    const trackB = [
      makeConcept({
        id: 'b-uc', name: 'Unit Circle', sourcePart: 7, sourceChapter: 21,
        confidence: 0.85, radius: INITIAL_RADIUS,
      }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const merged = result.concepts.find(c => c.name === 'Unit Circle');
    expect(merged).toBeDefined();
    // Radius should be greater than either individual detection
    expect(merged!.radius).toBeGreaterThan(INITIAL_RADIUS);
  });

  it('combines ecosystem mappings from both detections', () => {
    const trackA = [
      makeConcept({
        id: 'a-uc', name: 'Unit Circle', sourcePart: 3, sourceChapter: 3,
        confidence: 0.7,
        ecosystemMappings: [
          { document: 'docs/trig.md', section: 'Basics', relationship: 'identical', notes: 'From Track A' },
        ],
      }),
    ];
    const trackB = [
      makeConcept({
        id: 'b-uc', name: 'Unit Circle', sourcePart: 7, sourceChapter: 21,
        confidence: 0.85,
        ecosystemMappings: [
          { document: 'docs/categories.md', section: 'Examples', relationship: 'extends', notes: 'From Track B' },
        ],
      }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const merged = result.concepts.find(c => c.name === 'Unit Circle');
    expect(merged).toBeDefined();
    expect(merged!.ecosystemMappings).toHaveLength(2);
    expect(merged!.ecosystemMappings.map(m => m.document)).toContain('docs/trig.md');
    expect(merged!.ecosystemMappings.map(m => m.document)).toContain('docs/categories.md');
  });

  it('deduplicates identical ecosystem mappings', () => {
    const sharedMapping: EcosystemMapping = {
      document: 'docs/shared.md',
      section: 'Core',
      relationship: 'identical',
      notes: 'Shared mapping',
    };

    const trackA = [
      makeConcept({
        id: 'a-uc', name: 'Unit Circle', sourcePart: 3, sourceChapter: 3,
        confidence: 0.7,
        ecosystemMappings: [sharedMapping],
      }),
    ];
    const trackB = [
      makeConcept({
        id: 'b-uc', name: 'Unit Circle', sourcePart: 7, sourceChapter: 21,
        confidence: 0.85,
        ecosystemMappings: [{ ...sharedMapping }],
      }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const merged = result.concepts.find(c => c.name === 'Unit Circle');
    expect(merged).toBeDefined();
    // Should be deduplicated: only one mapping for docs/shared.md::Core
    expect(merged!.ecosystemMappings).toHaveLength(1);
  });

  it('combines prerequisites, keyRelationships, and applications', () => {
    const trackA = [
      makeConcept({
        id: 'a-calc', name: 'Calculus', sourcePart: 3, sourceChapter: 8,
        confidence: 0.7,
        prerequisites: ['algebra'],
        keyRelationships: ['differentiation'],
        applications: ['physics'],
      }),
    ];
    const trackB = [
      makeConcept({
        id: 'b-calc', name: 'Calculus', sourcePart: 7, sourceChapter: 22,
        confidence: 0.85,
        prerequisites: ['algebra', 'trigonometry'],
        keyRelationships: ['differentiation', 'integration'],
        applications: ['physics', 'optimization'],
      }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const merged = result.concepts.find(c => c.name === 'Calculus');
    expect(merged).toBeDefined();

    // Union of prerequisites: ['algebra', 'trigonometry'] (no duplicates)
    expect(merged!.prerequisites).toContain('algebra');
    expect(merged!.prerequisites).toContain('trigonometry');
    expect(merged!.prerequisites).toHaveLength(2);

    // Union of keyRelationships
    expect(merged!.keyRelationships).toContain('differentiation');
    expect(merged!.keyRelationships).toContain('integration');
    expect(merged!.keyRelationships).toHaveLength(2);

    // Union of applications
    expect(merged!.applications).toContain('physics');
    expect(merged!.applications).toContain('optimization');
    expect(merged!.applications).toHaveLength(2);
  });

  it('handles case-insensitive name matching for deduplication', () => {
    const trackA = [
      makeConcept({
        id: 'a-ft', name: 'Fourier Transform', sourcePart: 2, sourceChapter: 5,
        confidence: 0.75,
      }),
    ];
    const trackB = [
      makeConcept({
        id: 'b-ft', name: 'fourier transform', sourcePart: 8, sourceChapter: 24,
        confidence: 0.8,
      }),
    ];

    const result = mergeDatabases(trackA, trackB);
    const fourierConcepts = result.concepts.filter(
      c => c.name.toLowerCase().includes('fourier transform'),
    );
    expect(fourierConcepts).toHaveLength(1);
  });

  it('generates coverage statistics: total unique concepts', () => {
    const trackA = [
      makeConcept({ id: 'a1', name: 'Concept A', sourcePart: 1 }),
      makeConcept({ id: 'a2', name: 'Shared', sourcePart: 3, confidence: 0.7 }),
    ];
    const trackB = [
      makeConcept({ id: 'b1', name: 'Concept B', sourcePart: 6 }),
      makeConcept({ id: 'b2', name: 'Shared', sourcePart: 8, confidence: 0.85 }),
    ];

    const result = mergeDatabases(trackA, trackB);
    expect(result.statistics.totalUniqueConcepts).toBe(3); // A, B, Shared (merged)
    expect(result.statistics.totalUniqueConcepts).toBe(result.concepts.length);
  });

  it('generates per-part concept counts', () => {
    const trackA = [
      makeConcept({ id: 'a1', name: 'C1', sourcePart: 1 }),
      makeConcept({ id: 'a2', name: 'C2', sourcePart: 1 }),
      makeConcept({ id: 'a3', name: 'C3', sourcePart: 3 }),
    ];
    const trackB = [
      makeConcept({ id: 'b1', name: 'C4', sourcePart: 6 }),
      makeConcept({ id: 'b2', name: 'C5', sourcePart: 6 }),
      makeConcept({ id: 'b3', name: 'C6', sourcePart: 10 }),
    ];

    const result = mergeDatabases(trackA, trackB);
    expect(result.statistics.perPartCounts[1]).toBe(2);
    expect(result.statistics.perPartCounts[3]).toBe(1);
    expect(result.statistics.perPartCounts[6]).toBe(2);
    expect(result.statistics.perPartCounts[10]).toBe(1);
  });

  it('generates cross-track overlap count', () => {
    const trackA = [
      makeConcept({ id: 'a1', name: 'Unique A', sourcePart: 1 }),
      makeConcept({ id: 'a2', name: 'Shared One', sourcePart: 3, confidence: 0.7 }),
      makeConcept({ id: 'a3', name: 'Shared Two', sourcePart: 5, confidence: 0.6 }),
    ];
    const trackB = [
      makeConcept({ id: 'b1', name: 'Unique B', sourcePart: 6 }),
      makeConcept({ id: 'b2', name: 'Shared One', sourcePart: 7, confidence: 0.85 }),
      makeConcept({ id: 'b3', name: 'Shared Two', sourcePart: 9, confidence: 0.9 }),
    ];

    const result = mergeDatabases(trackA, trackB);
    expect(result.statistics.crossTrackOverlap).toBe(2);
  });

  it('handles empty Track A gracefully', () => {
    const trackA: LearnedConcept[] = [];
    const trackB = [
      makeConcept({ id: 'b1', name: 'C1', sourcePart: 6 }),
      makeConcept({ id: 'b2', name: 'C2', sourcePart: 7 }),
      makeConcept({ id: 'b3', name: 'C3', sourcePart: 8 }),
      makeConcept({ id: 'b4', name: 'C4', sourcePart: 9 }),
      makeConcept({ id: 'b5', name: 'C5', sourcePart: 10 }),
    ];

    const result = mergeDatabases(trackA, trackB);
    expect(result.concepts).toHaveLength(5);
    expect(result.statistics.trackAConcepts).toBe(0);
    expect(result.statistics.trackBConcepts).toBe(5);
    expect(result.statistics.crossTrackOverlap).toBe(0);
  });

  it('handles empty Track B gracefully', () => {
    const trackA = [
      makeConcept({ id: 'a1', name: 'C1', sourcePart: 1 }),
      makeConcept({ id: 'a2', name: 'C2', sourcePart: 2 }),
      makeConcept({ id: 'a3', name: 'C3', sourcePart: 3 }),
      makeConcept({ id: 'a4', name: 'C4', sourcePart: 4 }),
      makeConcept({ id: 'a5', name: 'C5', sourcePart: 5 }),
    ];
    const trackB: LearnedConcept[] = [];

    const result = mergeDatabases(trackA, trackB);
    expect(result.concepts).toHaveLength(5);
    expect(result.statistics.trackAConcepts).toBe(5);
    expect(result.statistics.trackBConcepts).toBe(0);
    expect(result.statistics.crossTrackOverlap).toBe(0);
  });

  it('merged concepts retain valid complex plane coordinates', () => {
    const trackA = [
      makeConcept({ id: 'a1', name: 'Alpha', sourcePart: 1, theta: 0, radius: INITIAL_RADIUS }),
      makeConcept({ id: 'a2', name: 'Shared', sourcePart: 5, theta: Math.PI / 2, radius: INITIAL_RADIUS, confidence: 0.7 }),
    ];
    const trackB = [
      makeConcept({ id: 'b1', name: 'Omega', sourcePart: 10, theta: (9 * Math.PI) / 8, radius: INITIAL_RADIUS }),
      makeConcept({ id: 'b2', name: 'Shared', sourcePart: 8, theta: (7 * Math.PI) / 8, radius: INITIAL_RADIUS, confidence: 0.9 }),
    ];

    const result = mergeDatabases(trackA, trackB);

    for (const concept of result.concepts) {
      expect(concept.theta).toBeGreaterThanOrEqual(0);
      expect(concept.theta).toBeLessThanOrEqual(2 * Math.PI);
      expect(concept.radius).toBeGreaterThan(0);
      expect(concept.radius).toBeLessThanOrEqual(1.0);
    }
  });
});

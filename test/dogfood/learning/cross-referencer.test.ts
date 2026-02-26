import { describe, it, expect } from 'vitest';
import {
  crossReference,
  buildDefaultEcosystemIndex,
  type EcosystemDocIndex,
} from '../../../src/dogfood/learning/cross-referencer.js';
import type { LearnedConcept } from '../../../src/dogfood/learning/types.js';
import { INITIAL_RADIUS } from '../../../src/dogfood/learning/types.js';

// --- Factories ---

function makeConcept(overrides: Partial<LearnedConcept> = {}): LearnedConcept {
  return {
    id: '1-0-test',
    name: 'Test Concept',
    sourceChunk: 'chunk-01',
    sourceChapter: 1,
    sourcePart: 1,
    theta: 0,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    definition: 'A test concept.',
    keyRelationships: [],
    prerequisites: [],
    applications: [],
    ecosystemMappings: [],
    confidence: 0.85,
    mathDensity: 0.3,
    abstractionLevel: 0,
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTestIndex(): EcosystemDocIndex {
  const index: EcosystemDocIndex = new Map();
  index.set('fourier transform', [
    { document: 'gsd-amiga-creative-suite-vision.md', section: 'Math Engine: Trigonometry', description: 'Fourier analysis in audio processing' },
  ]);
  index.set('unit circle', [
    { document: 'unit-circle-skill-creator-synthesis.md', section: 'Skill Positioning', description: 'Unit circle geometry for skill placement' },
    { document: 'gsd-mathematical-foundations-conversation.md', section: 'Trigonometry', description: 'Foundational trigonometric concepts' },
  ]);
  index.set('calculus', [
    { document: 'gsd-amiga-creative-suite-vision.md', section: 'Math Engine: Calculus', description: 'Derivatives and integrals for animation' },
  ]);
  index.set('set theory', [
    { document: 'gsd-mathematical-foundations-conversation.md', section: 'Set Theory', description: 'Set operations and axioms' },
  ]);
  return index;
}

describe('crossReference', () => {
  it('maps concept to ecosystem document when keyword matches', () => {
    const index = makeTestIndex();
    const concept = makeConcept({
      name: 'Fourier Transform',
      definition: 'A fourier transform decomposes a function into frequencies.',
    });
    const mappings = crossReference(concept, index);

    expect(mappings.length).toBeGreaterThanOrEqual(1);
    expect(mappings.some(m => m.document.includes('amiga'))).toBe(true);
  });

  it('classifies relationship as identical for exact match', () => {
    const index = makeTestIndex();
    const concept = makeConcept({
      name: 'Calculus',
      definition: 'The study of derivatives and integration through calculus.',
      confidence: 0.9,
    });
    const mappings = crossReference(concept, index);

    const calcMapping = mappings.find(m => m.section.includes('Calculus'));
    expect(calcMapping).toBeDefined();
    expect(calcMapping!.relationship).toBe('identical');
  });

  it('classifies relationship as extends for broader treatment', () => {
    const index = makeTestIndex();
    const concept = makeConcept({
      name: 'Advanced Set Theory',
      definition: 'An extension of set theory including transfinite ordinals and cardinals.',
      confidence: 0.7,
    });
    const mappings = crossReference(concept, index);

    const setMapping = mappings.find(m => m.section.includes('Set Theory'));
    expect(setMapping).toBeDefined();
    expect(setMapping!.relationship).toBe('extends');
  });

  it('classifies relationship as new when no ecosystem match found', () => {
    const index = makeTestIndex();
    const concept = makeConcept({
      name: 'Topological Quantum Computing',
      definition: 'A computational paradigm using anyonic braiding.',
    });
    const mappings = crossReference(concept, index);

    expect(mappings).toHaveLength(1);
    expect(mappings[0].relationship).toBe('new');
  });

  it('returns multiple mappings for concept with cross-domain relevance', () => {
    const index = makeTestIndex();
    const concept = makeConcept({
      name: 'Unit Circle',
      definition: 'The unit circle is the circle of radius 1 centered at the origin.',
    });
    const mappings = crossReference(concept, index);

    expect(mappings.length).toBeGreaterThanOrEqual(2);
    const docs = mappings.map(m => m.document);
    expect(docs.some(d => d.includes('unit-circle'))).toBe(true);
    expect(docs.some(d => d.includes('mathematical-foundations'))).toBe(true);
  });

  it('handles empty ecosystem index gracefully', () => {
    const emptyIndex: EcosystemDocIndex = new Map();
    const concept = makeConcept({ name: 'Anything' });
    const mappings = crossReference(concept, emptyIndex);

    expect(mappings).toHaveLength(1);
    expect(mappings[0].relationship).toBe('new');
  });

  it('sets notes field with specific observation', () => {
    const index = makeTestIndex();
    const concept = makeConcept({
      name: 'Fourier Transform',
      definition: 'The fourier transform decomposes signals.',
    });
    const mappings = crossReference(concept, index);

    for (const m of mappings) {
      expect(m.notes.length).toBeGreaterThan(0);
      expect(m.notes).not.toBe('');
    }
  });

  it('LEARN-05: every concept gets at least one mapping', () => {
    const index = buildDefaultEcosystemIndex();
    const knownConcept = makeConcept({
      name: 'Calculus',
      definition: 'The study of continuous change through calculus.',
    });
    const unknownConcept = makeConcept({
      name: 'Quantum Chromodynamics',
      definition: 'The theory of the strong interaction between quarks.',
    });

    const knownMappings = crossReference(knownConcept, index);
    const unknownMappings = crossReference(unknownConcept, index);

    expect(knownMappings.length).toBeGreaterThanOrEqual(1);
    expect(unknownMappings.length).toBeGreaterThanOrEqual(1);
    // Unknown concept should be flagged as 'new'
    expect(unknownMappings.some(m => m.relationship === 'new')).toBe(true);
  });
});

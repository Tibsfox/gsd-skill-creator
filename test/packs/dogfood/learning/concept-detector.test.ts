import { describe, it, expect } from 'vitest';
import { detectConcepts } from '../../../../src/dogfood/learning/concept-detector.js';
import type { ChunkInput, LearnedConcept } from '../../../../src/dogfood/learning/types.js';
import { INITIAL_RADIUS } from '../../../../src/dogfood/learning/types.js';

// --- Factories ---

function makeChunk(overrides: Partial<ChunkInput> = {}): ChunkInput {
  return {
    id: 'chunk-01',
    part: 1,
    chapter: 1,
    section: 'introduction',
    text: 'Some mathematical content here.',
    contentType: 'prose',
    mathDensity: 0.3,
    wordCount: 50,
    estimatedTokens: 100,
    crossRefs: [],
    ...overrides,
  };
}

describe('detectConcepts', () => {
  it('detects named concept from definition block', () => {
    const chunk = makeChunk({
      text: 'Definition: A Fourier transform is a mathematical operation that decomposes a function into its constituent frequencies.\n\nThis is widely used in signal processing.',
    });
    const result = detectConcepts(chunk, []);

    expect(result.concepts.length).toBeGreaterThanOrEqual(1);
    const fourier = result.concepts.find(c => c.name.toLowerCase().includes('fourier'));
    expect(fourier).toBeDefined();
    expect(fourier!.definition).toContain('frequencies');
  });

  it('detects theorem statement as concept', () => {
    const chunk = makeChunk({
      text: 'Theorem 3.1: Every continuous function on a closed interval is uniformly continuous.\n\nProof: Consider an arbitrary epsilon > 0.',
    });
    const result = detectConcepts(chunk, []);

    expect(result.concepts.length).toBeGreaterThanOrEqual(1);
    const theorem = result.concepts.find(c => c.definition.includes('continuous'));
    expect(theorem).toBeDefined();
  });

  it('extracts prerequisites from explicit mentions', () => {
    const chunk = makeChunk({
      text: 'Definition: Vector calculus is the study of vector fields. This requires knowledge of calculus and linear algebra as prerequisites.',
    });
    const result = detectConcepts(chunk, []);

    const concept = result.concepts.find(c => c.name.toLowerCase().includes('vector'));
    expect(concept).toBeDefined();
    expect(concept!.prerequisites).toContain('calculus');
    expect(concept!.prerequisites).toContain('linear algebra');
  });

  it('extracts key relationships', () => {
    const chunk = makeChunk({
      text: 'Definition: A Hilbert space is a complete inner product space. It is related to Banach spaces, metric spaces, and normed vector spaces.',
    });
    const result = detectConcepts(chunk, []);

    const concept = result.concepts.find(c => c.name.toLowerCase().includes('hilbert'));
    expect(concept).toBeDefined();
    expect(concept!.keyRelationships.length).toBeGreaterThanOrEqual(1);
  });

  it('handles garbled LaTeX gracefully', () => {
    const chunk = makeChunk({
      id: 'garbled-01',
      text: 'Definition: The integral is \\frac{ incomplete. Also \\begin{align} without end. But the integral is the area under a curve.',
      mathDensity: 0.8,
    });
    const result = detectConcepts(chunk, []);

    // Should still extract concepts despite garbled math
    expect(result.garbledChunks).toContain('garbled-01');
    expect(result.concepts.length).toBeGreaterThanOrEqual(1);
  });

  it('assigns confidence based on definition clarity', () => {
    const clearChunk = makeChunk({
      id: 'clear-01',
      text: 'Definition: A group is a set equipped with an operation that combines any two elements to form a third element.',
    });
    const ambiguousChunk = makeChunk({
      id: 'ambiguous-01',
      text: 'There is something about groups mentioned here but not really defined clearly.',
    });

    const clearResult = detectConcepts(clearChunk, []);
    const ambiguousResult = detectConcepts(ambiguousChunk, []);

    if (clearResult.concepts.length > 0) {
      expect(clearResult.concepts[0].confidence).toBeGreaterThanOrEqual(0.8);
    }
    if (ambiguousResult.concepts.length > 0) {
      expect(ambiguousResult.concepts[0].confidence).toBeLessThan(0.5);
    }
  });

  it('detects multiple concepts from single chunk', () => {
    const chunk = makeChunk({
      text: `Definition: A ring is a set with two binary operations: addition and multiplication.

Definition: A field is a commutative ring in which every nonzero element has a multiplicative inverse.`,
    });
    const result = detectConcepts(chunk, []);

    expect(result.concepts.length).toBeGreaterThanOrEqual(2);
    const names = result.concepts.map(c => c.name.toLowerCase());
    expect(names.some(n => n.includes('ring'))).toBe(true);
    expect(names.some(n => n.includes('field'))).toBe(true);
  });

  it('extracts applications from context', () => {
    const chunk = makeChunk({
      text: 'Definition: The Fourier series decomposes periodic functions into sums of sinusoidal components. It is used in signal processing and applied to image compression.',
    });
    const result = detectConcepts(chunk, []);

    const concept = result.concepts.find(c => c.name.toLowerCase().includes('fourier'));
    expect(concept).toBeDefined();
    expect(concept!.applications.length).toBeGreaterThanOrEqual(1);
    expect(concept!.applications.some(a => a.toLowerCase().includes('signal processing'))).toBe(true);
  });

  it('sets mathDensity from source chunk', () => {
    const chunk = makeChunk({
      text: 'Definition: Entropy is a measure of disorder in a system.',
      mathDensity: 0.75,
    });
    const result = detectConcepts(chunk, []);

    expect(result.concepts.length).toBeGreaterThanOrEqual(1);
    expect(result.concepts[0].mathDensity).toBe(0.75);
  });
});

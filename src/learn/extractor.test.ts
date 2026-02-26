// === General Extractor Tests ===
//
// TDD RED: Tests for candidate primitive extraction from DocumentAnalysis.
// Covers textbook, tutorial, spec, paper, schema conformance, and edge cases.

import { describe, it, expect } from 'vitest';
import {
  extractPrimitives,
  type ExtractionResult,
  type CandidatePrimitive,
} from './extractor.js';
import type { DocumentAnalysis, DocumentSection, ContentType } from './analyzer.js';
import type { PlanePosition } from '../types/mfe-types.js';

// --- Test helper: build a DocumentAnalysis with defaults ---

function makeAnalysis(overrides: Partial<DocumentAnalysis> & { sections: DocumentSection[] }): DocumentAnalysis {
  return {
    contentType: 'unknown' as ContentType,
    detectedDomain: null,
    planePosition: { real: 0.2, imaginary: 0.5 },
    confidence: 0.8,
    keywords: [],
    wordCount: 100,
    sectionCount: 1,
    ...overrides,
  };
}

function makeSection(overrides: Partial<DocumentSection>): DocumentSection {
  return {
    title: 'Test Section',
    level: 1,
    content: '',
    children: [],
    startIndex: 0,
    ...overrides,
  };
}

// === 1. Textbook extraction tests ===

describe('Textbook extraction', () => {
  it('extracts definition primitive from "Definition:" marker', () => {
    const analysis = makeAnalysis({
      contentType: 'textbook',
      detectedDomain: 'structure',
      sections: [makeSection({
        title: 'Algebra',
        content: 'Definition: A vector space is a set V equipped with two operations.\n\nMore text here.',
      })],
    });

    const result = extractPrimitives(analysis);
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
    const defn = result.candidates.find(c => c.type === 'definition');
    expect(defn).toBeDefined();
    expect(defn!.formalStatement).toContain('vector space');
  });

  it('extracts theorem primitive with section number from "Theorem 3.1:"', () => {
    const analysis = makeAnalysis({
      contentType: 'textbook',
      detectedDomain: 'change',
      sections: [makeSection({
        title: 'Calculus',
        content: 'Theorem 3.1: For all continuous functions f on [a,b], the integral exists.\n\nProof follows.',
      })],
    });

    const result = extractPrimitives(analysis);
    const thm = result.candidates.find(c => c.type === 'theorem');
    expect(thm).toBeDefined();
    expect(thm!.section).toContain('3.1');
  });

  it('extracts multiple primitives from a single document', () => {
    const analysis = makeAnalysis({
      contentType: 'textbook',
      detectedDomain: 'foundations',
      sections: [makeSection({
        title: 'Foundations',
        content: `Definition: A group is a set with a binary operation satisfying closure.

Theorem 1.2: Every group has a unique identity element.

Definition: A ring is a set with two binary operations.`,
      })],
    });

    const result = extractPrimitives(analysis);
    expect(result.candidates.length).toBeGreaterThanOrEqual(3);
    const ids = result.candidates.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length); // All IDs unique
  });
});

// === 2. Tutorial extraction tests ===

describe('Tutorial extraction', () => {
  it('extracts technique primitives from step markers', () => {
    const analysis = makeAnalysis({
      contentType: 'tutorial',
      sections: [makeSection({
        title: 'Setup Guide',
        content: `Step 1: Create the project directory and initialize npm.

Step 2: Configure the TypeScript compiler options.`,
      })],
    });

    const result = extractPrimitives(analysis);
    const techniques = result.candidates.filter(c => c.type === 'technique');
    expect(techniques.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts definition from "Key Concept:" marker', () => {
    const analysis = makeAnalysis({
      contentType: 'tutorial',
      sections: [makeSection({
        title: 'Learning',
        content: 'Key Concept: Dependency injection decouples components from their dependencies.\n\nMore details.',
      })],
    });

    const result = extractPrimitives(analysis);
    const defn = result.candidates.find(c => c.type === 'definition');
    expect(defn).toBeDefined();
    expect(defn!.formalStatement).toContain('injection');
  });
});

// === 3. Spec extraction tests ===

describe('Spec extraction', () => {
  it('extracts axiom primitives from MUST/SHALL requirements', () => {
    const analysis = makeAnalysis({
      contentType: 'spec',
      sections: [makeSection({
        title: 'Requirements',
        content: `The system MUST validate input before processing.
The server SHALL return 200 on success.`,
      })],
    });

    const result = extractPrimitives(analysis);
    const axioms = result.candidates.filter(c => c.type === 'axiom');
    expect(axioms.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts definition from interface markers', () => {
    const analysis = makeAnalysis({
      contentType: 'spec',
      sections: [makeSection({
        title: 'Interfaces',
        content: 'Interface: UserService provides user management capabilities.\n\nDetails follow.',
      })],
    });

    const result = extractPrimitives(analysis);
    const defn = result.candidates.find(c => c.type === 'definition');
    expect(defn).toBeDefined();
  });
});

// === 4. Paper extraction tests ===

describe('Paper extraction', () => {
  it('extracts theorem from results and technique from methods', () => {
    const analysis = makeAnalysis({
      contentType: 'paper',
      sections: [
        makeSection({
          title: 'Methods',
          content: 'Method: We use cross-validation with stratified sampling to evaluate model performance.',
          startIndex: 0,
        }),
        makeSection({
          title: 'Results',
          content: 'Finding: The model achieves 95% accuracy on the test set with p<0.01.',
          startIndex: 200,
        }),
      ],
    });

    const result = extractPrimitives(analysis);
    const technique = result.candidates.find(c => c.type === 'technique');
    const theorem = result.candidates.find(c => c.type === 'theorem');
    expect(technique).toBeDefined();
    expect(theorem).toBeDefined();
  });

  it('extracts algorithm primitive from "Algorithm 1:" marker', () => {
    const analysis = makeAnalysis({
      contentType: 'paper',
      sections: [makeSection({
        title: 'Algorithms',
        content: 'Algorithm 1: Gradient Descent minimizes loss by iterating in the negative gradient direction.',
      })],
    });

    const result = extractPrimitives(analysis);
    const algo = result.candidates.find(c => c.type === 'algorithm');
    expect(algo).toBeDefined();
    expect(algo!.formalStatement).toContain('Gradient Descent');
  });
});

// === 5. Schema conformance tests ===

describe('Schema conformance', () => {
  const REQUIRED_FIELDS = [
    'id', 'name', 'type', 'domain', 'chapter', 'section',
    'planePosition', 'formalStatement', 'computationalForm',
    'prerequisites', 'dependencies', 'enables', 'compositionRules',
    'applicabilityPatterns', 'keywords', 'tags', 'buildLabs',
  ] as const;

  it('every extracted primitive has ALL required MathematicalPrimitive fields', () => {
    const analysis = makeAnalysis({
      contentType: 'textbook',
      detectedDomain: 'foundations',
      sections: [makeSection({
        title: 'Foundations',
        content: 'Definition: A set is a well-defined collection of distinct objects.',
      })],
    });

    const result = extractPrimitives(analysis);
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);

    for (const candidate of result.candidates) {
      for (const field of REQUIRED_FIELDS) {
        expect(candidate).toHaveProperty(field);
        const value = (candidate as Record<string, unknown>)[field];
        expect(value, `Field "${field}" should not be undefined`).not.toBeUndefined();
        expect(value, `Field "${field}" should not be null`).not.toBeNull();
      }
    }
  });

  it('primitive IDs follow lowercase hyphenated pattern', () => {
    const analysis = makeAnalysis({
      contentType: 'textbook',
      detectedDomain: 'change',
      sections: [makeSection({
        title: 'Calculus',
        content: `Definition: A limit describes the behavior of a function.

Theorem 2.1: The Fundamental Theorem of Calculus connects differentiation and integration.`,
      })],
    });

    const result = extractPrimitives(analysis);
    for (const candidate of result.candidates) {
      expect(candidate.id).toMatch(/^[a-z]+-[a-z0-9-]+$/);
    }
  });
});

// === 6. General behavior tests ===

describe('General behavior', () => {
  it('returns empty result for empty analysis', () => {
    const analysis = makeAnalysis({
      sections: [],
      sectionCount: 0,
      wordCount: 0,
    });

    const result = extractPrimitives(analysis);
    expect(result.candidates).toHaveLength(0);
    expect(result.totalSectionsProcessed).toBe(0);
  });

  it('inherits planePosition from DocumentAnalysis', () => {
    const pos: PlanePosition = { real: -0.3, imaginary: 0.7 };
    const analysis = makeAnalysis({
      contentType: 'textbook',
      planePosition: pos,
      sections: [makeSection({
        title: 'Math',
        content: 'Definition: An integral computes accumulated area under a curve.',
      })],
    });

    const result = extractPrimitives(analysis);
    for (const candidate of result.candidates) {
      expect(candidate.planePosition).toEqual(pos);
    }
  });
});

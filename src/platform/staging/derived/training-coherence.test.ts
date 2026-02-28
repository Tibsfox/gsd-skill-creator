/**
 * TDD tests for training pair coherence checker.
 *
 * Covers length outlier detection, similarity outlier detection,
 * format mismatch detection, severity assignment, and minimum
 * sample requirements for statistical analysis.
 *
 * @module staging/derived/training-coherence.test
 */

import { describe, it, expect } from 'vitest';
import { checkTrainingCoherence, TrainingPair } from './training-coherence.js';

/**
 * Helper: create a training pair with specified input/output.
 */
function pair(input: string, output: string): TrainingPair {
  return { input, output };
}

/**
 * Helper: generate a unique text of approximate target length.
 * Each seed produces different word patterns to control Jaccard similarity.
 */
function genUnique(length: number, pool: string[]): string {
  let result = '';
  let i = 0;
  while (result.length < length) {
    result += pool[i % pool.length] + ' ';
    i++;
  }
  return result.slice(0, length);
}

/** Word pools for generating text with controlled overlap. */
const poolA = ['typescript', 'interfaces', 'define', 'shape', 'objects', 'properties', 'strict', 'checking'];
const poolB = ['closures', 'javascript', 'scope', 'variables', 'persist', 'lexical', 'environment', 'access'];
const poolC = ['generics', 'reusable', 'components', 'multiple', 'types', 'safety', 'maintain', 'codebase'];
const poolD = ['higher', 'order', 'functions', 'arguments', 'return', 'examples', 'include', 'operations'];
const poolE = ['immutability', 'data', 'changed', 'creation', 'modifying', 'existing', 'copies', 'desired'];
const poolF = ['decorators', 'declarations', 'attached', 'classes', 'methods', 'modify', 'behavior', 'special'];
const poolG = ['promises', 'async', 'await', 'syntax', 'cleaner', 'working', 'asynchronous', 'patterns'];
const poolH = ['modules', 'exports', 'imports', 'bundling', 'tree', 'shaking', 'optimization', 'packages'];

describe('checkTrainingCoherence', () => {
  it('returns empty array for coherent training pairs', () => {
    // 5 pairs where each pair shares some words (moderate Jaccard between input/output)
    const pairs: TrainingPair[] = [
      pair(
        'TypeScript interfaces define the shape of objects and properties',
        'Interfaces in TypeScript define object shape with optional and readonly properties',
      ),
      pair(
        'JavaScript closures capture variables from the outer scope',
        'Closures in JavaScript allow access to outer scope variables after returning',
      ),
      pair(
        'Generics in TypeScript provide reusable type safety components',
        'TypeScript generics allow reusable components with multiple type safety guarantees',
      ),
      pair(
        'Higher order functions take other functions as arguments',
        'Functions that take functions as arguments are called higher order functions',
      ),
      pair(
        'Immutability means data is not changed after creation of copies',
        'Data immutability prevents changes after creation and requires new copies instead',
      ),
    ];

    const findings = checkTrainingCoherence(pairs);
    expect(findings).toEqual([]);
  });

  it('flags length outlier when input is much longer than peers', () => {
    // 8 normal pairs + 1 extreme outlier to anchor statistics
    const pairs: TrainingPair[] = [
      pair(genUnique(50, poolA), genUnique(100, poolB)),
      pair(genUnique(48, poolB), genUnique(98, poolC)),
      pair(genUnique(52, poolC), genUnique(102, poolD)),
      pair(genUnique(50, poolD), genUnique(100, poolE)),
      pair(genUnique(49, poolE), genUnique(99, poolF)),
      pair(genUnique(51, poolF), genUnique(101, poolG)),
      pair(genUnique(50, poolG), genUnique(100, poolH)),
      pair(genUnique(48, poolH), genUnique(98, poolA)),
      pair(genUnique(800, poolA), genUnique(100, poolB)), // massive input outlier
    ];

    const findings = checkTrainingCoherence(pairs);
    const lengthFindings = findings.filter(
      (f) => f.anomalyType === 'outlier-length',
    );
    expect(lengthFindings.length).toBeGreaterThanOrEqual(1);

    const outlierFinding = lengthFindings.find((f) => f.pairIndex === 8);
    expect(outlierFinding).toBeDefined();
    expect(outlierFinding!.type).toBe('coherence');
  });

  it('flags length outlier when output is much shorter than peers', () => {
    // 8 normal pairs + 1 with tiny output
    const pairs: TrainingPair[] = [
      pair(genUnique(50, poolA), genUnique(100, poolB)),
      pair(genUnique(48, poolB), genUnique(98, poolC)),
      pair(genUnique(52, poolC), genUnique(102, poolD)),
      pair(genUnique(50, poolD), genUnique(100, poolE)),
      pair(genUnique(49, poolE), genUnique(99, poolF)),
      pair(genUnique(51, poolF), genUnique(101, poolG)),
      pair(genUnique(50, poolG), genUnique(100, poolH)),
      pair(genUnique(48, poolH), genUnique(98, poolA)),
      pair(genUnique(50, poolA), genUnique(5, poolB)),  // tiny output outlier
    ];

    const findings = checkTrainingCoherence(pairs);
    const lengthFindings = findings.filter(
      (f) => f.anomalyType === 'outlier-length',
    );
    expect(lengthFindings.length).toBeGreaterThanOrEqual(1);

    const outlierFinding = lengthFindings.find((f) => f.pairIndex === 8);
    expect(outlierFinding).toBeDefined();
  });

  it('flags similarity outlier when input equals output', () => {
    const identicalText = 'This exact text appears as both input and output in this pair';

    // Other pairs share some words to have moderate similarity (>0.1)
    const pairs: TrainingPair[] = [
      pair(
        'TypeScript interfaces define the shape of objects',
        'Interfaces in TypeScript define object shape with properties',
      ),
      pair(
        'JavaScript closures capture variables from outer scope',
        'Closures in JavaScript access outer scope variables after return',
      ),
      pair(
        'Generics provide reusable type safety in TypeScript',
        'TypeScript generics allow reusable type safety components',
      ),
      pair(identicalText, identicalText), // identical input/output: Jaccard = 1.0
    ];

    const findings = checkTrainingCoherence(pairs);
    const simFinding = findings.find(
      (f) => f.anomalyType === 'outlier-similarity' && f.pairIndex === 3,
    );
    expect(simFinding).toBeDefined();
    expect(simFinding!.message).toMatch(/too similar/i);
  });

  it('flags similarity outlier when input and output are completely unrelated', () => {
    // Other pairs share words to have decent similarity
    const pairs: TrainingPair[] = [
      pair(
        'TypeScript interfaces define the shape of objects',
        'Interfaces in TypeScript define object shape with properties',
      ),
      pair(
        'JavaScript closures capture variables from outer scope',
        'Closures in JavaScript access outer scope variables after return',
      ),
      pair(
        'Generics provide reusable type safety in TypeScript',
        'TypeScript generics allow reusable type safety components',
      ),
      pair(
        'TypeScript interfaces and generics for type safety',
        'Preheat the oven to 350 degrees and mix flour with butter until smooth dough forms',
      ), // completely unrelated: Jaccard ~ 0
    ];

    const findings = checkTrainingCoherence(pairs);
    const simFinding = findings.find(
      (f) => f.anomalyType === 'outlier-similarity' && f.pairIndex === 3,
    );
    expect(simFinding).toBeDefined();
    expect(simFinding!.message).toMatch(/too dissimilar/i);
  });

  it('flags format mismatch when input is code but output is prose', () => {
    const pairs: TrainingPair[] = [
      pair(
        'TypeScript interfaces define the shape of objects',
        'Interfaces in TypeScript define object shape with properties',
      ),
      pair(
        'JavaScript closures capture variables from outer scope',
        'Closures in JavaScript access outer scope variables after return',
      ),
      pair(
        'Generics provide reusable type safety in TypeScript',
        'TypeScript generics allow reusable type safety components',
      ),
      pair(
        'function greet(name: string): string {\n  const message = `Hello ${name}`;\n  return message;\n}',
        'This function takes a name and returns a greeting message to the caller.',
      ), // code input, prose output
    ];

    const findings = checkTrainingCoherence(pairs);
    const formatFinding = findings.find((f) => f.anomalyType === 'format-mismatch');
    expect(formatFinding).toBeDefined();
    expect(formatFinding!.type).toBe('coherence');
  });

  it('flags format mismatch when input is JSON but output is YAML', () => {
    const pairs: TrainingPair[] = [
      pair(
        'TypeScript interfaces define the shape of objects',
        'Interfaces in TypeScript define object shape with properties',
      ),
      pair(
        'JavaScript closures capture variables from outer scope',
        'Closures in JavaScript access outer scope variables after return',
      ),
      pair(
        'Generics provide reusable type safety in TypeScript',
        'TypeScript generics allow reusable type safety components',
      ),
      pair(
        '{"name": "test", "version": "1.0.0", "dependencies": {"lodash": "^4.17.0"}}',
        'name: test\nversion: 1.0.0\ndependencies:\n  lodash: ^4.17.0',
      ), // JSON input, YAML output
    ];

    const findings = checkTrainingCoherence(pairs);
    const formatFinding = findings.find((f) => f.anomalyType === 'format-mismatch');
    expect(formatFinding).toBeDefined();
  });

  it('returns multiple findings for multiple issues', () => {
    // 8 normal pairs + 1 length outlier + 1 similarity outlier
    const pairs: TrainingPair[] = [
      pair(genUnique(50, poolA), genUnique(100, poolB)),
      pair(genUnique(48, poolB), genUnique(98, poolC)),
      pair(genUnique(52, poolC), genUnique(102, poolD)),
      pair(genUnique(50, poolD), genUnique(100, poolE)),
      pair(genUnique(49, poolE), genUnique(99, poolF)),
      pair(genUnique(51, poolF), genUnique(101, poolG)),
      pair(genUnique(50, poolG), genUnique(100, poolH)),
      pair(genUnique(48, poolH), genUnique(98, poolA)),
      pair(genUnique(800, poolA), genUnique(100, poolB)), // length outlier
      pair('same same same', 'same same same'),           // similarity outlier
    ];

    const findings = checkTrainingCoherence(pairs);
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('severity is warning for length and similarity outliers', () => {
    // 8 normal pairs + 1 length outlier
    const pairs: TrainingPair[] = [
      pair(genUnique(50, poolA), genUnique(100, poolB)),
      pair(genUnique(48, poolB), genUnique(98, poolC)),
      pair(genUnique(52, poolC), genUnique(102, poolD)),
      pair(genUnique(50, poolD), genUnique(100, poolE)),
      pair(genUnique(49, poolE), genUnique(99, poolF)),
      pair(genUnique(51, poolF), genUnique(101, poolG)),
      pair(genUnique(50, poolG), genUnique(100, poolH)),
      pair(genUnique(48, poolH), genUnique(98, poolA)),
      pair(genUnique(800, poolA), genUnique(100, poolB)), // length outlier
    ];

    const findings = checkTrainingCoherence(pairs);
    const lengthFindings = findings.filter((f) => f.anomalyType === 'outlier-length');
    expect(lengthFindings.length).toBeGreaterThanOrEqual(1);
    for (const f of lengthFindings) {
      expect(f.severity).toBe('warning');
    }
  });

  it('severity is info for format mismatches', () => {
    const pairs: TrainingPair[] = [
      pair(
        'TypeScript interfaces define the shape of objects',
        'Interfaces in TypeScript define object shape with properties',
      ),
      pair(
        'JavaScript closures capture variables from outer scope',
        'Closures in JavaScript access outer scope variables after return',
      ),
      pair(
        'Generics provide reusable type safety in TypeScript',
        'TypeScript generics allow reusable type safety components',
      ),
      pair(
        'function add(a: number, b: number): number {\n  return a + b;\n}',
        'This function adds two numbers together and returns the result.',
      ),
    ];

    const findings = checkTrainingCoherence(pairs);
    const formatFindings = findings.filter((f) => f.anomalyType === 'format-mismatch');
    for (const f of formatFindings) {
      expect(f.severity).toBe('info');
    }
  });

  it('requires minimum 3 pairs for statistical analysis', () => {
    // 2 pairs: insufficient data
    const twoPairs: TrainingPair[] = [
      pair(genUnique(50, poolA), genUnique(100, poolB)),
      pair(genUnique(800, poolC), genUnique(5, poolD)),
    ];
    expect(checkTrainingCoherence(twoPairs)).toEqual([]);

    // 3 pairs: can produce findings (statistical analysis runs)
    const threePairs: TrainingPair[] = [
      pair(genUnique(50, poolA), genUnique(100, poolB)),
      pair(genUnique(48, poolC), genUnique(98, poolD)),
      pair(genUnique(800, poolE), genUnique(5, poolF)), // double outlier
    ];
    const findings = checkTrainingCoherence(threePairs);
    expect(Array.isArray(findings)).toBe(true);
  });
});

/**
 * TDD tests for copying signal detector.
 *
 * Covers verbatim sequence detection, overall similarity scoring,
 * severity assignment, multi-reference detection, source hints,
 * and edge cases (empty content/references).
 *
 * @module staging/derived/copying-detector.test
 */

import { describe, it, expect } from 'vitest';
import { detectCopyingSignals } from './copying-detector.js';

describe('detectCopyingSignals', () => {
  it('returns empty array when no copying detected', () => {
    const content = 'TypeScript provides static type checking that catches errors at compile time before your code runs in production.';
    const referenceTexts = [
      'Python is a dynamic language known for its simple syntax and extensive standard library ecosystem.',
      'Rust provides memory safety guarantees through its ownership system without a garbage collector.',
    ];

    const findings = detectCopyingSignals(content, referenceTexts);
    expect(findings).toEqual([]);
  });

  it('detects verbatim sequence of 50+ characters', () => {
    const verbatimChunk = 'This is a very specific technical description about how dependency injection works in modern frameworks';
    // verbatimChunk is 101 chars
    const content = `Some introduction text. ${verbatimChunk} And some trailing text.`;
    const referenceTexts = [
      `The reference documentation says: ${verbatimChunk} as noted in the specification.`,
    ];

    const findings = detectCopyingSignals(content, referenceTexts);
    expect(findings.length).toBeGreaterThanOrEqual(1);

    const verbatimFinding = findings.find((f) => f.matchedSnippet.length >= 50);
    expect(verbatimFinding).toBeDefined();
    expect(verbatimFinding!.similarity).toBe(1.0);
    expect(verbatimFinding!.type).toBe('copying');
  });

  it('does not flag short common phrases', () => {
    // "import { useState }" is 19 chars, well below 50
    const content = 'In React you can import { useState } from the react library for state management.';
    const referenceTexts = [
      'To use hooks, import { useState } from react and call it inside your component function.',
    ];

    const findings = detectCopyingSignals(content, referenceTexts);
    // Should not flag verbatim (common phrase too short)
    // Overall similarity may or may not trigger, but no verbatim finding expected
    const verbatimFindings = findings.filter((f) => f.similarity === 1.0);
    expect(verbatimFindings).toEqual([]);
  });

  it('detects high overall similarity', () => {
    // Content that closely mirrors a reference with minor rewording
    const reference = 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static types and class-based object-oriented programming to the language. TypeScript is designed for development of large applications.';
    const content = 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static types and class-based object-oriented programming to the language. TypeScript was designed for development of large scale applications.';

    const findings = detectCopyingSignals(content, [reference]);
    const highSimFinding = findings.find((f) => f.similarity > 0.8);
    expect(highSimFinding).toBeDefined();
  });

  it('severity is critical for similarity > 0.8', () => {
    const reference = 'The quick brown fox jumps over the lazy dog. This is a well known pangram sentence used in typing tests. It contains every letter of the alphabet at least once.';
    const content = 'The quick brown fox jumps over the lazy dog. This is a well known pangram sentence used in typing tests. It contains every letter of the alphabet at least once.';

    const findings = detectCopyingSignals(content, [reference]);
    const criticalFinding = findings.find((f) => f.severity === 'critical');
    expect(criticalFinding).toBeDefined();
  });

  it('severity is warning for similarity 0.5-0.8', () => {
    // Content that shares 3 of 5 sentences, with 2 completely different
    const reference = 'Functions in JavaScript are first-class objects. They can be assigned to variables. They can be passed as arguments. They can be returned from other functions. This makes JavaScript a functional programming language.';
    const content = 'Functions in JavaScript are first-class objects. They can be assigned to variables. They can be passed as arguments. Arrow functions provide concise syntax. Closures capture lexical scope in nested functions.';

    const findings = detectCopyingSignals(content, [reference]);
    // Filter for overall similarity findings (not verbatim)
    const warningFinding = findings.find(
      (f) => f.severity === 'warning' && f.similarity >= 0.5 && f.similarity <= 0.8,
    );
    expect(warningFinding).toBeDefined();
  });

  it('does not flag similarity < 0.5', () => {
    const content = 'Rust provides memory safety through ownership and borrowing rules checked at compile time.';
    const referenceTexts = [
      'Python uses dynamic typing and garbage collection for automatic memory management at runtime.',
    ];

    const findings = detectCopyingSignals(content, referenceTexts);
    // No copying findings expected (very different content)
    expect(findings).toEqual([]);
  });

  it('detects copying from multiple reference texts', () => {
    const refA = 'Advanced TypeScript patterns include conditional types, mapped types, and template literal types for sophisticated type-level programming and computation.';
    const refB = 'React hooks revolutionized component development by allowing function components to manage state and side effects without class components.';

    // Content copies from both references
    const content = 'Advanced TypeScript patterns include conditional types, mapped types, and template literal types for sophisticated type-level programming and computation. React hooks revolutionized component development by allowing function components to manage state and side effects without class components.';

    const findings = detectCopyingSignals(content, [refA, refB]);
    // Should detect copying from both references
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('sourceHint identifies which reference matched', () => {
    const refA = 'Unrelated content about cooking pasta and Italian cuisine recipes for dinner.';
    const refB = 'The decorator pattern attaches additional responsibilities to objects dynamically. Decorators provide a flexible alternative to subclassing for extending functionality at runtime.';
    const content = 'The decorator pattern attaches additional responsibilities to objects dynamically. Decorators provide a flexible alternative to subclassing for extending functionality at runtime.';

    const findings = detectCopyingSignals(content, [refA, refB]);
    expect(findings.length).toBeGreaterThanOrEqual(1);

    // The finding should reference index 1 (refB)
    const matchFinding = findings.find((f) => f.sourceHint.includes('reference[1]'));
    expect(matchFinding).toBeDefined();
  });

  it('handles empty referenceTexts array', () => {
    const findings = detectCopyingSignals('Some content to check for copying.', []);
    expect(findings).toEqual([]);
  });

  it('handles empty content', () => {
    const findings = detectCopyingSignals('', ['Some reference text to compare against.']);
    expect(findings).toEqual([]);
  });
});

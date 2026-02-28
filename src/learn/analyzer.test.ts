// === Document Analyzer Tests ===
//
// TDD RED: Tests for structure extraction, content type classification,
// domain detection, and edge cases.

import { describe, it, expect } from 'vitest';
import {
  analyzeDocument,
  type DocumentAnalysis,
  type ContentType,
  type DocumentSection,
} from './analyzer.js';
import type { DomainDefinition } from '../core/types/mfe-types.js';

// --- Test domain definitions (avoids loading domain-index.json) ---

const testDomains: DomainDefinition[] = [
  {
    id: 'change',
    name: 'Change',
    part: 'Part III: Moving',
    chapters: [8, 9, 10],
    planeRegion: { center: { real: 0.2, imaginary: 0.5 }, radius: 0.3 },
    activationPatterns: ['derivative', 'integral', 'calculus', 'rate of change', 'differential'],
    compatibleWith: ['perception', 'waves'],
    primaryPrimitiveTypes: ['theorem', 'algorithm'],
    description: 'Change domain',
  },
  {
    id: 'perception',
    name: 'Perception',
    part: 'Part I: Seeing',
    chapters: [1, 2, 3],
    planeRegion: { center: { real: -0.5, imaginary: -0.3 }, radius: 0.3 },
    activationPatterns: ['geometry', 'triangle', 'angle', 'circle', 'visual'],
    compatibleWith: ['change'],
    primaryPrimitiveTypes: ['definition', 'theorem'],
    description: 'Perception domain',
  },
];

// === 1. Structure extraction tests ===

describe('Structure extraction', () => {
  it('extracts chapter/section hierarchy from markdown headings', () => {
    const doc = `# Chapter 1: Foundations
Some intro text.

## Section 1.1: Basics
Basic content here.

## Section 1.2: Advanced
Advanced content here.

# Chapter 2: Applications
More text.`;

    const result = analyzeDocument(doc);
    expect(result.sections).toHaveLength(2); // Two h1 chapters
    expect(result.sections[0].title).toBe('Chapter 1: Foundations');
    expect(result.sections[0].level).toBe(1);
    expect(result.sections[0].children).toHaveLength(2);
    expect(result.sections[0].children[0].title).toBe('Section 1.1: Basics');
    expect(result.sections[0].children[0].level).toBe(2);
    expect(result.sections[1].title).toBe('Chapter 2: Applications');
  });

  it('parses numbered sections into section tree', () => {
    const doc = `# Introduction

1.1 Getting Started
Start here.

1.2 Next Steps
Continue here.

2.1 Deep Dive
Deeper content.`;

    const result = analyzeDocument(doc);
    expect(result.sectionCount).toBeGreaterThanOrEqual(1);
    // The numbered sections should appear somewhere in the tree
    const allSections = flattenSections(result.sections);
    const numbered = allSections.filter(s => /^\d+\.\d+/.test(s.title));
    expect(numbered.length).toBeGreaterThanOrEqual(2);
  });

  it('returns single root section for documents with no headings', () => {
    const doc = 'Just some plain text without any headings or structure. It goes on and on.';
    const result = analyzeDocument(doc);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].level).toBe(1);
    expect(result.sections[0].content).toContain('Just some plain text');
  });

  it('detects TOC-like content', () => {
    const doc = `Table of Contents

Chapter 1: Introduction
Chapter 2: Methods
Chapter 3: Results

# Chapter 1: Introduction
Some content here.`;

    const result = analyzeDocument(doc);
    // Should still extract the actual heading-based sections
    expect(result.sections.length).toBeGreaterThanOrEqual(1);
  });

  it('maintains parent-child relationships for deeply nested headings', () => {
    const doc = `# Level 1
## Level 2
### Level 3
#### Level 4
Content at level 4.`;

    const result = analyzeDocument(doc);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].children).toHaveLength(1);
    expect(result.sections[0].children[0].children).toHaveLength(1);
    expect(result.sections[0].children[0].children[0].children).toHaveLength(1);
    expect(result.sections[0].children[0].children[0].children[0].title).toBe('Level 4');
  });
});

// === 2. Content type classification tests ===

describe('Content type classification', () => {
  it('classifies textbook content with formal math markers', () => {
    const doc = `# Algebra

Definition: A group is a set G with a binary operation.

Theorem: Every group has a unique identity element.

Proof: By contradiction, assume two identities exist.`;

    const result = analyzeDocument(doc);
    expect(result.contentType).toBe('textbook');
  });

  it('classifies reference content with API/code markers', () => {
    const doc = `# API Reference

## Endpoints

function createUser(name: string): User

The endpoint returns a JSON object.

\`\`\`typescript
interface User {
  id: string;
  name: string;
}
\`\`\``;

    const result = analyzeDocument(doc);
    expect(result.contentType).toBe('reference');
  });

  it('classifies tutorial content with step/exercise markers', () => {
    const doc = `# Getting Started

Step 1: Install the dependencies using npm install.

Step 2: Configure the environment variables.

Try this: Run the development server.

Exercise: Build a simple REST API.`;

    const result = analyzeDocument(doc);
    expect(result.contentType).toBe('tutorial');
  });

  it('classifies spec content with RFC-style markers', () => {
    const doc = `# System Requirements

The server MUST validate all input before processing.
The client SHALL authenticate before making requests.
Requirements: All endpoints MUST return JSON.`;

    const result = analyzeDocument(doc);
    expect(result.contentType).toBe('spec');
  });

  it('classifies paper content with academic markers', () => {
    const doc = `Abstract

We present a novel approach to machine learning.

Introduction

This paper explores gradient descent optimization.

Methodology

We used cross-validation with k=10.

Conclusion

Our results show significant improvement.

References

[1] Smith et al. (2023)`;

    const result = analyzeDocument(doc);
    expect(result.contentType).toBe('paper');
  });
});

// === 3. Domain detection and plane position tests ===

describe('Domain detection and plane position', () => {
  it('activates change domain for calculus content', () => {
    const doc = `# Calculus
The derivative of a function measures the rate of change.
Integration is the reverse process of differentiation.
Differential equations model continuous change.`;

    const result = analyzeDocument(doc, testDomains);
    expect(result.detectedDomain).toBe('change');
    expect(result.planePosition.real).toBeCloseTo(0.2, 0);
    expect(result.planePosition.imaginary).toBeCloseTo(0.5, 0);
  });

  it('returns generic position for unrecognized domain content', () => {
    const doc = `# Electronics
Ohm's law relates voltage, current, and resistance.
Circuits use resistors, capacitors, and inductors.`;

    const result = analyzeDocument(doc, testDomains);
    // Electronics is not in our test domain set
    // Should return null domain or a low-confidence result
    expect(result.planePosition.real).toBeGreaterThanOrEqual(-1);
    expect(result.planePosition.real).toBeLessThanOrEqual(1);
  });

  it('returns PlanePosition within valid range', () => {
    const doc = `# Math Document
Lots of derivative calculus triangle geometry content.`;

    const result = analyzeDocument(doc, testDomains);
    expect(result.planePosition.real).toBeGreaterThanOrEqual(-1);
    expect(result.planePosition.real).toBeLessThanOrEqual(1);
    expect(result.planePosition.imaginary).toBeGreaterThanOrEqual(-1);
    expect(result.planePosition.imaginary).toBeLessThanOrEqual(1);
  });
});

// === 4. Edge case tests ===

describe('Edge cases', () => {
  it('handles empty string input gracefully', () => {
    const result = analyzeDocument('');
    expect(result.contentType).toBe('unknown');
    expect(result.sections).toHaveLength(0);
    expect(result.detectedDomain).toBeNull();
    expect(result.planePosition).toEqual({ real: 0, imaginary: 0 });
    expect(result.wordCount).toBe(0);
    expect(result.sectionCount).toBe(0);
  });

  it('handles very long documents without error', () => {
    const longDoc = '# Big Document\n\n' + 'This is a paragraph of text. '.repeat(500);
    expect(longDoc.length).toBeGreaterThan(10000);

    const result = analyzeDocument(longDoc);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.sections.length).toBeGreaterThanOrEqual(1);
  });
});

// --- Helper ---

function flattenSections(sections: DocumentSection[]): DocumentSection[] {
  const result: DocumentSection[] = [];
  for (const s of sections) {
    result.push(s);
    result.push(...flattenSections(s.children));
  }
  return result;
}

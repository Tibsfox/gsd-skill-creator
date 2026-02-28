/**
 * Tests for vision document markdown parser.
 *
 * Validates parseVisionDocument() extracts structured sections from markdown
 * vision documents following the MATH-101-vision.md format.
 */

import { describe, it, expect } from 'vitest';
import { parseVisionDocument } from '../vision-parser.js';
import type { VisionDocument } from '../vision-parser.js';

// ============================================================================
// Fixtures
// ============================================================================

const MATH_VISION_MD = `# MATH-101: Mathematics — Foundational Knowledge Pack

**Date:** February 18, 2026
**Status:** Initial Vision

---

## Vision

Mathematics often feels like a collection of procedures. But real mathematical
thinking is about *seeing patterns*, *building structures*, and *reasoning clearly*.

This pack teaches mathematics as a way of thinking.

---

## Problem Statement

Math is typically taught as a race toward standardized testing. Students memorize
procedures they don't understand.

This pack addresses these gaps by:
1. Prioritizing understanding over procedure
2. Making mathematical reasoning visible

---

## Core Concepts

1. **Pattern Recognition:** Mathematics begins with noticing patterns.
2. **Building with Simple Rules:** Complex structures from simple rules.
3. **Precise Communication:** Symbolic language for describing ideas.

---

## Skill Tree Architecture

\`\`\`
Foundation (Pre-K to Grade 2)
  ├── Subitizing & Cardinality
  └── Counting & Cardinal Numbers
\`\`\`

---

## Modules

### Module 1: Number & Operation

Subitizing, counting, composing numbers.

### Module 2: Patterns & Algebraic Thinking

Variables, functions, equations.

---

## Assessment Framework

### How Do We Know Progress Is Happening?

| Level | Number Sense |
|-------|-------------|
| **Beginning** | Counts reliably |
| **Proficient** | Operates with efficiency |

---

## Parent Guidance

### If You Don't Know Mathematics...

You don't need to be a "math person" to help your child learn math.

---

## Vetted Resources

### For Learners (Elementary)

- **Beast Academy** — Comic-based math curriculum
- **Desmos** — Interactive graphing
`;

const MINIMAL_VISION_MD = `# SIMPLE-PACK: Simple Test Pack

## Vision

This is a simple vision statement.
`;

const EMPTY_MD = '';

// ============================================================================
// parseVisionDocument
// ============================================================================

describe('parseVisionDocument', () => {
  it('extracts sections from MATH-101 vision format', () => {
    const doc = parseVisionDocument(MATH_VISION_MD);

    expect(doc.vision).toBeDefined();
    expect(doc.vision).toContain('seeing patterns');
    expect(doc.vision).toContain('way of thinking');

    expect(doc.problemStatement).toBeDefined();
    expect(doc.problemStatement).toContain('standardized testing');

    expect(doc.coreConcepts).toBeDefined();
    expect(doc.coreConcepts).toContain('Pattern Recognition');

    expect(doc.skillTree).toBeDefined();
    expect(doc.skillTree).toContain('Foundation');

    expect(doc.modules).toBeDefined();
    expect(doc.modules).toContain('Number & Operation');

    expect(doc.assessmentFramework).toBeDefined();
    expect(doc.assessmentFramework).toContain('Beginning');

    expect(doc.parentGuidance).toBeDefined();
    expect(doc.parentGuidance).toContain("math person");
  });

  it('handles missing optional sections gracefully', () => {
    const doc = parseVisionDocument(MINIMAL_VISION_MD);
    expect(doc.vision).toBeDefined();
    expect(doc.vision).toContain('simple vision statement');
    // Missing sections should be null
    expect(doc.resources).toBeNull();
    expect(doc.parentGuidance).toBeNull();
    expect(doc.assessmentFramework).toBeNull();
  });

  it('returns title from H1', () => {
    const doc = parseVisionDocument(MATH_VISION_MD);
    expect(doc.title).toBe('MATH-101: Mathematics — Foundational Knowledge Pack');
  });

  it('handles empty document', () => {
    const doc = parseVisionDocument(EMPTY_MD);
    expect(doc.title).toBeNull();
    expect(doc.vision).toBeNull();
    expect(doc.problemStatement).toBeNull();
    expect(doc.coreConcepts).toBeNull();
  });

  it('stores all sections in rawSections map', () => {
    const doc = parseVisionDocument(MATH_VISION_MD);
    expect(doc.rawSections).toBeInstanceOf(Map);
    expect(doc.rawSections.size).toBeGreaterThan(0);
    // Should have entries for each ## heading
    const keys = Array.from(doc.rawSections.keys()).map((k) => k.toLowerCase());
    expect(keys).toContain('vision');
    expect(keys).toContain('problem statement');
  });

  it('extracts resources/vetted resources section', () => {
    const doc = parseVisionDocument(MATH_VISION_MD);
    // The section is "Vetted Resources" which maps to resources
    expect(doc.resources).toBeDefined();
    expect(doc.resources).toContain('Beast Academy');
  });
});

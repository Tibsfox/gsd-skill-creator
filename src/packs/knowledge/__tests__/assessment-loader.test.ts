/**
 * Tests for assessment markdown parser with rubric extraction.
 *
 * Validates parseAssessment() extracts rubric levels and assessment
 * strategies from markdown documents.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { parseAssessment, parseAssessmentFile } from '../assessment-loader.js';

// ============================================================================
// Fixtures
// ============================================================================

const RUBRIC_ASSESSMENT_MD = `# Assessment Framework

## Beginning

Counts reliably; recognizes quantities; solves addition and subtraction
within familiar range. Extends simple visual patterns.

## Developing

Applies operations flexibly; understands decomposition; uses tools
accurately. Describes patterns in multiple ways.

## Proficient

Operates with efficiency; solves multi-step problems; estimates
reasonably. Uses algebraic language; solves equations.

## Advanced

Invents efficient strategies; builds new number systems. Creates
functions; builds abstract structures; proves properties.

## Formative Assessment

1. **Mathematical Discourse:** Can the learner explain their thinking?
2. **Error Analysis:** When wrong, can they identify where thinking went off track?
3. **Flexibility:** Can they solve the same problem multiple ways?

## Summative Assessment

**Portfolio Might Include:**

- Problem-solving investigations
- Mathematical communication
- Pattern discovery

## Portfolio Suggestions

- Collect work samples over the semester
- Include self-reflection entries
- Document growth over time
`;

const FREEFORM_ASSESSMENT_MD = `# Assessment Notes

## Overview

This is a free-form assessment document without standard rubric levels.

## Evaluation Criteria

- Demonstrates understanding of core concepts
- Shows ability to apply knowledge
`;

// ============================================================================
// parseAssessment
// ============================================================================

describe('parseAssessment', () => {
  it('extracts rubric levels', () => {
    const doc = parseAssessment(RUBRIC_ASSESSMENT_MD);
    expect(doc.rubricLevels).toHaveLength(4);
    expect(doc.rubricLevels[0].level).toBe('Beginning');
    expect(doc.rubricLevels[0].description).toContain('Counts reliably');
    expect(doc.rubricLevels[1].level).toBe('Developing');
    expect(doc.rubricLevels[2].level).toBe('Proficient');
    expect(doc.rubricLevels[3].level).toBe('Advanced');
    expect(doc.rubricLevels[3].description).toContain('Invents efficient strategies');
  });

  it('extracts assessment methods', () => {
    const doc = parseAssessment(RUBRIC_ASSESSMENT_MD);
    expect(doc.formativeStrategies).toBeDefined();
    expect(doc.formativeStrategies).toContain('Mathematical Discourse');
    expect(doc.summativeStrategies).toBeDefined();
    expect(doc.summativeStrategies).toContain('Portfolio');
  });

  it('extracts portfolio suggestions', () => {
    const doc = parseAssessment(RUBRIC_ASSESSMENT_MD);
    expect(doc.portfolioSuggestions).toBeDefined();
    expect(doc.portfolioSuggestions).toContain('self-reflection');
  });

  it('handles free-form assessment markdown', () => {
    const doc = parseAssessment(FREEFORM_ASSESSMENT_MD);
    expect(doc.rubricLevels).toHaveLength(0);
    expect(doc.rawSections).toBeInstanceOf(Map);
    expect(doc.rawSections.size).toBeGreaterThan(0);
  });

  it('stores all sections in rawSections', () => {
    const doc = parseAssessment(RUBRIC_ASSESSMENT_MD);
    expect(doc.rawSections).toBeInstanceOf(Map);
    const keys = Array.from(doc.rawSections.keys()).map((k) => k.toLowerCase());
    expect(keys).toContain('beginning');
    expect(keys).toContain('formative assessment');
  });
});

// ============================================================================
// parseAssessmentFile
// ============================================================================

describe('parseAssessmentFile', () => {
  let mockReadFile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const fs = await import('node:fs/promises');
    mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
    mockReadFile.mockReset();
  });

  it('reads and parses file', async () => {
    mockReadFile.mockResolvedValue(RUBRIC_ASSESSMENT_MD);
    const doc = await parseAssessmentFile('/path/to/assessment.md');
    expect(doc.rubricLevels).toHaveLength(4);
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/assessment.md', 'utf-8');
  });
});

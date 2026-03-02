/**
 * Tests for simulated work detector.
 *
 * Covers:
 * - Empty/whitespace-only content
 * - Size threshold detection
 * - Missing required sections
 * - Unique line ratio detection
 * - Repeated block detection
 * - Real-world-like content passing all checks
 * - Multiple failures collected (no short-circuiting)
 * - Default and custom thresholds
 */

import { describe, it, expect } from 'vitest';
import { detectSimulatedWork } from './simulated-work-detector.js';
import type { SimulatedWorkCheck } from './simulated-work-detector.js';

// ============================================================================
// Empty/whitespace tests
// ============================================================================

describe('detectSimulatedWork - empty content', () => {
  it('should flag empty string as simulated', () => {
    const result = detectSimulatedWork('', {});
    expect(result.simulated).toBe(true);
    expect(result.reasons).toContain('Content is empty or whitespace-only');
  });

  it('should flag whitespace-only string as simulated', () => {
    const result = detectSimulatedWork('   \n  \n  ', {});
    expect(result.simulated).toBe(true);
    expect(result.reasons).toContain('Content is empty or whitespace-only');
  });
});

// ============================================================================
// Size threshold tests
// ============================================================================

describe('detectSimulatedWork - size threshold', () => {
  it('should flag content below min_size_bytes', () => {
    const result = detectSimulatedWork('small', { min_size_bytes: 100 });
    expect(result.simulated).toBe(true);
    expect(result.reasons.some((r) => r.includes('below minimum 100 bytes'))).toBe(true);
  });

  it('should pass content at or above min_size_bytes', () => {
    const content = 'a'.repeat(100);
    const result = detectSimulatedWork(content, { min_size_bytes: 100 });
    // Should not have a size-related reason
    expect(result.reasons.some((r) => r.includes('below minimum'))).toBe(false);
  });

  it('should include actual size in the reason message', () => {
    const result = detectSimulatedWork('hello', { min_size_bytes: 1000 });
    expect(result.simulated).toBe(true);
    expect(result.reasons.some((r) => r.includes('5 bytes'))).toBe(true);
  });
});

// ============================================================================
// Required sections tests
// ============================================================================

describe('detectSimulatedWork - required sections', () => {
  it('should flag content missing required section', () => {
    const checks: SimulatedWorkCheck = {
      required_sections: [
        { pattern: '^# ', required: true, description: 'Must have a heading' },
      ],
    };
    const result = detectSimulatedWork('No heading here\nJust plain text', checks);
    expect(result.simulated).toBe(true);
    expect(result.reasons.some((r) => r.includes('Missing required section: Must have a heading'))).toBe(true);
  });

  it('should pass content with required section present', () => {
    const checks: SimulatedWorkCheck = {
      required_sections: [
        { pattern: '^# ', required: true, description: 'Must have a heading' },
      ],
    };
    // Create diverse content to pass uniqueness checks too
    const lines = [
      '# My Heading',
      'This is line two with different content.',
      'Line three discusses something else entirely.',
      'Fourth line has unique information.',
      'Fifth line wraps up the document.',
    ];
    const result = detectSimulatedWork(lines.join('\n'), checks);
    expect(result.reasons.some((r) => r.includes('Missing required section'))).toBe(false);
  });

  it('should not flag non-required section misses', () => {
    const checks: SimulatedWorkCheck = {
      required_sections: [
        { pattern: 'optional-thing', required: false, description: 'Nice to have' },
      ],
    };
    const lines = [
      'Line one with unique content.',
      'Line two is different.',
      'Line three also varies.',
      'Line four contains more.',
      'Line five finishes up.',
    ];
    const result = detectSimulatedWork(lines.join('\n'), checks);
    expect(result.reasons.some((r) => r.includes('Missing required section'))).toBe(false);
  });
});

// ============================================================================
// Unique line ratio tests
// ============================================================================

describe('detectSimulatedWork - unique line ratio', () => {
  it('should flag content with all identical lines as low uniqueness', () => {
    const content = Array(20).fill('This is the same line.').join('\n');
    const result = detectSimulatedWork(content, {});
    expect(result.simulated).toBe(true);
    expect(result.reasons.some((r) => r.includes('Unique line ratio'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('repeated boilerplate'))).toBe(true);
  });

  it('should pass content with diverse lines', () => {
    const lines = Array.from({ length: 20 }, (_, i) =>
      `Line ${i}: This is unique content number ${i * 7 + 3} for testing.`,
    );
    const result = detectSimulatedWork(lines.join('\n'), {});
    expect(result.reasons.some((r) => r.includes('Unique line ratio'))).toBe(false);
  });

  it('should use custom min_unique_line_ratio threshold', () => {
    // 5 unique out of 10 = 0.5 ratio
    const lines = [
      ...Array(5).fill('repeated line'),
      'unique 1', 'unique 2', 'unique 3', 'unique 4', 'unique 5',
    ];
    // With default 0.3, this should pass (0.5 > 0.3)
    const result1 = detectSimulatedWork(lines.join('\n'), {});
    expect(result1.reasons.some((r) => r.includes('Unique line ratio'))).toBe(false);

    // With strict 0.8, this should fail (0.5 < 0.8)
    const result2 = detectSimulatedWork(lines.join('\n'), { min_unique_line_ratio: 0.8 });
    expect(result2.reasons.some((r) => r.includes('Unique line ratio'))).toBe(true);
  });
});

// ============================================================================
// Repeated block tests
// ============================================================================

describe('detectSimulatedWork - repeated blocks', () => {
  it('should flag content with 5+ consecutive identical lines', () => {
    const lines = [
      'unique header',
      ...Array(8).fill('This line is repeated many times.'),
      'unique footer',
    ];
    const result = detectSimulatedWork(lines.join('\n'), {});
    expect(result.simulated).toBe(true);
    expect(result.reasons.some((r) => r.includes('Repeated block ratio'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('1 repeated blocks'))).toBe(true);
  });

  it('should not flag content with only 2 consecutive identical lines', () => {
    const lines = [
      'unique line 1',
      'repeated twice',
      'repeated twice',
      'unique line 3',
      'unique line 4',
      'unique line 5',
      'unique line 6',
      'unique line 7',
    ];
    const result = detectSimulatedWork(lines.join('\n'), {});
    expect(result.reasons.some((r) => r.includes('Repeated block ratio'))).toBe(false);
  });

  it('should use custom max_repeated_block_ratio threshold', () => {
    // 3 repeated out of 10 total = 0.3 ratio
    const lines = [
      'unique 1', 'unique 2', 'unique 3', 'unique 4',
      'unique 5', 'unique 6', 'unique 7',
      'repeated', 'repeated', 'repeated',
    ];
    // Default 0.4 → 0.3 < 0.4 → should pass
    const result1 = detectSimulatedWork(lines.join('\n'), {});
    expect(result1.reasons.some((r) => r.includes('Repeated block ratio'))).toBe(false);

    // Custom 0.2 → 0.3 > 0.2 → should fail
    const result2 = detectSimulatedWork(lines.join('\n'), { max_repeated_block_ratio: 0.2 });
    expect(result2.reasons.some((r) => r.includes('Repeated block ratio'))).toBe(true);
  });
});

// ============================================================================
// Real-world content tests
// ============================================================================

describe('detectSimulatedWork - real-world content', () => {
  it('should pass real-world-like content with diverse paragraphs', () => {
    const content = `# Teaching Note: v1.51.23

## Observations

The student demonstrated strong understanding of polynomial factoring
through systematic application of the rational roots theorem. Key insight:
checking divisors of the constant term first dramatically reduces work.

## Findings

1. Pattern P-002 (unjustified parameter) appeared again in the choice of
   integration bounds. The student used [-1, 1] without explaining why.
2. Proof by induction was correctly applied but the base case was weak.

## Recommendations

- Require explicit justification for all parameter choices
- Practice base case construction separately before combining with inductive step
- Review the connection between polynomial degree and number of roots
`;
    const checks: SimulatedWorkCheck = {
      min_size_bytes: 200,
      required_sections: [
        { pattern: '^# ', required: true, description: 'Must have heading' },
        { pattern: '([Ff]inding|[Oo]bservation)', required: true, description: 'Must have findings' },
      ],
    };
    const result = detectSimulatedWork(content, checks);
    expect(result.reasons).toEqual([]);
    expect(result.simulated).toBe(false);
  });
});

// ============================================================================
// Multiple failures test
// ============================================================================

describe('detectSimulatedWork - multiple failures', () => {
  it('should collect all reasons without short-circuiting', () => {
    const checks: SimulatedWorkCheck = {
      min_size_bytes: 10000,
      required_sections: [
        { pattern: '^# MISSING_HEADING', required: true, description: 'Expected heading' },
        { pattern: 'MISSING_SECTION', required: true, description: 'Expected section' },
      ],
    };
    const content = Array(20).fill('Repeated boilerplate line.').join('\n');
    const result = detectSimulatedWork(content, checks);

    expect(result.simulated).toBe(true);
    // Should have: size below, two missing sections, low uniqueness, repeated blocks
    expect(result.reasons.length).toBeGreaterThanOrEqual(4);
    expect(result.reasons.some((r) => r.includes('below minimum'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Expected heading'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Expected section'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Unique line ratio'))).toBe(true);
  });
});

// ============================================================================
// Default threshold tests
// ============================================================================

describe('detectSimulatedWork - default thresholds', () => {
  it('should apply default 0.3 unique line ratio when not specified', () => {
    // 2 unique out of 10 = 0.2, below default 0.3
    const lines = [
      ...Array(5).fill('line A'),
      ...Array(5).fill('line B'),
    ];
    const result = detectSimulatedWork(lines.join('\n'), {});
    expect(result.reasons.some((r) => r.includes('Unique line ratio'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('0.30') || r.includes('minimum 0.3'))).toBe(true);
  });

  it('should apply default 0.4 repeated block ratio when not specified', () => {
    // 6 in blocks out of 10 total = 0.6, above default 0.4
    const lines = [
      'unique 1', 'unique 2', 'unique 3', 'unique 4',
      'repeated', 'repeated', 'repeated',
      'repeated', 'repeated', 'repeated',
    ];
    const result = detectSimulatedWork(lines.join('\n'), {});
    expect(result.reasons.some((r) => r.includes('Repeated block ratio'))).toBe(true);
  });
});

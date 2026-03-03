/**
 * Behavioral tests for test quality classifier.
 *
 * Proves that classifyTestEvidence correctly distinguishes shape-only checks
 * (file existence, line counts, export counts) from behavioral assertions
 * (function output, error handling, state transitions).
 *
 * Also proves formatAdvisoryMessage produces clear, human-readable advisory
 * messages that explain the behavioral vs shape-only distinction.
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';

// Module under test
const testQuality = require(join(process.env.HOME!, '.claude/get-shit-done/bin/lib/test-quality.cjs'));
const {
  classifyTestEvidence,
  formatAdvisoryMessage,
  SHAPE_ONLY_PATTERNS,
  BEHAVIORAL_PATTERNS,
} = testQuality;

// ============================================================================
// classifyTestEvidence
// ============================================================================

describe('classifyTestEvidence', () => {
  describe('shape-only detection', () => {
    it('returns shape-only for file existence checks (existsSync)', () => {
      const result = classifyTestEvidence('fs.existsSync(path)');
      expect(result.classification).toBe('shape-only');
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });

    it('returns shape-only for line count checks', () => {
      const result = classifyTestEvidence('lineCount > 10');
      expect(result.classification).toBe('shape-only');
      expect(typeof result.reason).toBe('string');
    });

    it('returns shape-only for export count checks', () => {
      const result = classifyTestEvidence('exports.length === 5');
      expect(result.classification).toBe('shape-only');
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('behavioral detection', () => {
    it('returns behavioral for function output assertions', () => {
      const result = classifyTestEvidence('expect(fn(input)).toBe(output)');
      expect(result.classification).toBe('behavioral');
      expect(typeof result.reason).toBe('string');
    });

    it('returns behavioral for error handling assertions', () => {
      const result = classifyTestEvidence('expect(() => fn()).toThrow()');
      expect(result.classification).toBe('behavioral');
      expect(typeof result.reason).toBe('string');
    });

    it('returns behavioral for state transition assertions', () => {
      const result = classifyTestEvidence('expect(result.state).toBe("active")');
      expect(result.classification).toBe('behavioral');
      expect(typeof result.reason).toBe('string');
    });
  });

  describe('mixed evidence', () => {
    it('returns behavioral when both shape-only and behavioral present (behavioral trumps)', () => {
      const mixedEvidence = `
        fs.existsSync(path)
        lineCount > 10
        expect(fn(input)).toBe(output)
      `;
      const result = classifyTestEvidence(mixedEvidence);
      expect(result.classification).toBe('behavioral');
    });
  });

  describe('edge cases', () => {
    it('returns unknown for empty string', () => {
      const result = classifyTestEvidence('');
      expect(result.classification).toBe('unknown');
      expect(result.reason).toBe('No test evidence provided');
    });
  });

  describe('adversarial proof', () => {
    it('is NOT a constant function always returning behavioral', () => {
      // If classifyTestEvidence were always returning 'behavioral',
      // the shape-only test cases would fail. This test proves
      // the function actually checks patterns.
      const shapeResult = classifyTestEvidence('fs.existsSync(path)');
      const behavioralResult = classifyTestEvidence('expect(fn(input)).toBe(output)');
      expect(shapeResult.classification).not.toBe(behavioralResult.classification);
    });
  });
});

// ============================================================================
// Pattern arrays
// ============================================================================

describe('SHAPE_ONLY_PATTERNS', () => {
  it('is an array of { pattern: RegExp, label: string } entries', () => {
    expect(Array.isArray(SHAPE_ONLY_PATTERNS)).toBe(true);
    expect(SHAPE_ONLY_PATTERNS.length).toBeGreaterThan(0);
    for (const entry of SHAPE_ONLY_PATTERNS) {
      expect(entry.pattern).toBeInstanceOf(RegExp);
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe('BEHAVIORAL_PATTERNS', () => {
  it('is an array of { pattern: RegExp, label: string } entries', () => {
    expect(Array.isArray(BEHAVIORAL_PATTERNS)).toBe(true);
    expect(BEHAVIORAL_PATTERNS.length).toBeGreaterThan(0);
    for (const entry of BEHAVIORAL_PATTERNS) {
      expect(entry.pattern).toBeInstanceOf(RegExp);
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// formatAdvisoryMessage
// ============================================================================

describe('formatAdvisoryMessage', () => {
  it('produces warning containing "insufficient evidence", "shape-only", and req ID for shape-only', () => {
    const msg = formatAdvisoryMessage({
      reqId: 'TEST-01',
      classification: 'shape-only',
      reason: 'file existence check',
    });
    expect(msg).toContain('insufficient');
    expect(msg).toContain('shape-only');
    expect(msg).toContain('TEST-01');
  });

  it('explains what "behavioral" means (asserting outputs, side effects, or error handling)', () => {
    const msg = formatAdvisoryMessage({
      reqId: 'TEST-01',
      classification: 'shape-only',
      reason: 'file existence check',
    });
    // Should mention what behavioral tests do
    expect(msg).toMatch(/output|side.?effect|error.?handling|state.?transition/i);
  });

  it('explains what "shape-only" means (checking file existence, line counts, or export counts)', () => {
    const msg = formatAdvisoryMessage({
      reqId: 'TEST-01',
      classification: 'shape-only',
      reason: 'file existence check',
    });
    // Should mention what shape-only tests check
    expect(msg).toMatch(/file.?exist|line.?count|export/i);
  });

  it('contains the word "advisory" or "non-blocking"', () => {
    const msg = formatAdvisoryMessage({
      reqId: 'TEST-01',
      classification: 'shape-only',
      reason: 'file existence check',
    });
    expect(msg).toMatch(/advisory|non-blocking/i);
  });

  it('produces a passing message for behavioral classification', () => {
    const msg = formatAdvisoryMessage({
      reqId: 'REQ-99',
      classification: 'behavioral',
      reason: 'output assertion',
    });
    // Should NOT contain warning indicators
    expect(msg).not.toMatch(/insufficient|warning/i);
    expect(msg).toContain('REQ-99');
    expect(msg).toMatch(/confirmed|pass|verified/i);
  });

  it('produces a warning about missing test evidence for unknown classification', () => {
    const msg = formatAdvisoryMessage({
      reqId: 'REQ-00',
      classification: 'unknown',
      reason: 'no evidence',
    });
    expect(msg).toContain('REQ-00');
    expect(msg).toMatch(/no.*evidence|missing.*evidence|advisory/i);
  });
});

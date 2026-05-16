import { describe, it, expect } from 'vitest';
import {
  isValidMonth,
  isValidArxivId,
  isValidScore,
  RELEVANCE_DOMAINS,
} from './types.js';

describe('Validators', () => {
  it('isValidMonth accepts valid months and rejects invalid ones', () => {
    // Valid formats
    expect(isValidMonth('2026-05')).toBe(true);
    expect(isValidMonth('2025-01')).toBe(true);
    expect(isValidMonth('2025-12')).toBe(true);

    // Invalid formats
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-5')).toBe(false);
    expect(isValidMonth('26-05')).toBe(false);
    expect(isValidMonth('')).toBe(false);
    expect(isValidMonth('2026-00')).toBe(false);
  });

  it('isValidArxivId accepts valid arxiv IDs and rejects invalid ones', () => {
    // Valid formats
    expect(isValidArxivId('2605.12345')).toBe(true);
    expect(isValidArxivId('2605.12345v2')).toBe(true);
    expect(isValidArxivId('2605.123456v10')).toBe(true);
    expect(isValidArxivId('2605.1234')).toBe(true);

    // Invalid formats
    expect(isValidArxivId('26.12345')).toBe(false);
    expect(isValidArxivId('2605.1')).toBe(false);
    expect(isValidArxivId('random-string')).toBe(false);
    expect(isValidArxivId('')).toBe(false);
  });

  it('isValidScore accepts valid scores and rejects invalid ones', () => {
    // Valid scores
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(0.5)).toBe(true);
    expect(isValidScore(1)).toBe(true);
    expect(isValidScore(0.123)).toBe(true);

    // Invalid scores
    expect(isValidScore(-0.1)).toBe(false);
    expect(isValidScore(1.1)).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
    expect(isValidScore(Infinity)).toBe(false);
  });

  it('RELEVANCE_DOMAINS constant matches the RelevanceDomain type', () => {
    expect(RELEVANCE_DOMAINS).toEqual([
      'agent-orchestration',
      'skill-design',
      'code-gen',
      'memory-retrieval',
    ]);
    expect(RELEVANCE_DOMAINS.length).toBe(4);
    expect(new Set(RELEVANCE_DOMAINS).size).toBe(4);
  });
});

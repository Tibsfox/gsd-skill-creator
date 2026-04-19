/**
 * Tests for `src/output-structure/schema.ts`
 *
 * Coverage:
 *   - classifyTractability — all three kinds + null/undefined + exhaustiveness
 *   - TRACTABILITY_LABELS — all keys present
 *   - OUTPUT_STRUCTURE_KINDS — exact values
 */

import { describe, it, expect } from 'vitest';
import {
  classifyTractability,
  TRACTABILITY_LABELS,
  OUTPUT_STRUCTURE_KINDS,
} from '../schema.js';
import type { OutputStructure } from '../schema.js';

describe('OUTPUT_STRUCTURE_KINDS', () => {
  it('contains exactly json-schema, markdown-template, prose', () => {
    expect([...OUTPUT_STRUCTURE_KINDS].sort()).toEqual(
      ['json-schema', 'markdown-template', 'prose'].sort(),
    );
  });
});

describe('classifyTractability', () => {
  it('returns tractable for json-schema', () => {
    const s: OutputStructure = { kind: 'json-schema', schema: '{"type":"object"}' };
    expect(classifyTractability(s)).toBe('tractable');
  });

  it('returns tractable for markdown-template', () => {
    const s: OutputStructure = { kind: 'markdown-template', template: '## Section\n{{content}}' };
    expect(classifyTractability(s)).toBe('tractable');
  });

  it('returns coin-flip for prose', () => {
    const s: OutputStructure = { kind: 'prose' };
    expect(classifyTractability(s)).toBe('coin-flip');
  });

  it('returns unknown for null', () => {
    expect(classifyTractability(null)).toBe('unknown');
  });

  it('returns unknown for undefined', () => {
    expect(classifyTractability(undefined)).toBe('unknown');
  });

  it('tractable is not the same as coin-flip', () => {
    const tractable = classifyTractability({ kind: 'json-schema', schema: '' });
    const coinFlip = classifyTractability({ kind: 'prose' });
    expect(tractable).not.toBe(coinFlip);
  });
});

describe('TRACTABILITY_LABELS', () => {
  it('has a label for tractable', () => {
    expect(typeof TRACTABILITY_LABELS.tractable).toBe('string');
    expect(TRACTABILITY_LABELS.tractable.length).toBeGreaterThan(0);
  });

  it('has a label for coin-flip', () => {
    expect(typeof TRACTABILITY_LABELS['coin-flip']).toBe('string');
    expect(TRACTABILITY_LABELS['coin-flip'].length).toBeGreaterThan(0);
  });

  it('has a label for unknown', () => {
    expect(typeof TRACTABILITY_LABELS.unknown).toBe('string');
    expect(TRACTABILITY_LABELS.unknown.length).toBeGreaterThan(0);
  });

  it('all three labels are distinct', () => {
    const labels = Object.values(TRACTABILITY_LABELS);
    const unique = new Set(labels);
    expect(unique.size).toBe(3);
  });
});

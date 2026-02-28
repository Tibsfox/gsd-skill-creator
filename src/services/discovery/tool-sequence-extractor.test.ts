/**
 * TDD tests for tool sequence n-gram extraction.
 *
 * Tests extractNgrams (sliding-window n-gram counting over string arrays)
 * and buildToolSequence (ParsedEntry[] -> flat tool name array).
 */

import { describe, it, expect } from 'vitest';
import { extractNgrams, buildToolSequence } from './tool-sequence-extractor.js';
import type { ParsedEntry, ExtractedToolUse } from './types.js';

// ============================================================================
// extractNgrams
// ============================================================================

describe('extractNgrams', () => {
  describe('bigrams (n=2)', () => {
    it('returns correct bigram counts from a simple sequence', () => {
      const result = extractNgrams(['Read', 'Edit', 'Bash'], 2);
      expect(result).toEqual(new Map([
        ['Read->Edit', 1],
        ['Edit->Bash', 1],
      ]));
    });

    it('counts repeated bigrams', () => {
      const result = extractNgrams(['Bash', 'Bash', 'Bash'], 2);
      expect(result).toEqual(new Map([
        ['Bash->Bash', 2],
      ]));
    });

    it('counts multiple occurrences of the same bigram across the sequence', () => {
      const result = extractNgrams(['Read', 'Read', 'Edit', 'Bash', 'Read', 'Edit'], 2);
      expect(result).toEqual(new Map([
        ['Read->Read', 1],
        ['Read->Edit', 2],
        ['Edit->Bash', 1],
        ['Bash->Read', 1],
      ]));
    });

    it('returns empty map when sequence is shorter than n', () => {
      const result = extractNgrams(['Read'], 2);
      expect(result).toEqual(new Map());
    });
  });

  describe('trigrams (n=3)', () => {
    it('returns correct trigram from a 3-element sequence', () => {
      const result = extractNgrams(['Read', 'Edit', 'Bash'], 3);
      expect(result).toEqual(new Map([
        ['Read->Edit->Bash', 1],
      ]));
    });

    it('counts repeated trigrams across a longer sequence', () => {
      const result = extractNgrams(['Read', 'Edit', 'Bash', 'Read', 'Edit', 'Bash'], 3);
      expect(result).toEqual(new Map([
        ['Read->Edit->Bash', 2],
        ['Edit->Bash->Read', 1],
        ['Bash->Read->Edit', 1],
      ]));
    });
  });

  describe('edge cases', () => {
    it('returns empty map for empty sequence', () => {
      const result = extractNgrams([], 3);
      expect(result).toEqual(new Map());
    });

    it('returns empty map when sequence length equals n-1', () => {
      const result = extractNgrams(['Read', 'Edit'], 3);
      expect(result).toEqual(new Map());
    });

    it('returns single entry when sequence length equals n', () => {
      const result = extractNgrams(['Read', 'Edit'], 2);
      expect(result).toEqual(new Map([
        ['Read->Edit', 1],
      ]));
    });
  });
});

// ============================================================================
// buildToolSequence
// ============================================================================

describe('buildToolSequence', () => {
  const tool = (name: string): ExtractedToolUse => ({ name, input: {} });

  it('extracts tool names from a single tool-uses entry', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Read')] },
    ];
    expect(buildToolSequence(entries)).toEqual(['Read']);
  });

  it('flattens tool names across multiple tool-uses entries', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Read'), tool('Edit')] },
      { kind: 'tool-uses', data: [tool('Bash')] },
    ];
    expect(buildToolSequence(entries)).toEqual(['Read', 'Edit', 'Bash']);
  });

  it('filters out tool-uses entries with empty data arrays', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [] },
      { kind: 'tool-uses', data: [tool('Read')] },
    ];
    expect(buildToolSequence(entries)).toEqual(['Read']);
  });

  it('ignores non-tool-uses entries (user-prompt, skipped)', () => {
    const entries: ParsedEntry[] = [
      { kind: 'user-prompt', data: { text: 'hello', sessionId: 's1', timestamp: 't1', cwd: '/' } },
      { kind: 'skipped', type: 'progress' },
    ];
    expect(buildToolSequence(entries)).toEqual([]);
  });

  it('handles mixed entry kinds correctly', () => {
    const entries: ParsedEntry[] = [
      { kind: 'user-prompt', data: { text: 'fix bug', sessionId: 's1', timestamp: 't1', cwd: '/app' } },
      { kind: 'tool-uses', data: [tool('Read'), tool('Grep')] },
      { kind: 'skipped', type: 'progress' },
      { kind: 'tool-uses', data: [] },
      { kind: 'tool-uses', data: [tool('Edit'), tool('Bash')] },
    ];
    expect(buildToolSequence(entries)).toEqual(['Read', 'Grep', 'Edit', 'Bash']);
  });

  it('returns empty array for empty input', () => {
    expect(buildToolSequence([])).toEqual([]);
  });
});

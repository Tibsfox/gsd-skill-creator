/**
 * CF-M2-03 — reflection 1000 raw → ≤100 long-term with lossless entity recall
 */

import { describe, it, expect } from 'vitest';
import { Reflector } from '../reflection.js';
import { LongTermMemory } from '../long-term.js';
import { tokenize } from '../scorer.js';
import type { MemoryEntry } from '../../types/memory.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(id: string, content: string, ts?: number): MemoryEntry {
  return {
    id,
    content,
    ts:    ts ?? Date.now(),
    alpha: 0.4,
    beta:  0.4,
    gamma: 0.2,
    score: 0,
  };
}

/** Generate N diverse entries covering many distinct topics / tokens. */
function makeNEntries(n: number): MemoryEntry[] {
  const now = Date.now();
  const topics = [
    'debug session skill activated workflow pipeline command',
    'refactoring test build deploy merge commit push branch',
    'memory scoring recency relevance importance alpha beta gamma',
    'short-term long-term reflection batch summary cluster entity',
    'chroma postgres pg-store ram-cache tier eviction promotion',
    'typescript rust tauri vite vitest test suite coverage',
    'grove format hash record encode decode namespace binding',
    'skill codebase view manifest packager workspace arena file',
    'artemis mission nasa seattle degree release notes version',
    'cooking recipe unrelated content filler padding noise data',
  ];
  const entries: MemoryEntry[] = [];
  for (let i = 0; i < n; i++) {
    const topic = topics[i % topics.length];
    entries.push(makeEntry(`e${i}`, `${topic} entry-id-${i}`, now - i * 1000));
  }
  return entries;
}

/** Collect all unique tokens from a set of entries. */
function collectTokens(entries: MemoryEntry[]): Set<string> {
  const tokens = new Set<string>();
  for (const e of entries) {
    for (const t of tokenize(e.content)) tokens.add(t);
  }
  return tokens;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CF-M2-03: reflection 1000→≤100 with lossless entity recall', () => {
  it('compresses 1000 entries to ≤100 summaries', () => {
    const reflector = new Reflector({ compressionRatio: 10, maxSummaries: 100 });
    const entries = makeNEntries(1000);
    const result = reflector.reflect(entries);

    expect(result.inputCount).toBe(1000);
    expect(result.outputCount).toBeLessThanOrEqual(100);
    expect(result.summaries.length).toBeLessThanOrEqual(100);
  });

  it('lossless referenced-entity recall: all input tokens in at least one summary', () => {
    const reflector = new Reflector({ compressionRatio: 10, maxSummaries: 100 });
    const entries = makeNEntries(1000);
    const result = reflector.reflect(entries);

    expect(result.entityRecallLossless).toBe(true);

    // Double-check manually.
    const inputTokens   = collectTokens(entries);
    const summaryTokens = collectTokens(result.summaries);
    for (const t of inputTokens) {
      expect(summaryTokens.has(t)).toBe(true);
    }
  });

  it('returns a valid ReflectionBatch linking input ids to summary id', () => {
    const reflector = new Reflector();
    const entries = makeNEntries(100);
    const { batch, summaries } = reflector.reflect(entries);

    expect(batch.inputIds.length).toBe(100);
    expect(batch.summaryId).toBeTruthy();
    expect(batch.ts).toBeGreaterThan(0);
    // summaryId is the id of the first summary.
    expect(summaries[0].id).toBe(batch.summaryId);
  });

  it('handles empty input gracefully', () => {
    const reflector = new Reflector();
    const result = reflector.reflect([]);

    expect(result.inputCount).toBe(0);
    expect(result.summaries.length).toBe(1); // one empty-placeholder summary
    expect(result.batch.inputIds.length).toBe(0);
  });

  it('handles single entry gracefully', () => {
    const reflector = new Reflector();
    const result = reflector.reflect([makeEntry('solo', 'solo skill content')]);

    expect(result.inputCount).toBe(1);
    expect(result.outputCount).toBe(1);
    expect(result.entityRecallLossless).toBe(true);
  });

  it('does not exceed maxDepth (unbounded summary chain guard)', () => {
    // Even recursive calls should terminate.
    const reflector = new Reflector({ maxDepth: 1 });
    const entries = makeNEntries(1000);

    // depth=1 should immediately produce a single summary (maxDepth guard).
    const result = reflector.reflect(entries, 1);
    expect(result.summaries.length).toBeLessThanOrEqual(1);
  });

  it('summaries have valid MemoryEntry shape', () => {
    const reflector = new Reflector();
    const entries = makeNEntries(50);
    const { summaries } = reflector.reflect(entries);

    for (const s of summaries) {
      expect(typeof s.id).toBe('string');
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.content).toBe('string');
      expect(typeof s.ts).toBe('number');
      expect(typeof s.alpha).toBe('number');
      expect(typeof s.beta).toBe('number');
      expect(typeof s.gamma).toBe('number');
      expect(typeof s.score).toBe('number');
    }
  });
});

describe('LongTermMemory.summarize(): pure summarise behaviour', () => {
  const ltm = new LongTermMemory({ path: '/tmp/test-ltm-summarize.jsonl' });

  it('summarize() preserves entity set', () => {
    const entries = [
      makeEntry('a', 'debug skill session activated'),
      makeEntry('b', 'refactoring command pipeline workflow'),
    ];
    const summary = ltm.summarize(entries, 'test');

    const inputTokens   = collectTokens(entries);
    const summaryTokens = tokenize(summary.content);
    for (const t of inputTokens) {
      expect(summaryTokens.has(t)).toBe(true);
    }
  });

  it('summarize() returns fresh id on each call', () => {
    const entries = [makeEntry('x', 'content')];
    const s1 = ltm.summarize(entries, 'label');
    const s2 = ltm.summarize(entries, 'label');
    expect(s1.id).not.toBe(s2.id);
  });

  it('summarize() ts is max(entry ts)', () => {
    const now = 1_700_000_000_000;
    const entries = [
      makeEntry('a', 'debug', now - 5000),
      makeEntry('b', 'session', now),
      makeEntry('c', 'skill', now - 1000),
    ];
    const s = ltm.summarize(entries, 'test');
    expect(s.ts).toBe(now);
  });
});

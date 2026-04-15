import { describe, it, expect } from 'vitest';
import {
  loadRelevantMemories,
  loadRelevantMemoriesDetailed,
} from '../memory-loader.js';
import type { MemoryEntry, TaskContext } from '../relevance-scorer.js';

function entry(partial: Partial<MemoryEntry> & { id: string }): MemoryEntry {
  return {
    section: 'warm',
    keywords: [],
    content: '',
    tokenCount: 100,
    ...partial,
  };
}

const ctx: TaskContext = { files: [], topics: ['alpha'], commands: [] };

describe('loadRelevantMemories — T-MEM-05 budget enforcement', () => {
  it('respects tokenBudget', () => {
    const entries = [
      entry({ id: 'a', tokenCount: 500, section: 'hot', keywords: ['alpha'] }),
      entry({ id: 'b', tokenCount: 800, section: 'hot', keywords: ['alpha'] }),
      entry({ id: 'c', tokenCount: 1200, section: 'hot', keywords: ['alpha'] }),
    ];
    const res = loadRelevantMemoriesDetailed(entries, ctx, { tokenBudget: 1500 });
    expect(res.totalTokens).toBeLessThanOrEqual(1500);
    const ids = res.entries.map((e) => e.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('always-load entries bypass budget', () => {
    const entries = [
      entry({
        id: 'standing-rules',
        tokenCount: 5000,
        section: 'cold',
      }),
      entry({ id: 'other', tokenCount: 500, section: 'hot', keywords: ['alpha'] }),
    ];
    const res = loadRelevantMemoriesDetailed(entries, ctx, { tokenBudget: 1000 });
    const ids = res.entries.map((e) => e.id);
    expect(ids).toContain('standing-rules');
  });
});

describe('loadRelevantMemories — T-MEM-06 sort order', () => {
  it('loaded entries are emitted with always-load first, then by score desc', () => {
    const entries = [
      entry({ id: 'lowscore', tokenCount: 50, section: 'hot', keywords: ['alpha'] }),
      entry({
        id: 'highscore',
        tokenCount: 50,
        section: 'hot',
        keywords: ['alpha', 'beta', 'gamma'],
      }),
      entry({
        id: 'midscore',
        tokenCount: 50,
        section: 'hot',
        keywords: ['alpha', 'beta'],
      }),
    ];
    const fullCtx: TaskContext = {
      files: [],
      topics: ['alpha', 'beta', 'gamma'],
      commands: [],
    };
    const out = loadRelevantMemories(entries, fullCtx, { tokenBudget: 500 });
    expect(out.map((e) => e.id)).toEqual(['highscore', 'midscore', 'lowscore']);
  });
});

describe('loadRelevantMemories — threshold filter', () => {
  it('excludes entries below threshold', () => {
    const entries = [
      entry({ id: 'weak', section: 'cold', keywords: ['off-topic'] }),
      entry({ id: 'strong', section: 'hot', keywords: ['alpha', 'beta'] }),
    ];
    const fullCtx: TaskContext = { files: [], topics: ['alpha', 'beta'], commands: [] };
    const out = loadRelevantMemories(entries, fullCtx, { threshold: 0.3, tokenBudget: 10000 });
    const ids = out.map((e) => e.id);
    expect(ids).toContain('strong');
    expect(ids).not.toContain('weak');
  });
});

describe('loadRelevantMemories — determinism', () => {
  it('same inputs yield identical selection', () => {
    const entries = [
      entry({ id: 'a', tokenCount: 100, section: 'hot', keywords: ['alpha'] }),
      entry({ id: 'b', tokenCount: 100, section: 'hot', keywords: ['alpha'] }),
      entry({ id: 'c', tokenCount: 100, section: 'hot', keywords: ['alpha'] }),
    ];
    const r1 = loadRelevantMemories(entries, ctx);
    const r2 = loadRelevantMemories(entries, ctx);
    expect(r1.map((e) => e.id)).toEqual(r2.map((e) => e.id));
  });
});

import { describe, it, expect } from 'vitest';
import {
  scoreMemoryRelevance,
  tokenizeContext,
  type MemoryEntry,
  type TaskContext,
} from '../relevance-scorer.js';

const emptyCtx: TaskContext = { files: [], topics: [], commands: [] };

function entry(partial: Partial<MemoryEntry> & { id: string }): MemoryEntry {
  return {
    section: 'warm',
    keywords: [],
    content: '',
    tokenCount: 100,
    ...partial,
  };
}

describe('scoreMemoryRelevance — T-MEM-01 bounds', () => {
  it('returns scores in [0,1] for every input entry', () => {
    const entries: MemoryEntry[] = [
      entry({ id: 'a', section: 'hot', keywords: ['foo', 'bar', 'baz', 'qux', 'zed'] }),
      entry({ id: 'b', section: 'cold' }),
      entry({ id: 'c', section: 'warm', keywords: ['x'] }),
    ];
    const ctx: TaskContext = { files: ['foo/bar.ts'], topics: ['baz'], commands: ['qux zed'] };
    const out = scoreMemoryRelevance(entries, ctx);
    expect(out).toHaveLength(3);
    for (const s of out) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });
});

describe('scoreMemoryRelevance — T-MEM-02 standing rule', () => {
  it('standing-rules entry always scores 1.0', () => {
    const entries = [entry({ id: 'standing-rules', section: 'cold' })];
    const out = scoreMemoryRelevance(entries, emptyCtx);
    expect(out[0].score).toBe(1.0);
    expect(out[0].reason).toContain('always-load');
  });

  it('entry with alwaysLoad flag scores 1.0', () => {
    const entries = [entry({ id: 'custom', alwaysLoad: true, section: 'cold' })];
    const out = scoreMemoryRelevance(entries, emptyCtx);
    expect(out[0].score).toBe(1.0);
  });

  it('entry tagged with standing-rule keyword scores 1.0', () => {
    const entries = [entry({ id: 'custom', keywords: ['standing-rule'], section: 'cold' })];
    const out = scoreMemoryRelevance(entries, emptyCtx);
    expect(out[0].score).toBe(1.0);
  });
});

describe('scoreMemoryRelevance — T-MEM-03 hot boost', () => {
  it('HOT entries receive +0.2 base boost', () => {
    const entries = [
      entry({ id: 'h', section: 'hot' }),
      entry({ id: 'w', section: 'warm' }),
    ];
    const out = scoreMemoryRelevance(entries, emptyCtx);
    expect(out[0].score).toBeCloseTo(0.2, 5);
    expect(out[1].score).toBe(0);
  });
});

describe('scoreMemoryRelevance — T-MEM-04 keyword overlap cap', () => {
  it('overlap contributes proportionally capped at +0.3', () => {
    const entries = [
      entry({ id: 'one', section: 'cold', keywords: ['alpha'] }),
      entry({ id: 'three', section: 'cold', keywords: ['alpha', 'beta', 'gamma'] }),
      entry({
        id: 'five',
        section: 'cold',
        keywords: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
      }),
    ];
    const ctx: TaskContext = {
      files: [],
      topics: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
      commands: [],
    };
    const out = scoreMemoryRelevance(entries, ctx);
    expect(out[0].score).toBeCloseTo(0.1, 5);
    expect(out[1].score).toBeCloseTo(0.3, 5);
    expect(out[2].score).toBeCloseTo(0.3, 5);
  });
});

describe('scoreMemoryRelevance — T-MEM-07 off-topic excluded', () => {
  it('NASA entry scores below default threshold on cartridge-work context', () => {
    const entries = [
      entry({
        id: 'nasa-missions',
        section: 'warm',
        keywords: ['nasa', 'mission', 'apollo', 'explorer'],
      }),
      entry({
        id: 'cartridge',
        section: 'hot',
        keywords: ['cartridge', 'chipset', 'forge'],
      }),
    ];
    const ctx: TaskContext = {
      files: ['src/cartridge/loader.ts'],
      topics: ['cartridge', 'chipset'],
      commands: ['skill-creator cartridge list'],
    };
    const out = scoreMemoryRelevance(entries, ctx);
    const nasa = out.find((s) => s.entryId === 'nasa-missions')!;
    const cart = out.find((s) => s.entryId === 'cartridge')!;
    expect(nasa.score).toBeLessThan(0.3);
    expect(cart.score).toBeGreaterThanOrEqual(0.3);
  });
});

describe('scoreMemoryRelevance — T-MEM-08 determinism', () => {
  it('same inputs yield identical outputs', () => {
    const entries: MemoryEntry[] = [
      entry({ id: 'a', section: 'hot', keywords: ['foo'] }),
      entry({ id: 'b', section: 'warm', keywords: ['bar', 'baz'] }),
      entry({ id: 'c', section: 'cold', keywords: ['qux'] }),
    ];
    const ctx: TaskContext = {
      files: ['src/foo/bar.ts'],
      topics: ['baz', 'qux'],
      commands: ['run test'],
    };
    const first = scoreMemoryRelevance(entries, ctx);
    const second = scoreMemoryRelevance(entries, ctx);
    const third = scoreMemoryRelevance(entries, ctx);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(JSON.stringify(second)).toBe(JSON.stringify(third));
  });
});

describe('tokenizeContext', () => {
  it('splits on /, -, _, ., whitespace; lowercases; drops <2 chars', () => {
    const words = tokenizeContext({
      files: ['src/Memory/Foo-Bar.ts'],
      topics: ['A B'],
      commands: ['git log --format=%ai'],
    });
    expect(words.has('src')).toBe(true);
    expect(words.has('memory')).toBe(true);
    expect(words.has('foo')).toBe(true);
    expect(words.has('bar')).toBe(true);
    expect(words.has('ts')).toBe(true);
    expect(words.has('a')).toBe(false);
    expect(words.has('b')).toBe(false);
    expect(words.has('git')).toBe(true);
    expect(words.has('log')).toBe(true);
  });
});

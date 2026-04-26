// CF-H-006 — survey-scorer unit tests.
//
// Covers:
//   - tokenize behaviour
//   - relevance overlap floor + ceiling
//   - half-life decay (exact values for known inputs)
//   - threshold cutoff
//   - pinned-rule passthrough invariant (also tested in
//     standing-rules-preservation.test.ts as a regression guard)
//   - deterministic ordering
//   - misuse rejection (pinned_rule_passthrough must be true if set)
//
// Closes: OGA-006 (HIGH).

import { describe, it, expect } from 'vitest';
import {
  survey,
  relevance,
  halfLifeDecay,
  tokenize,
  totalTokens,
  type MemoryEntry,
} from '../survey-scorer.js';

const NOW = new Date('2026-04-25T12:00:00Z');

function entry(partial: Partial<MemoryEntry> & { name: string }): MemoryEntry {
  return {
    description: '',
    type: 'project',
    half_life: 'infinite',
    last_accessed: NOW.toISOString(),
    confidence: 1.0,
    body: '',
    ...partial,
  };
}

describe('CF-H-006: tokenize', () => {
  it('lowercases and skips short tokens', () => {
    const out = tokenize('Foo Bar a-b X');
    expect(out.has('foo')).toBe(true);
    expect(out.has('bar')).toBe(true);
    expect(out.has('a-b')).toBe(true);
    expect(out.has('x')).toBe(false); // length 1
  });

  it('returns empty set for empty input', () => {
    expect(tokenize('').size).toBe(0);
  });

  it('splits on punctuation other than _ and -', () => {
    const out = tokenize('foo/bar.baz');
    expect(out.has('foo')).toBe(true);
    expect(out.has('bar')).toBe(true);
    expect(out.has('baz')).toBe(true);
  });
});

describe('CF-H-006: relevance', () => {
  it('returns 0 for empty context', () => {
    expect(relevance('', entry({ name: 'x', body: 'foo bar' }))).toBe(0);
  });

  it('returns 0 for empty entry', () => {
    expect(relevance('foo bar', entry({ name: 'x' }))).toBe(0);
  });

  it('returns 0 for no overlap', () => {
    expect(relevance('alpha beta', entry({ name: 'x', body: 'gamma delta' }))).toBe(0);
  });

  it('returns positive value for any overlap, capped at 1', () => {
    const r = relevance('foo bar baz', entry({ name: 'x', body: 'foo bar baz qux' }));
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThanOrEqual(1);
  });
});

describe('CF-H-006: halfLifeDecay', () => {
  it('always returns 1.0 for half_life=infinite', () => {
    const d = halfLifeDecay('2020-01-01T00:00:00Z', 'infinite', NOW);
    expect(d).toBe(1.0);
  });

  it('returns ~0.5 at exactly one half-life of age', () => {
    // 30 days before NOW
    const past = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const d = halfLifeDecay(past, '1mo', NOW);
    expect(d).toBeCloseTo(0.5, 5);
  });

  it('returns ~0.25 at two half-lives of age', () => {
    const past = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const d = halfLifeDecay(past, '1wk', NOW);
    expect(d).toBeCloseTo(0.25, 5);
  });

  it('returns 1.0 for invalid timestamps (do not penalize undated entries)', () => {
    expect(halfLifeDecay('not a date', '1mo', NOW)).toBe(1.0);
  });

  it('clamps negative ages (future timestamps) to 1.0 decay', () => {
    const future = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const d = halfLifeDecay(future, '1mo', NOW);
    // Future stamp -> ageDays clamped to 0 -> decay = 1
    expect(d).toBe(1.0);
  });
});

describe('CF-H-006: survey threshold + ordering', () => {
  it('keeps entries above threshold; sheds below', () => {
    const entries = [
      entry({ name: 'a', body: 'apple banana cherry', confidence: 1.0 }),
      entry({ name: 'b', body: 'unrelated topic', confidence: 1.0 }),
    ];
    const out = survey('apple banana cherry', entries, { threshold: 0.3 });
    expect(out.kept.map((e) => e.name)).toEqual(['a']);
    expect(out.shed.map((e) => e.name)).toEqual(['b']);
  });

  it('orders kept entries by descending score, then name ascending', () => {
    const entries = [
      entry({ name: 'low', body: 'apple', confidence: 0.5 }),
      entry({ name: 'high', body: 'apple banana cherry date', confidence: 1.0 }),
      entry({ name: 'mid', body: 'apple banana', confidence: 1.0 }),
    ];
    const out = survey('apple banana cherry date', entries, { threshold: 0 });
    expect(out.kept.map((e) => e.name)).toEqual(['high', 'mid', 'low']);
  });

  it('handles empty corpus gracefully', () => {
    const out = survey('anything', []);
    expect(out.kept).toEqual([]);
    expect(out.shed).toEqual([]);
  });

  it('handles all-shed corpus (everything below threshold)', () => {
    const entries = [
      entry({ name: 'a', body: 'foo', confidence: 0.1 }),
      entry({ name: 'b', body: 'bar', confidence: 0.1 }),
    ];
    const out = survey('totally unrelated context', entries, { threshold: 0.5 });
    expect(out.kept).toEqual([]);
    expect(out.shed.length).toBe(2);
  });
});

describe('CF-H-006: pinned-rule passthrough', () => {
  it('keeps pinned-rule entries even when relevance is 0', () => {
    const entries = [
      entry({
        name: 'always-on',
        type: 'pinned-rule',
        body: 'totally orthogonal content',
      }),
    ];
    const out = survey('apple banana cherry', entries, { threshold: 0.99 });
    expect(out.kept.map((e) => e.name)).toEqual(['always-on']);
    expect(out.shed).toEqual([]);
  });

  it('keeps pinned-rule entries even with extreme age and infinite-style decay', () => {
    const ancient = '1990-01-01T00:00:00Z';
    const entries = [
      entry({
        name: 'old-rule',
        type: 'pinned-rule',
        half_life: 'transient',
        last_accessed: ancient,
      }),
    ];
    const out = survey('whatever', entries, { now: NOW });
    expect(out.kept).toHaveLength(1);
    expect(out.shed).toHaveLength(0);
  });

  it('rejects misuse: pinned_rule_passthrough cannot be set to false', () => {
    expect(() =>
      survey('x', [], {
        // @ts-expect-error — invalid by contract
        pinned_rule_passthrough: false,
      }),
    ).toThrow(/HARD invariant/);
  });
});

describe('CF-H-006: totalTokens', () => {
  it('sums tokenCount across entries; treats undefined as 0', () => {
    const entries = [
      entry({ name: 'a', tokenCount: 100 }),
      entry({ name: 'b', tokenCount: 50 }),
      entry({ name: 'c' }), // undefined
    ];
    expect(totalTokens(entries)).toBe(150);
  });
});

describe('CF-H-006: performance budget', () => {
  it('scores a 70-entry corpus in <50ms', () => {
    const entries: MemoryEntry[] = [];
    for (let i = 0; i < 70; i++) {
      entries.push(
        entry({
          name: `entry-${i}`,
          body: `body for entry ${i} mentions topic-${i % 5} and feature-${i % 7}`,
          half_life: i % 3 === 0 ? '1mo' : '6mo',
          last_accessed: new Date(NOW.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
          confidence: 0.95,
        }),
      );
    }
    const t0 = performance.now();
    const out = survey('topic-2 feature-3', entries, { now: NOW });
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(50);
    expect(out.kept.length + out.shed.length).toBe(70);
  });
});

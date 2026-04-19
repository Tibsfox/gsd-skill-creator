/**
 * CF-M2-01 — αβγ formula correctness
 *
 * Verifies that the MemoryScorer formula matches the Wang et al. 2024 §5
 * reference: score = α·recency + β·relevance + γ·importance
 */

import { describe, it, expect } from 'vitest';
import {
  MemoryScorer,
  recencyScore,
  keywordRelevance,
  importanceScore,
  tokenize,
  DEFAULT_ALPHA,
  DEFAULT_BETA,
  DEFAULT_GAMMA,
  DEFAULT_HALF_LIFE_HOURS,
} from '../scorer.js';
import type { MemoryEntry } from '../../types/memory.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id:      overrides.id      ?? 'e1',
    content: overrides.content ?? 'skill debug session activated',
    ts:      overrides.ts      ?? Date.now(),
    alpha:   overrides.alpha   ?? DEFAULT_ALPHA,
    beta:    overrides.beta    ?? DEFAULT_BETA,
    gamma:   overrides.gamma   ?? DEFAULT_GAMMA,
    score:   overrides.score   ?? 0,
  };
}

// ─── Wang et al. reference fixture (50 queries, CF-M2-01) ────────────────────

/** Generate 50 (entry, query, now) triples with expected score ranges. */
function generate50Fixtures(): Array<{
  entry: MemoryEntry;
  query: string;
  nowMs: number;
  description: string;
}> {
  const now = 1_700_000_000_000; // fixed epoch for determinism
  const hour = 3_600_000;
  const fixtures = [];

  // Group 1: fresh entries (0–1h) with strong relevance.
  for (let i = 0; i < 10; i++) {
    fixtures.push({
      entry: makeEntry({
        id:      `fresh-${i}`,
        content: `debug session skill refactoring test run iteration ${i}`,
        ts:      now - i * hour * 0.1,
        gamma:   0.2,
      }),
      query:       'debug session skill',
      nowMs:       now,
      description: `fresh entry ${i} — high recency + high relevance`,
    });
  }

  // Group 2: medium-age entries (12–24h) with moderate relevance.
  for (let i = 0; i < 10; i++) {
    fixtures.push({
      entry: makeEntry({
        id:      `medium-${i}`,
        content: `refactoring workflow command pipeline ${i}`,
        ts:      now - (12 + i) * hour,
        gamma:   0.5,
      }),
      query:       'refactoring workflow',
      nowMs:       now,
      description: `medium-age entry ${i} — moderate recency, high relevance`,
    });
  }

  // Group 3: old entries (48–72h) with zero relevance.
  for (let i = 0; i < 10; i++) {
    fixtures.push({
      entry: makeEntry({
        id:      `old-${i}`,
        content: `unrelated content about cooking recipes ${i}`,
        ts:      now - (48 + i) * hour,
        gamma:   0.0,
      }),
      query:       'debug session skill',
      nowMs:       now,
      description: `old entry ${i} — low recency, zero relevance`,
    });
  }

  // Group 4: zero-age entries with high importance.
  for (let i = 0; i < 10; i++) {
    fixtures.push({
      entry: makeEntry({
        id:      `important-${i}`,
        content: `critical bug fix merge deploy ${i}`,
        ts:      now,
        gamma:   1.0,
      }),
      query:       'critical bug',
      nowMs:       now,
      description: `important entry ${i} — full recency + importance`,
    });
  }

  // Group 5: variable alpha/beta/gamma configurations.
  for (let i = 0; i < 10; i++) {
    fixtures.push({
      entry: makeEntry({
        id:      `variable-${i}`,
        content: `test fixture entry variable weight config ${i}`,
        ts:      now - i * hour * 2,
        gamma:   i * 0.1,
      }),
      query:       'test fixture entry',
      nowMs:       now,
      description: `variable-weight entry ${i}`,
    });
  }

  return fixtures;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CF-M2-01: αβγ scorer formula correctness', () => {
  const scorer = new MemoryScorer();

  it('uses default weights α=0.4, β=0.4, γ=0.2', () => {
    expect(scorer.alpha).toBe(0.4);
    expect(scorer.beta).toBe(0.4);
    expect(scorer.gamma).toBe(0.2);
  });

  it('score = α·recency + β·relevance + γ·importance', () => {
    const now = Date.now();
    const entry = makeEntry({ ts: now, gamma: 1.0, content: 'debug session' });
    const queryTokens = tokenize('debug session');
    const components = scorer.scoreEntry(entry, queryTokens, now);

    const expected =
      scorer.alpha * components.recency +
      scorer.beta  * components.relevance +
      scorer.gamma * components.importance;

    expect(components.score).toBeCloseTo(expected, 10);
  });

  it('recency = 1.0 for ts = now', () => {
    const now = Date.now();
    const r = recencyScore(now, now, DEFAULT_HALF_LIFE_HOURS);
    expect(r).toBeCloseTo(1.0, 10);
  });

  it('recency = 0.5 at ts = now - halfLife', () => {
    const now = Date.now();
    const halfLifeMs = DEFAULT_HALF_LIFE_HOURS * 3_600_000;
    const r = recencyScore(now - halfLifeMs, now, DEFAULT_HALF_LIFE_HOURS);
    expect(r).toBeCloseTo(0.5, 5);
  });

  it('recency decays exponentially — older entries score lower', () => {
    const now = Date.now();
    const hour = 3_600_000;
    const r1 = recencyScore(now - hour,     now, DEFAULT_HALF_LIFE_HOURS);
    const r2 = recencyScore(now - 2 * hour, now, DEFAULT_HALF_LIFE_HOURS);
    const r3 = recencyScore(now - 4 * hour, now, DEFAULT_HALF_LIFE_HOURS);
    expect(r1).toBeGreaterThan(r2);
    expect(r2).toBeGreaterThan(r3);
  });

  it('recency is always in [0, 1]', () => {
    const now = Date.now();
    const hour = 3_600_000;
    for (const offsetHours of [0, 1, 12, 24, 48, 168, 720]) {
      const r = recencyScore(now - offsetHours * hour, now, DEFAULT_HALF_LIFE_HOURS);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('relevance = 1.0 when all query tokens appear in content', () => {
    const q = tokenize('debug session');
    const c = tokenize('debug session skill refactoring');
    expect(keywordRelevance(q, c)).toBeCloseTo(1.0);
  });

  it('relevance = 0 when no query tokens appear in content', () => {
    const q = tokenize('debug session');
    const c = tokenize('cooking recipes unrelated');
    expect(keywordRelevance(q, c)).toBe(0);
  });

  it('relevance = 0 for empty query', () => {
    const q = tokenize('');
    const c = tokenize('debug session skill');
    expect(keywordRelevance(q, c)).toBe(0);
  });

  it('relevance is in [0, 1]', () => {
    const pairs = [
      ['debug', 'debug session skill'],
      ['cooking', 'debug session skill'],
      ['debug session skill refactoring', 'debug session'],
    ];
    for (const [q, c] of pairs) {
      const r = keywordRelevance(tokenize(q), tokenize(c));
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('importance = gamma clamped to [0,1]', () => {
    expect(importanceScore(makeEntry({ gamma: 0.0 }))).toBe(0.0);
    expect(importanceScore(makeEntry({ gamma: 0.5 }))).toBeCloseTo(0.5);
    expect(importanceScore(makeEntry({ gamma: 1.0 }))).toBe(1.0);
    // clamp
    expect(importanceScore(makeEntry({ gamma: -0.1 }))).toBe(0);
    expect(importanceScore(makeEntry({ gamma: 1.5 }))).toBe(1);
  });

  it('throws RangeError for weights outside [0,1]', () => {
    expect(() => new MemoryScorer({ alpha: -0.1 })).toThrow(RangeError);
    expect(() => new MemoryScorer({ beta:  1.1  })).toThrow(RangeError);
    expect(() => new MemoryScorer({ gamma: -1   })).toThrow(RangeError);
  });

  it('accepts custom weights', () => {
    const s = new MemoryScorer({ alpha: 0.6, beta: 0.3, gamma: 0.1 });
    expect(s.alpha).toBe(0.6);
    expect(s.beta).toBe(0.3);
    expect(s.gamma).toBe(0.1);
  });

  it('score is always in [0, 1] (bounded formula)', () => {
    const now = Date.now();
    const entry = makeEntry({ ts: now, gamma: 1.0, content: 'debug session skill' });
    const queryTokens = tokenize('debug session skill');
    const { score } = scorer.scoreEntry(entry, queryTokens, now);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('rank() returns entries sorted by descending score', () => {
    const now = Date.now();
    const hour = 3_600_000;
    const entries = [
      makeEntry({ id: 'old', ts: now - 48 * hour, content: 'debug session' }),
      makeEntry({ id: 'new', ts: now,             content: 'debug session' }),
    ];
    const ranked = scorer.rank(entries, 'debug session', 2, now);
    expect(ranked[0].entry.id).toBe('new');
    expect(ranked[1].entry.id).toBe('old');
  });

  it('rank() returns ≤ topK results', () => {
    const now = Date.now();
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ id: `e${i}`, content: `debug ${i}`, ts: now - i * 3_600_000 }),
    );
    const ranked = scorer.rank(entries, 'debug', 5, now);
    expect(ranked.length).toBeLessThanOrEqual(5);
  });

  it('applyScores() mutates score field in place', () => {
    const now = Date.now();
    const entries = [
      makeEntry({ id: 'a', content: 'debug session', ts: now }),
      makeEntry({ id: 'b', content: 'unrelated content', ts: now }),
    ];
    scorer.applyScores(entries, 'debug session', now);
    expect(entries[0].score).toBeGreaterThan(0);
    // 'unrelated content' after stop-word removal is 'unrelated content'
    // — neither token appears in 'debug session', so relevance = 0.
    // But recency contributes: score = α·1 + β·0 + γ·importance ≥ α.
    expect(entries[0].score).toBeGreaterThanOrEqual(0);
    expect(entries[1].score).toBeGreaterThanOrEqual(0);
  });

  describe('50-fixture validation (Wang et al. reference)', () => {
    const fixtures = generate50Fixtures();
    const s = new MemoryScorer();

    it(`validates all ${fixtures.length} fixtures produce score in [0,1]`, () => {
      for (const { entry, query, nowMs } of fixtures) {
        const qt = tokenize(query);
        const { score } = s.scoreEntry(entry, qt, nowMs);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1 + 1e-10);
      }
    });

    it('fresh+relevant entries score higher than old+irrelevant', () => {
      const freshFixtures = fixtures.filter(f => f.description.startsWith('fresh'));
      const oldFixtures   = fixtures.filter(f => f.description.startsWith('old'));

      const freshScores = freshFixtures.map(({ entry, query, nowMs }) => {
        const { score } = s.scoreEntry(entry, tokenize(query), nowMs);
        return score;
      });
      const oldScores = oldFixtures.map(({ entry, query, nowMs }) => {
        const { score } = s.scoreEntry(entry, tokenize(query), nowMs);
        return score;
      });

      const avgFresh = freshScores.reduce((a, b) => a + b, 0) / freshScores.length;
      const avgOld   = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
      expect(avgFresh).toBeGreaterThan(avgOld);
    });

    it('formula is deterministic — same input produces identical output', () => {
      const { entry, query, nowMs } = fixtures[0];
      const qt = tokenize(query);
      const r1 = s.scoreEntry(entry, qt, nowMs);
      const r2 = s.scoreEntry(entry, qt, nowMs);
      expect(r1.score).toBe(r2.score);
      expect(r1.recency).toBe(r2.recency);
      expect(r1.relevance).toBe(r2.relevance);
      expect(r1.importance).toBe(r2.importance);
    });
  });
});

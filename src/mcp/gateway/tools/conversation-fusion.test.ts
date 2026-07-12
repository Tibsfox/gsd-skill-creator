/**
 * Unit coverage for fuseConversationHits (item 9b) — the pure fusion+rerank
 * helper that applies the shared hybrid scorer to conversation search.
 *
 * Runs in the blocking lane (no DB, no server). Verifies dedup-by-turn-id, the
 * single-candidate passthrough that mirrors MemoryService.query()'s
 * `merged.length > 1` gate, the scoreToDistance/distanceToScore polarity bridge,
 * and that a quoted-phrase gold with a worse raw score reranks above a distractor.
 */
import { describe, it, expect } from 'vitest';
import { fuseConversationHits, type ConversationHit } from './memory-tools.js';

const NOW = new Date('2026-07-08T00:00:00.000Z');

function hit(id: string, content: string, score: number): ConversationHit {
  return {
    turn: {
      id,
      session_id: 'sess-1',
      role: 'assistant',
      content,
      timestamp: new Date('2026-07-01T00:00:00.000Z'),
    },
    sessionId: 'sess-1',
    score,
  };
}

describe('fuseConversationHits', () => {
  it('dedups by turn id, keeping the stronger raw score', () => {
    const fused = fuseConversationHits('anything', [
      hit('t1', 'a turn about gateways', 0.4),
      hit('t1', 'a turn about gateways', 0.9),
    ], NOW);
    expect(fused).toHaveLength(1);
    expect(fused[0].turn.id).toBe('t1');
    // A single deduped candidate is returned untouched (no rerank on a set of 1).
    expect(fused[0].score).toBe(0.9);
  });

  it('leaves a single candidate score unchanged (mirrors the rerank gate)', () => {
    const fused = fuseConversationHits('gateway', [
      hit('t1', 'a semantic answer about gateways and vectors', 0.9127),
    ], NOW);
    expect(fused).toHaveLength(1);
    expect(fused[0].score).toBe(0.9127);
  });

  it('reranks a quoted-phrase gold above a higher-raw-score distractor', () => {
    // gold: low raw score (0.3) but content holds the exact quoted phrase.
    // distractor: high raw score (0.7) but content matches no query term.
    // Without the reranker the distractor wins; the 0.60 quoted-phrase boost
    // (content-only) pulls the gold to the top.
    const fused = fuseConversationHits("engine 'duckdb analytics choice'", [
      hit('gold', 'we locked in the duckdb analytics choice after trials', 0.3),
      hit('distract', 'an unrelated note about scheduling', 0.7),
    ], NOW);

    expect(fused.map(h => h.turn.id)).toContain('gold');
    expect(fused[0].turn.id).toBe('gold');
    // Polarity guard: a matched hit's fused score rises above its raw score.
    // If scoreToDistance/distanceToScore were inverted, matching would lower it.
    const gold = fused.find(h => h.turn.id === 'gold')!;
    expect(gold.score).toBeGreaterThan(0.3);
    const distract = fused.find(h => h.turn.id === 'distract')!;
    expect(gold.score).toBeGreaterThan(distract.score);
  });

  it('returns an empty array for no hits', () => {
    expect(fuseConversationHits('q', [], NOW)).toEqual([]);
  });
});

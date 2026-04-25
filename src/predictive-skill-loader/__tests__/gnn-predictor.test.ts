/**
 * Tests — GNN link-formation predictor.
 *
 * @module predictive-skill-loader/__tests__/gnn-predictor
 */

import { describe, expect, it } from 'vitest';
import { loadCollegeGraph, type InMemoryConcept } from '../college-graph.js';
import { buildLinkFormationModel, predictLinks } from '../gnn-predictor.js';

const SYNTH: InMemoryConcept[] = [
  { id: 'a', domain: 'd', relationships: [{ targetId: 'b', weight: 1 }, { targetId: 'c', weight: 0.5 }] },
  { id: 'b', domain: 'd', relationships: [{ targetId: 'd', weight: 1 }] },
  { id: 'c', domain: 'd', relationships: [{ targetId: 'd', weight: 0.5 }, { targetId: 'e', weight: 1 }] },
  { id: 'd', domain: 'd', relationships: [{ targetId: 'f', weight: 1 }] },
  { id: 'e', domain: 'd', relationships: [] },
  { id: 'f', domain: 'd', relationships: [] },
];

function buildModel(hops = 2, decay = 0.5) {
  const graph = loadCollegeGraph({ inMemoryConcepts: SYNTH });
  return { graph, model: buildLinkFormationModel(graph, { hops, decay }) };
}

describe('predictLinks', () => {
  it('produces ranked predictions for a synthetic graph', () => {
    const { model } = buildModel(2, 0.5);
    const predictions = predictLinks(model, 'a', {}, 5);
    expect(predictions.length).toBeGreaterThan(0);
    // Direct neighbors of 'a' (b, c) should appear in the result.
    const ids = predictions.map((p) => p.skillId);
    expect(ids).toContain('b');
    // Predictions are sorted desc by score.
    for (let i = 1; i < predictions.length; i++) {
      const prev = predictions[i - 1]!;
      const curr = predictions[i]!;
      expect(prev.score).toBeGreaterThanOrEqual(curr.score);
    }
  });

  it('drops the seed and recent skills from results', () => {
    const { model } = buildModel(2, 0.5);
    const predictions = predictLinks(
      model,
      'a',
      { recentSkills: ['b'] },
      10,
    );
    const ids = predictions.map((p) => p.skillId);
    expect(ids).not.toContain('a');
    expect(ids).not.toContain('b');
  });

  it('attaches hopDepth corresponding to BFS distance', () => {
    const { model } = buildModel(3, 0.5);
    const predictions = predictLinks(model, 'a', {}, 10);
    const b = predictions.find((p) => p.skillId === 'b');
    const d = predictions.find((p) => p.skillId === 'd');
    const f = predictions.find((p) => p.skillId === 'f');
    expect(b?.hopDepth).toBe(1);
    expect(d?.hopDepth).toBe(2);
    expect(f?.hopDepth).toBe(3);
  });

  it('returns top-K only when K < candidates', () => {
    const { model } = buildModel(3, 0.5);
    const predictions = predictLinks(model, 'a', {}, 2);
    expect(predictions.length).toBeLessThanOrEqual(2);
  });

  it('returns "gnn" via channel for every prediction', () => {
    const { model } = buildModel(2, 0.5);
    const predictions = predictLinks(model, 'a', {}, 5);
    for (const p of predictions) {
      expect(p.via).toBe('gnn');
    }
  });

  it('clamps scores into [0, 1]', () => {
    const { model } = buildModel(5, 0.9);
    const predictions = predictLinks(model, 'a', {}, 10);
    for (const p of predictions) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(1);
    }
  });

  it('returns [] when seed is missing from the graph', () => {
    const { model } = buildModel(2, 0.5);
    const predictions = predictLinks(model, '__missing__', {}, 5);
    // Missing seed cannot inject signal -> no positive scores anywhere.
    expect(predictions).toEqual([]);
  });

  it('honours recencyDecay weighting (recent skill nudges its neighbors)', () => {
    const { model } = buildModel(2, 0.5);
    const noRecent = predictLinks(model, 'a', {}, 10);
    const withRecent = predictLinks(
      model,
      'a',
      { recentSkills: ['c'] },
      10,
      0.7,
    );
    // 'c' was recent so 'd' and 'e' should have higher signal in the
    // withRecent run than they did in noRecent. (We compare 'e' since it is
    // not directly reachable from 'a' as a single hop -> only c -> e.)
    const eNo = noRecent.find((p) => p.skillId === 'e')?.score ?? 0;
    const eWith = withRecent.find((p) => p.skillId === 'e')?.score ?? 0;
    expect(eWith).toBeGreaterThanOrEqual(eNo);
  });

  it('SkillPrediction round-trips through JSON', () => {
    const { model } = buildModel(2, 0.5);
    const predictions = predictLinks(model, 'a', {}, 3);
    const json = JSON.stringify(predictions);
    const parsed = JSON.parse(json) as typeof predictions;
    expect(parsed.length).toBe(predictions.length);
    for (let i = 0; i < parsed.length; i++) {
      expect(parsed[i]?.skillId).toBe(predictions[i]?.skillId);
      expect(parsed[i]?.score).toBeCloseTo(predictions[i]?.score ?? 0, 8);
      expect(parsed[i]?.hopDepth).toBe(predictions[i]?.hopDepth);
      expect(parsed[i]?.via).toBe(predictions[i]?.via);
    }
  });
});

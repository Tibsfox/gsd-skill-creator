/**
 * Tests — integration: load graph + predict + prewarm.
 *
 * @module predictive-skill-loader/__tests__/integration
 */

import { describe, expect, it } from 'vitest';
import {
  NoopPreWarmHook,
  buildLinkFormationModel,
  loadCollegeGraph,
  predictNextSkills,
  predictNextSkillsWithMeta,
  prewarmCache,
  type InMemoryConcept,
} from '../index.js';

const SYNTH: InMemoryConcept[] = [
  { id: 'a', domain: 'd', relationships: [{ targetId: 'b', weight: 1 }, { targetId: 'c', weight: 0.5 }] },
  { id: 'b', domain: 'd', relationships: [{ targetId: 'd', weight: 1 }] },
  { id: 'c', domain: 'd', relationships: [{ targetId: 'd', weight: 0.5 }, { targetId: 'e', weight: 1 }] },
  { id: 'd', domain: 'd', relationships: [{ targetId: 'f', weight: 1 }] },
  { id: 'e', domain: 'd', relationships: [] },
  { id: 'f', domain: 'd', relationships: [] },
];

describe('integration: load -> predict -> prewarm', () => {
  it('default-off contract: returns empty predictions and disabled marker', async () => {
    const out = await predictNextSkillsWithMeta(
      'a',
      {},
      { settingsPath: '/__nonexistent__/settings.json' },
    );
    expect(out.predictions).toEqual([]);
    expect(out.disabled).toBe(true);
  });

  it('flag-off prewarm is a strict no-op (zero hook calls)', async () => {
    const hook = new NoopPreWarmHook(true);
    const out = await predictNextSkillsWithMeta(
      'a',
      {},
      { settingsPath: '/__nonexistent__/settings.json' },
    );
    const n = await prewarmCache(out.predictions, hook);
    expect(n).toBe(0);
    expect(hook.callLog.length).toBe(0);
  });

  it('flag-on path: load graph + predict + prewarm yields a hot cache', async () => {
    const graph = loadCollegeGraph({ inMemoryConcepts: SYNTH });
    const model = buildLinkFormationModel(graph, { hops: 3, decay: 0.5 });
    const hook = new NoopPreWarmHook(true);

    const result = await predictNextSkillsWithMeta(
      'a',
      { recentSkills: ['c'] },
      { config: { enabled: true, topK: 5, hops: 3, decay: 0.5 }, model },
    );
    expect(result.disabled).toBe(false);
    expect(result.predictions.length).toBeGreaterThan(0);

    const n = await prewarmCache(result.predictions, hook);
    expect(n).toBeGreaterThan(0);
    expect(hook.callLog.length).toBe(1);
    // Subsequent skill load: simulate the cache lookup. We model the hot
    // cache by checking the preload call manifest contains the skill we are
    // about to ask for.
    const askFor = result.predictions[0]?.skillId;
    expect(askFor).toBeDefined();
    expect(hook.callLog[0]).toContain(askFor);
  });

  it('topK from context overrides the resolved config', async () => {
    const graph = loadCollegeGraph({ inMemoryConcepts: SYNTH });
    const model = buildLinkFormationModel(graph, { hops: 2, decay: 0.5 });
    const result = await predictNextSkills(
      'a',
      { topK: 1 },
      { config: { enabled: true, topK: 5, hops: 2, decay: 0.5 }, model },
    );
    expect(result.length).toBe(1);
  });

  it('graph -> model -> predictNextSkills shows multi-hop coverage', async () => {
    const graph = loadCollegeGraph({ inMemoryConcepts: SYNTH });
    const model = buildLinkFormationModel(graph, { hops: 3, decay: 0.5 });
    const preds = await predictNextSkills(
      'a',
      {},
      { config: { enabled: true, topK: 10, hops: 3, decay: 0.5 }, model },
    );
    const ids = preds.map((p) => p.skillId);
    // Direct neighbors b, c
    expect(ids).toContain('b');
    expect(ids).toContain('c');
    // 2-hop neighbors d, e
    expect(ids.some((id) => id === 'd' || id === 'e')).toBe(true);
  });

  it('null hook always yields zero preloads regardless of predictions', async () => {
    const graph = loadCollegeGraph({ inMemoryConcepts: SYNTH });
    const model = buildLinkFormationModel(graph, { hops: 2, decay: 0.5 });
    const preds = await predictNextSkills(
      'a',
      {},
      { config: { enabled: true, topK: 5, hops: 2, decay: 0.5 }, model },
    );
    const n = await prewarmCache(preds, null);
    expect(n).toBe(0);
  });
});

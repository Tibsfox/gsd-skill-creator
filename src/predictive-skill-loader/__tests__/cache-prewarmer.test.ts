/**
 * Tests — cache-prewarmer.
 *
 * @module predictive-skill-loader/__tests__/cache-prewarmer
 */

import { describe, expect, it } from 'vitest';
import {
  NoopPreWarmHook,
  prewarmCacheVia,
} from '../cache-prewarmer.js';
import type { SkillPrediction } from '../types.js';

const MOCK_PREDS: SkillPrediction[] = [
  { skillId: 'b', score: 0.9, hopDepth: 1, via: 'gnn' },
  { skillId: 'c', score: 0.7, hopDepth: 1, via: 'gnn' },
  { skillId: 'd', score: 0.4, hopDepth: 2, via: 'gnn' },
];

describe('prewarmCacheVia', () => {
  it('issues a single batched preload call with all eligible ids', () => {
    const hook = new NoopPreWarmHook(true);
    const n = prewarmCacheVia(hook, MOCK_PREDS);
    expect(n).toBe(3);
    expect(hook.callLog.length).toBe(1);
    expect(hook.callLog[0]).toEqual(['b', 'c', 'd']);
  });

  it('is a no-op when the hook reports disabled', () => {
    const hook = new NoopPreWarmHook(false);
    const n = prewarmCacheVia(hook, MOCK_PREDS);
    expect(n).toBe(0);
    expect(hook.callLog.length).toBe(0);
  });

  it('is a no-op for an empty predictions array', () => {
    const hook = new NoopPreWarmHook(true);
    const n = prewarmCacheVia(hook, []);
    expect(n).toBe(0);
    expect(hook.callLog.length).toBe(0);
  });

  it('honours minScore threshold', () => {
    const hook = new NoopPreWarmHook(true);
    const n = prewarmCacheVia(hook, MOCK_PREDS, { minScore: 0.5 });
    expect(n).toBe(2);
    expect(hook.callLog[0]).toEqual(['b', 'c']);
  });

  it('honours maxPreloads cap', () => {
    const hook = new NoopPreWarmHook(true);
    const n = prewarmCacheVia(hook, MOCK_PREDS, { maxPreloads: 2 });
    expect(n).toBe(2);
    expect(hook.callLog[0]).toEqual(['b', 'c']);
  });

  it('skips predictions with via=disabled', () => {
    const hook = new NoopPreWarmHook(true);
    const preds: SkillPrediction[] = [
      ...MOCK_PREDS,
      { skillId: 'x', score: 1, hopDepth: 1, via: 'disabled' },
    ];
    const n = prewarmCacheVia(hook, preds);
    expect(n).toBe(3);
    expect(hook.callLog[0]).not.toContain('x');
  });
});

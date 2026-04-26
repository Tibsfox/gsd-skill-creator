/**
 * JP-034 — DiP-SD prefix-hit integration test.
 *
 * Asserts that the draft-verify-router's preloader hook actually warms the
 * cache for a draft prefix. Specifically: when a prompt is pre-loaded into a
 * Preloader before routing, and the DraftVerifyRouter is wired with that
 * Preloader, the router's preload() call populates the warm cache so that a
 * subsequent `get()` on the same key is a cache hit (not a cold miss).
 *
 * Anchor: arXiv:2604.20919 (DiP-SD) + JP-007 draft-verify-router
 * (commit 68422ed4a).
 *
 * @module cache/__tests__/dip-sd-prefix-hit.test
 */

import { describe, it, expect } from 'vitest';
import { Preloader, type SkillLoader } from '../preload.js';
import { DraftVerifyRouter, type ModelTier } from '../../orchestration/draft-verify-router.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Synchronous-ish loader with a small artificial latency so preloads can
 *  actually land before we inspect the warm cache. */
function makeLoader(latencyMs = 5): SkillLoader {
  return (skillId: string) =>
    new Promise((resolve) =>
      setTimeout(() => resolve(`body:${skillId}`), latencyMs),
    );
}

/** Deterministic generate function — tier-independent (happy-path fixture). */
function deterministicGenerate(prompt: string, _tier: ModelTier): Promise<string> {
  return Promise.resolve(`out:${prompt}`);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('DiP-SD prefix-hit — DraftVerifyRouter preloader hook warms the cache', () => {
  it('preload hook fires: warm-cache entry present after route()', async () => {
    const preloader = new Preloader(makeLoader(5));

    const router = new DraftVerifyRouter({
      draftTier: 'haiku',
      verifyTier: 'sonnet',
      preloader,
      generate: deterministicGenerate,
    });

    // Route a prompt. The router calls preloader.preload([prompt]) internally
    // as the KVFlow warming step (Step 1 of the pipeline).
    const prompt = 'explain the DiP-SD routing strategy';
    const result = await router.route(prompt);

    // The routing itself should succeed and report the hook as present.
    expect(result.cacheHookPresent).toBe(true);

    // Wait for the preload to settle (fire-and-forget — need a small tick).
    await new Promise((r) => setTimeout(r, 30));

    // The preloader should have attempted to warm `prompt` as a key.
    expect(preloader.preloadAttempts).toBeGreaterThanOrEqual(1);

    // A subsequent get() on the same key should be a cache hit, not a cold miss.
    // (The warm cache should contain the body loaded for `prompt`.)
    const body = await preloader.get(prompt);
    expect(body).toBe(`body:${prompt}`);
    // After the get(), hits should be ≥ 1 (the in-flight or warm entry was used).
    expect(preloader.hits).toBeGreaterThanOrEqual(1);
    expect(preloader.misses).toBe(0);
  });

  it('cold miss before route, warm hit after route', async () => {
    const preloader = new Preloader(makeLoader(5));

    // Before any routing: warm cache is empty, so a get() must go cold.
    // (We use a different key to avoid side-effects from the first test.)
    const prompt = 'summarise the mesh-degree monitor';

    // Confirm the warm cache is empty for this key before routing.
    expect(preloader.warmSize()).toBe(0);

    const router = new DraftVerifyRouter({
      draftTier: 'haiku',
      verifyTier: 'sonnet',
      preloader,
      generate: deterministicGenerate,
    });

    await router.route(prompt);

    // Wait for the preload to settle.
    await new Promise((r) => setTimeout(r, 30));

    // Now the warm cache should contain the prompted key.
    expect(preloader.warmSize()).toBeGreaterThanOrEqual(1);

    // A get() is now a hit.
    const body = await preloader.get(prompt);
    expect(body).toBe(`body:${prompt}`);
    expect(preloader.hits).toBeGreaterThanOrEqual(1);
  });
});

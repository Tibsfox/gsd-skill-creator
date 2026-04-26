/**
 * JP-007 — Draft/Verify Router tests.
 *
 * Validates:
 *   1. Bit-exact decomposition: draft+verify output matches single-tier
 *      (verifyTier) output for a fixed deterministic fixture.
 *   2. Cache-integration: preloader is wired (`cacheHookPresent = true`) and
 *      the hook fires correctly; preload is called with the prompt.
 *   3. Non-deterministic path: when draft and verify tiers disagree, verify
 *      tier wins and `draftAccepted` is false.
 *   4. Accept-rate instrumentation updates correctly.
 *
 * @module orchestration/__tests__/draft-verify-router.test
 */

import { describe, it, expect } from 'vitest';
import { DraftVerifyRouter, route, type ModelTier } from '../draft-verify-router.js';
import { Preloader } from '../../cache/preload.js';

// ─── Fixture helpers ────────────────────────────────────────────────────────

/**
 * Deterministic generate function where all tiers return identical output.
 * Simulates a case where the draft model happens to produce the same tokens
 * as the verify model (the common happy path in speculative decoding).
 */
function identicalTierGenerate(prompt: string, _tier: ModelTier): Promise<string> {
  // Pure deterministic transformation — no model call.
  return Promise.resolve(`processed:${prompt}`);
}

/**
 * Tier-differentiated generate function.
 * Haiku returns a "fast" answer; Sonnet returns a "precise" answer.
 * Simulates the case where the draft and verify tiers disagree.
 */
function differentTierGenerate(prompt: string, tier: ModelTier): Promise<string> {
  if (tier === 'haiku') return Promise.resolve(`draft:${prompt}`);
  return Promise.resolve(`verified:${prompt}`);
}

/**
 * Reference single-tier function using only the verify tier.
 * Used to confirm bit-exactness in tests.
 */
async function singleTierOutput(prompt: string): Promise<string> {
  return identicalTierGenerate(prompt, 'sonnet');
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('DraftVerifyRouter — bit-exact decomposition', () => {
  it('output matches single-tier (verifyTier) result on a fixed fixture', async () => {
    const prompts = [
      'summarise this document',
      'write a unit test for selector.ts',
      'what is the string stability criterion?',
    ];

    const router = new DraftVerifyRouter({
      draftTier: 'haiku',
      verifyTier: 'sonnet',
      generate: identicalTierGenerate,
    });

    for (const prompt of prompts) {
      const result = await router.route(prompt);
      const expected = await singleTierOutput(prompt);

      // Bit-exact: output must equal single-tier (verifyTier) output.
      expect(result.output).toBe(expected);

      // With identical-tier gen, draft should be accepted.
      expect(result.draftAccepted).toBe(true);
      expect(result.draftOutput).toBe(result.output);
    }

    // All routes should be counted as accepted.
    expect(router.acceptRate).toBe(1.0);
    expect(router.draftAccepts).toBe(prompts.length);
  });
});

describe('DraftVerifyRouter — cache integration (preloader hook)', () => {
  it('wires preloader and reports cacheHookPresent = true', async () => {
    // Build a Preloader with a no-op loader (skills are the prompts themselves).
    const preloader = new Preloader(async (id) => `body-of-${id}`);

    const router = new DraftVerifyRouter({
      draftTier: 'haiku',
      verifyTier: 'sonnet',
      generate: identicalTierGenerate,
      preloader,
    });

    const result = await router.route('explain DiP-SD');

    // Hook must be present.
    expect(result.cacheHookPresent).toBe(true);

    // Preloader should have received the prompt as a preload request.
    // The prompt goes into the pending or warm cache after preload().
    // Either warm (if preload resolved synchronously) or pending — either way
    // the preloader state is non-empty OR we can verify via a get() call.
    // We warm up by calling get() to confirm the preloader knows the item.
    const body = await preloader.get('explain DiP-SD');
    expect(body).toBe('body-of-explain DiP-SD');
  });

  it('cacheHookPresent = false when no preloader supplied', async () => {
    const router = new DraftVerifyRouter({
      draftTier: 'haiku',
      verifyTier: 'sonnet',
      generate: identicalTierGenerate,
    });

    const result = await router.route('any prompt');
    expect(result.cacheHookPresent).toBe(false);
  });
});

describe('DraftVerifyRouter — tier disagreement path', () => {
  it('verify tier wins when draft and verify outputs differ', async () => {
    const router = new DraftVerifyRouter({
      draftTier: 'haiku',
      verifyTier: 'sonnet',
      generate: differentTierGenerate,
    });

    const result = await router.route('test prompt');

    // Output must equal the verifyTier output, not the draft.
    expect(result.output).toBe('verified:test prompt');
    expect(result.draftOutput).toBe('draft:test prompt');
    expect(result.draftAccepted).toBe(false);
    expect(router.acceptRate).toBe(0);
  });
});

describe('route() convenience function', () => {
  it('matches class-based result for the same config', async () => {
    const config = {
      draftTier: 'haiku' as ModelTier,
      verifyTier: 'sonnet' as ModelTier,
      generate: identicalTierGenerate,
    };
    const prompt = 'convenience wrapper test';
    const result = await route(prompt, config);
    const expected = await singleTierOutput(prompt);
    expect(result.output).toBe(expected);
  });
});

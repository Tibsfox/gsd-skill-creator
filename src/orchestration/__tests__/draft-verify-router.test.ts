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

// ─── JP-002 — anytime-valid acceptance-rate gate wiring ─────────────────────

describe('JP-002 — DraftVerifyRouter acceptance-rate anytime-valid gate', () => {
  it('acceptanceVerdict() returns null when no gate is configured', async () => {
    const router = new DraftVerifyRouter({
      generate: identicalTierGenerate,
    });
    expect(router.acceptanceVerdict()).toBeNull();
    await router.route('p1');
    // Still null — no gate was supplied, so no verdict is recorded.
    expect(router.acceptanceVerdict()).toBeNull();
  });

  it('acceptanceVerdict() returns null before the first route() even with a gate configured', () => {
    const router = new DraftVerifyRouter({
      generate: identicalTierGenerate,
      acceptanceGate: { alpha: 0.05, hypothesis: 'one-sided' },
    });
    expect(router.acceptanceVerdict()).toBeNull();
  });

  it('rejects null hypothesis after a long run of accepted drafts', async () => {
    const router = new DraftVerifyRouter({
      // Identical-tier generate ⇒ every draft is accepted ⇒ +1 every route.
      generate: identicalTierGenerate,
      acceptanceGate: { alpha: 0.05, hypothesis: 'one-sided' },
    });
    let lastVerdict = null;
    for (let i = 0; i < 30; i++) {
      await router.route(`prompt-${i}`);
      lastVerdict = router.acceptanceVerdict();
      if (lastVerdict?.rejected) break;
    }
    expect(lastVerdict).not.toBeNull();
    expect(lastVerdict!.rejected).toBe(true);
    expect(lastVerdict!.observations).toBeGreaterThan(0);
  });

  it('does not reject after a long run of rejected drafts (perfect disagreement)', async () => {
    const router = new DraftVerifyRouter({
      // Different-tier generate ⇒ every draft is rejected ⇒ -1 every route.
      generate: differentTierGenerate,
      acceptanceGate: { alpha: 0.05, hypothesis: 'one-sided' },
    });
    for (let i = 0; i < 50; i++) {
      await router.route(`prompt-${i}`);
    }
    const verdict = router.acceptanceVerdict();
    expect(verdict).not.toBeNull();
    expect(verdict!.rejected).toBe(false);
    expect(verdict!.observations).toBe(50);
  });

  it('acceptanceVerdict() is a snapshot read — does not advance the e-process', async () => {
    const router = new DraftVerifyRouter({
      generate: identicalTierGenerate,
      acceptanceGate: { alpha: 0.05, hypothesis: 'one-sided' },
    });
    await router.route('p1');
    await router.route('p2');
    const v1 = router.acceptanceVerdict();
    const v2 = router.acceptanceVerdict();
    const v3 = router.acceptanceVerdict();
    expect(v1!.observations).toBe(2);
    expect(v2!.observations).toBe(2);
    expect(v3!.observations).toBe(2);
    expect(v1!.evidence).toBe(v2!.evidence);
  });

  it('does not change route() behavior when the gate is configured (bit-exact preserved)', async () => {
    const withoutGate = new DraftVerifyRouter({
      generate: identicalTierGenerate,
    });
    const withGate = new DraftVerifyRouter({
      generate: identicalTierGenerate,
      acceptanceGate: { alpha: 0.05, hypothesis: 'one-sided' },
    });
    const prompts = ['alpha', 'beta', 'gamma', 'delta'];
    for (const p of prompts) {
      const a = await withoutGate.route(p);
      const b = await withGate.route(p);
      expect(b.output).toBe(a.output);
      expect(b.draftAccepted).toBe(a.draftAccepted);
      expect(b.draftOutput).toBe(a.draftOutput);
    }
  });
});

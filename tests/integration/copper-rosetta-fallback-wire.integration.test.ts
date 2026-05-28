/**
 * T1.3 Option C application-boundary wire — integration test (v1.49.832).
 *
 * v1.49.830 declared `ConceptFallbackProvider` in `src/predictive-skill-loader/
 * fallback.ts` and wired an optional `fallbackProvider` field into copper's
 * `ActivationContext`. v1.49.831 added `RosettaConceptFallback` in
 * `.college/integration/rosetta-concept-fallback.ts`, which structurally
 * satisfies the contract via cross-rootdir duck-typing. Neither rootdir can
 * import the other directly.
 *
 * This test is the application-boundary wire (mirrors v1.49.829's pattern for
 * the SkillActivationObserver wire): it lives in `tests/integration/` with
 * visibility into BOTH rootdirs, instantiates a real `RosettaConceptFallback`,
 * passes it as the `fallbackProvider` to a copper `PipelineActivationDispatch`,
 * activates a skill, and verifies the cross-rootdir flow:
 *
 *   src/ activate → predictNextSkillsWithMeta (default-off → max=0)
 *      → maxScore < lowConfidenceThreshold (0.30) → .college/
 *         RosettaConceptFallback.onLowConfidence → ConceptRegistry.search
 *         → cross-domain analogy filter → RosettaCore.translate → suggestions
 *
 * Closes T1.3 Option C arc — the largest open branch of T1.3 GAP-2.
 */

import { describe, expect, it, vi } from 'vitest';
// v1.49.846 auto-emit-from-substrate: copper/activation.ts now appends a JSONL
// event whenever a low-confidence prediction triggers. This integration test
// exercises that path with the real predictive-skill-loader (flag-off → empty
// predictions → low-confidence always fires). Mock the appender so we don't
// pollute the operator's calibration data at
// `.planning/patterns/predictive-low-confidence-events.jsonl`.
vi.mock('../../src/bounded-learning/predictive-low-confidence-events.js', () => ({
  appendPredictiveLowConfidenceEvent: vi.fn(async () => '/mock/path'),
}));
import { PipelineActivationDispatch } from '../../src/chipset/copper/activation.js';
import type { ActivationContext } from '../../src/chipset/copper/activation.js';
import type { MoveInstruction } from '../../src/chipset/copper/types.js';
import { RosettaConceptFallback } from '../../.college/integration/rosetta-concept-fallback.js';
import { ConceptRegistry } from '../../.college/rosetta-core/concept-registry.js';
import type { RosettaConcept } from '../../.college/rosetta-core/types.js';

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'maillard-reaction',
    name: 'Maillard Reaction',
    domain: 'culinary-arts',
    description: 'Browning between amino acids and reducing sugars',
    panels: new Map(),
    relationships: [],
    ...overrides,
  };
}

function move(overrides: Partial<MoveInstruction> = {}): MoveInstruction {
  return {
    type: 'move',
    target: 'skill',
    name: 'test-skill',
    mode: 'lite',
    ...overrides,
  };
}

/**
 * A thin RosettaCore-shaped object satisfying the Pick<RosettaCore,
 * 'translate'> handle that `RosettaConceptFallback` accepts. Records every
 * translate call so the test can assert the provider invoked it.
 */
function makeEngineSpy() {
  return {
    translate: vi.fn(async (conceptId: string) => ({
      id: `translation-${conceptId}`,
      primary: {
        panelId: 'natural' as const,
        explanation: `[rendered] ${conceptId}`,
      },
      concept: makeConcept({ id: conceptId, name: conceptId }),
      panels: { primary: 'natural' as const, rationale: 'mock' },
      dependenciesLoaded: [],
    })),
  };
}

describe('T1.3 Option C application-boundary wire — copper ↔ RosettaConceptFallback', () => {
  it('RosettaConceptFallback structurally satisfies ActivationContext.fallbackProvider', () => {
    const registry = new ConceptRegistry();
    const engine = makeEngineSpy();
    const fallback = new RosettaConceptFallback({ registry, engine });

    // Compile-time check: the .college/ provider is assignable to the
    // optional cross-rootdir `fallbackProvider` field on src/'s
    // ActivationContext. This is the duck-typed wire we're verifying.
    const ctx: ActivationContext = { fallbackProvider: fallback };
    expect(typeof ctx.fallbackProvider?.onLowConfidence).toBe('function');
  });

  it('routes a low-confidence activation through copper → RosettaConceptFallback → ConceptRegistry → RosettaCore', async () => {
    // Set up a registry with a cooking concept that has a cross-domain
    // analogy pointing into mathematics. When activation fires for a skill
    // whose name matches the cooking concept, the fallback should produce a
    // suggestion derived from the math concept.
    const mathConcept = makeConcept({
      id: 'phase-transition',
      name: 'phase-transition',
      domain: 'mathematics',
    });
    const cookingConcept = makeConcept({
      id: 'demo-skill',
      name: 'demo-skill',
      domain: 'culinary-arts',
      relationships: [
        {
          type: 'analogy',
          targetId: 'phase-transition',
          description: 'cross-domain analogy',
        },
      ],
    });
    const registry = new ConceptRegistry();
    registry.register(mathConcept);
    registry.register(cookingConcept);
    const engine = makeEngineSpy();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const ctx: ActivationContext = {
      resolveSkill: async () => ({
        path: '.claude/skills/demo-skill/SKILL.md',
        content: 'x'.repeat(40),
      }),
      fallbackProvider: fallback,
    };
    const dispatch = new PipelineActivationDispatch(ctx);

    const result = await dispatch.activate(
      move({ name: 'demo-skill', mode: 'lite' }),
    );

    expect(result.status).toBe('success');

    // The emitPredictions chain is fire-and-forget; drain microtasks +
    // give the async chain a moment to resolve.
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Default-off predictive-skill-loader → 0 predictions → max-score 0 →
    // 0 < default threshold 0.30 → fallback fires → search('demo-skill')
    // matches the cooking concept → cross-domain analogy filter yields the
    // math concept → engine.translate fires for the math concept.
    expect(engine.translate).toHaveBeenCalledTimes(1);
    expect(engine.translate.mock.calls[0][0]).toBe('phase-transition');

    // The translate call's TranslationContext.currentDomain should be the
    // suggestion's source domain (mathematics), not the contextBase default.
    const ctxArg = engine.translate.mock.calls[0][1];
    expect(ctxArg.currentDomain).toBe('mathematics');
  });

  it('does NOT fire fallback when neither hook nor provider is wired (zero-side-effect contract)', async () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept({ id: 'demo-skill', name: 'demo-skill' }));
    const engine = makeEngineSpy();
    // Build the fallback but DO NOT pass it to the context.
    const _unused = new RosettaConceptFallback({ registry, engine });

    const ctx: ActivationContext = {
      resolveSkill: async () => ({
        path: '.claude/skills/demo-skill/SKILL.md',
        content: 'x'.repeat(40),
      }),
    };
    const dispatch = new PipelineActivationDispatch(ctx);
    const result = await dispatch.activate(
      move({ name: 'demo-skill', mode: 'lite' }),
    );

    expect(result.status).toBe('success');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(engine.translate).not.toHaveBeenCalled();
  });

  it('activation succeeds even when the fallback chain has no usable analogies (fail-soft)', async () => {
    // Cookingconcept has NO analogy relationships → fallback returns null.
    const registry = new ConceptRegistry();
    registry.register(
      makeConcept({
        id: 'demo-skill',
        name: 'demo-skill',
        domain: 'culinary-arts',
        relationships: [],
      }),
    );
    const engine = makeEngineSpy();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const ctx: ActivationContext = {
      resolveSkill: async () => ({
        path: '.claude/skills/demo-skill/SKILL.md',
        content: 'x'.repeat(40),
      }),
      fallbackProvider: fallback,
    };
    const dispatch = new PipelineActivationDispatch(ctx);

    const result = await dispatch.activate(
      move({ name: 'demo-skill', mode: 'lite' }),
    );

    expect(result.status).toBe('success');
    await new Promise((resolve) => setTimeout(resolve, 10));

    // search matches the cooking concept but the cross-domain filter yields
    // no analogies → engine.translate never fires → fallback returns null →
    // dispatch swallows null silently.
    expect(engine.translate).not.toHaveBeenCalled();
  });
});

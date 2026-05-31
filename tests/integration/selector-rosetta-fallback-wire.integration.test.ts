/**
 * Selector ↔ RosettaConceptFallback application-boundary wire — integration test
 * (v1.49.929).
 *
 * Companion to `copper-rosetta-fallback-wire.integration.test.ts` (v1.49.832),
 * which proved the FIRST production caller of the cross-rootdir concept-fallback
 * wire (copper `PipelineActivationDispatch`) drives it end-to-end. The SECOND
 * production caller — the M5 orchestration `ActivationSelector`
 * (`src/orchestration/selector.ts:401`, v1.49.832) — had unit coverage against a
 * MOCK provider (`selector.test.ts`) but no application-boundary integration test
 * with a real provider. This test closes that symmetry gap (#10438 verify axis)
 * AND deepens the proof: where the copper test feeds a `vi.fn()` engine spy, this
 * test drives a REAL `RosettaCore` engine (real `ConceptRegistry` + `PanelRouter`
 * + `ExpressionRenderer` + panels) populated with REAL department concepts —
 * "run the path, don't read it" (the v1.49.919 lesson).
 *
 * Flow proven (positive case):
 *   src/ ActivationSelector.select → activated decision → _emitPredictions
 *     → predictNextSkillsWithMeta (default-off → max=0) → maxScore < 0.30
 *       → .college/ RosettaConceptFallback.onLowConfidence
 *         → ConceptRegistry.search('creation') → theo-creation-narratives (theology)
 *           → cross-domain analogy filter → astro-cosmology (astronomy ≠ theology)
 *             → real RosettaCore.translate (natural-fallback render path; both
 *                concepts have empty panel maps, exercising a path neither the
 *                copper spy nor the .college roundtrip test ever ran)
 *               → ConceptSuggestion { conceptId: 'astro-cosmology', via: 'rosetta-analogy' }
 *
 * Negative case (real-data fail-soft): a skill whose only registry match is a
 * concept with NO cross-domain `analogy` relationship (cosmology → only a
 * `cross-reference`) yields `null`, proving the real analogy filter rejects
 * non-analogy edges.
 *
 * Neither rootdir imports the other; composition happens HERE, the only
 * production location with visibility into both src/ and .college/ (the vitest
 * "integration" project). See docs/cross-rootdir-wire-discipline.md (#10435).
 */

import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';

// v1.49.846 auto-emit-from-substrate: selector._emitPredictions appends a JSONL
// low-confidence event on every low-confidence round. Mock the appender so this
// integration run does not pollute the operator's calibration data at
// `.planning/patterns/predictive-low-confidence-events.jsonl`. Mirrors the copper
// integration test and selector.test.ts.
vi.mock('../../src/bounded-learning/predictive-low-confidence-events.js', () => ({
  appendPredictiveLowConfidenceEvent: vi.fn(async () => '/mock/path'),
}));

import { ActivationSelector, type Candidate } from '../../src/orchestration/selector.js';
import { ActivationWriter } from '../../src/traces/activation-writer.js';
import type {
  ConceptFallbackProvider,
  ConceptSuggestion,
} from '../../src/predictive-skill-loader/index.js';

// .college/ real components — the cross-rootdir provider half.
import { RosettaConceptFallback } from '../../.college/integration/rosetta-concept-fallback.js';
import { ConceptRegistry } from '../../.college/rosetta-core/concept-registry.js';
import { RosettaCore } from '../../.college/rosetta-core/engine.js';
import { PanelRouter } from '../../.college/rosetta-core/panel-router.js';
import { ExpressionRenderer } from '../../.college/rosetta-core/expression-renderer.js';
import type { PanelId } from '../../.college/rosetta-core/types.js';
import type { PanelInterface } from '../../.college/panels/panel-interface.js';
import { PythonPanel } from '../../.college/panels/python-panel.js';
import { CppPanel } from '../../.college/panels/cpp-panel.js';
import { JavaPanel } from '../../.college/panels/java-panel.js';

// Real department concepts: a theology concept that declares a cross-domain
// `analogy` to an astronomy concept.
import { creationNarratives } from '../../.college/departments/theology/concepts/stories-traditions/creation-narratives.js';
import { cosmology } from '../../.college/departments/astronomy/concepts/cosmology/cosmology.js';

// ─── Temp-trace plumbing (keep M3 traces out of the real ledger) ─────────────

const cleanups: string[] = [];

function tempTraceFile(): string {
  const dir = join(tmpdir(), `selector-rosetta-wire-${randomUUID()}`);
  cleanups.push(dir);
  return join(dir, 'traces.jsonl');
}

afterAll(async () => {
  for (const d of cleanups.splice(0)) {
    await fs.rm(d, { recursive: true, force: true });
  }
});

// ─── Real RosettaCore engine + provider, shared across cases ─────────────────

let registry: ConceptRegistry;
let engine: RosettaCore;
let realFallback: RosettaConceptFallback;

beforeAll(() => {
  // Real registry populated with the two real cross-domain-linked concepts.
  registry = new ConceptRegistry();
  registry.register(creationNarratives); // theology; analogy → astro-cosmology
  registry.register(cosmology); // astronomy; only a cross-reference, no analogy

  // Real panel set + router (mirrors .college/tests/integration-roundtrip.test.ts).
  const pythonPanel = new PythonPanel();
  const cppPanel = new CppPanel();
  const javaPanel = new JavaPanel();

  const panelInstances = new Map<PanelId, PanelInterface>();
  panelInstances.set('python', pythonPanel);
  panelInstances.set('cpp', cppPanel);
  panelInstances.set('java', javaPanel);

  const router = new PanelRouter();
  router.registerPanel(pythonPanel);
  router.registerPanel(cppPanel);
  router.registerPanel(javaPanel);

  const renderer = new ExpressionRenderer();

  // Real engine — not a spy. translate() runs the natural-fallback render path
  // because both concepts have empty panel maps.
  engine = new RosettaCore({ registry, router, renderer, panelInstances });

  // Real cross-rootdir provider over the real registry + real engine.
  realFallback = new RosettaConceptFallback({ registry, engine });
}, 30_000);

/**
 * A recording tap over the real provider. It delegates to `realFallback` and
 * captures the real result so the test can observe it through the selector's
 * fire-and-forget boundary (the selector discards the provider's return value).
 * Only an observation point is added — the registry, engine, and fallback logic
 * are all real.
 */
function recordingFallback(): {
  provider: ConceptFallbackProvider;
  captured: Array<{ skill: string; maxScore: number; suggestions: ConceptSuggestion[] | null }>;
} {
  const captured: Array<{
    skill: string;
    maxScore: number;
    suggestions: ConceptSuggestion[] | null;
  }> = [];
  const provider: ConceptFallbackProvider = {
    async onLowConfidence(skill, maxScore) {
      const suggestions = await realFallback.onLowConfidence(skill, maxScore);
      captured.push({ skill, maxScore, suggestions });
      return suggestions;
    },
  };
  return { provider, captured };
}

/** Wait for the selector's fire-and-forget `_emitPredictions` chain to settle. */
function settle(): Promise<void> {
  // Real timeout (not setImmediate): predictNextSkillsWithMeta touches disk
  // settings; 50ms covers it on real disk (#10454).
  return new Promise((resolve) => setTimeout(resolve, 50));
}

describe('Selector ↔ RosettaConceptFallback application-boundary wire (v1.49.929)', () => {
  it('RosettaConceptFallback structurally satisfies SelectorOptions.fallbackProvider', () => {
    // Compile-time + structural check: the .college/ provider is assignable to
    // src/'s optional cross-rootdir field. This is the duck-typed wire.
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: realFallback,
    });
    expect(sel).toBeInstanceOf(ActivationSelector);
    expect(typeof realFallback.onLowConfidence).toBe('function');
  });

  it('routes a low-confidence activation through selector → real RosettaConceptFallback → real RosettaCore → cross-domain suggestion', async () => {
    const { provider, captured } = recordingFallback();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: provider,
    });

    // Candidate id is the string handed to onLowConfidence → registry.search.
    // 'creation' matches the theology concept (name "Creation Narratives").
    // Query overlap + importance keep the αβγ composite > 0 so the decision
    // activates (sensoria off → activated = composite > 0).
    const candidates: Candidate[] = [
      { id: 'creation', content: 'creation narratives and cosmic origins', importance: 0.9 },
    ];

    const decisions = await sel.select('creation narratives', candidates);
    await settle();

    // Selection itself is unaffected by the async fallback.
    expect(decisions.length).toBe(1);
    expect(decisions[0].id).toBe('creation');
    expect(decisions[0].activated).toBe(true);

    // The real wire fired exactly once with the activated skill at max-score 0.
    expect(captured.length).toBe(1);
    expect(captured[0].skill).toBe('creation');
    expect(captured[0].maxScore).toBe(0);

    // The real provider + real engine produced a real cross-domain analogy.
    const suggestions = captured[0].suggestions;
    expect(suggestions).not.toBeNull();
    const cosmo = suggestions!.find((s) => s.conceptId === 'astro-cosmology');
    expect(cosmo).toBeDefined();
    expect(cosmo!.domain).toBe('astronomy'); // cross-domain from theology ✓
    expect(cosmo!.via).toBe('rosetta-analogy');
    expect(cosmo!.rendered.length).toBeGreaterThan(0);
  });

  it('returns null when the matched concept has no cross-domain analogy (real-data fail-soft)', async () => {
    const { provider, captured } = recordingFallback();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: provider,
    });

    // 'dark energy' matches ONLY astro-cosmology (its description contains
    // "Dark energy"); cosmology's sole relationship is a cross-reference, not an
    // analogy → the cross-domain analogy filter yields nothing → null.
    const candidates: Candidate[] = [
      { id: 'dark energy', content: 'dark energy accelerating cosmic expansion', importance: 0.9 },
    ];

    const decisions = await sel.select('dark energy expansion', candidates);
    await settle();

    expect(decisions[0].activated).toBe(true);
    expect(captured.length).toBe(1);
    expect(captured[0].skill).toBe('dark energy');
    expect(captured[0].suggestions).toBeNull();
  });

  it('selection succeeds even if the fallback rejects (fire-and-forget contract)', async () => {
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: {
        async onLowConfidence() {
          throw new Error('fallback intentionally throws');
        },
      },
    });
    const decisions = await sel.select('creation narratives', [
      { id: 'creation', content: 'creation narratives and cosmic origins', importance: 0.9 },
    ]);
    await settle();
    expect(decisions.length).toBe(1);
    expect(decisions[0].activated).toBe(true);
  });

  it('the real engine renders an empty-panel concept via the natural-language fallback (no throw, non-empty content)', async () => {
    // Directly exercises the real translate() path the fallback depends on,
    // documenting that an empty-panel concept renders rather than throwing.
    const translation = await engine.translate('astro-cosmology', {
      userExpertise: 'intermediate',
      currentDomain: 'astronomy',
      recentPanels: [],
      taskType: 'explore',
    });
    expect(translation.concept.id).toBe('astro-cosmology');
    expect(translation.primary).toBeDefined();
    expect(translation.primary.content.length).toBeGreaterThan(50);
  });
});

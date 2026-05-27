/**
 * RosettaConceptFallback — concept-fallback provider backed by RosettaCore
 * (v1.49.831 / T1.3 Option C implementation).
 *
 * Structurally satisfies the `ConceptFallbackProvider` interface declared in
 * `src/predictive-skill-loader/fallback.ts` without importing across the
 * rootdir boundary. When a substrate consumer (copper activation dispatch or
 * orchestration selector) hits a low-confidence prediction round, it can
 * invoke this provider to ask RosettaCore for cross-domain analogies of the
 * skill that JUST activated.
 *
 * The provider is fail-soft: any internal error returns `null` rather than
 * throwing, because the substrate-consumer swallows errors anyway and a
 * crashing fallback would still surface as "no fallback applied" in logs.
 *
 * Cross-rootdir duck-typing — mirrors the v1.49.823 ObservationBridge ↔
 * SkillActivationObserver wire shape.
 *
 * @module integration/rosetta-concept-fallback
 */

import type { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { RosettaCore } from '../rosetta-core/engine.js';
import type { TranslationContext } from '../rosetta-core/panel-router.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

/**
 * Structural-only handle on the bits of `RosettaCore` and `ConceptRegistry`
 * this provider actually uses. Lets tests pass thin mocks without a cast
 * (subtyping accepts real instances at the integration boundary in v832).
 */
type RegistryHandle = Pick<ConceptRegistry, 'search' | 'get'>;
type EngineHandle = Pick<RosettaCore, 'translate'>;

// ─── Locally-declared duck-typed shapes ─────────────────────────────────────
//
// The shape MUST stay byte-equivalent to ConceptSuggestion in
// src/predictive-skill-loader/fallback.ts. Field changes there REQUIRE a
// mirrored update here (the cross-rootdir wire only catches signature
// mismatches at the call-site, not field renames inside the result type).

/**
 * A single fallback suggestion returned by `onLowConfidence`.
 * Mirror of `ConceptSuggestion` from `src/predictive-skill-loader/fallback.ts`.
 */
export interface ConceptSuggestion {
  conceptId: string;
  rendered: string;
  domain?: string;
  via: string;
}

// ─── Provider options ───────────────────────────────────────────────────────

export interface RosettaConceptFallbackOptions {
  /** Concept registry to search against. */
  registry: RegistryHandle;
  /** Rosetta Core engine for rendering suggestions. */
  engine: EngineHandle;
  /**
   * Partial translation context applied to every `RosettaCore.translate` call.
   * Caller-supplied fields override the built-in defaults (taskType=`explore`,
   * userExpertise=`intermediate`, recentPanels=[]). `currentDomain` is always
   * overwritten with the suggestion's source domain.
   */
  defaultContext?: Partial<TranslationContext>;
  /** Maximum number of suggestions to return. Default 5. */
  maxSuggestions?: number;
}

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * Concept-fallback provider backed by RosettaCore.
 *
 * Behavior on `onLowConfidence(currentSkill, maxScore)`:
 *   1. `registry.search(currentSkill)` finds concepts whose name or
 *      description matches the skill string (case-insensitive substring).
 *   2. For each match, `findCrossDomainAnalogies` collects `analogy` relations
 *      pointing at concepts in a DIFFERENT domain than the matched concept.
 *   3. For each cross-domain analogy, `RosettaCore.translate` renders the
 *      concept; the rendered expression's `explanation` (or `code`, or the
 *      concept's `description` as last resort) becomes the suggestion text.
 *   4. Returns up to `maxSuggestions` suggestions, or `null` when none apply.
 */
export class RosettaConceptFallback {
  private readonly registry: RegistryHandle;
  private readonly engine: EngineHandle;
  private readonly contextBase: TranslationContext;
  private readonly maxSuggestions: number;

  constructor(opts: RosettaConceptFallbackOptions) {
    this.registry = opts.registry;
    this.engine = opts.engine;
    this.contextBase = {
      userExpertise: 'intermediate',
      currentDomain: 'general',
      recentPanels: [],
      taskType: 'explore',
      ...opts.defaultContext,
    };
    this.maxSuggestions = opts.maxSuggestions ?? 5;
  }

  /**
   * Produce cross-domain analogies for a low-confidence skill activation.
   * Returns `null` when no suggestions can be produced (no matches, no
   * analogies, or all renders failed).
   */
  async onLowConfidence(
    currentSkill: string,
    _maxScore: number,
  ): Promise<ConceptSuggestion[] | null> {
    let matches: RosettaConcept[];
    try {
      matches = this.registry.search(currentSkill);
    } catch {
      return null;
    }
    if (matches.length === 0) return null;

    const suggestions: ConceptSuggestion[] = [];
    for (const match of matches) {
      if (suggestions.length >= this.maxSuggestions) break;
      const analogies = this.findCrossDomainAnalogies(match);
      for (const analogy of analogies) {
        if (suggestions.length >= this.maxSuggestions) break;
        const rendered = await this.renderConcept(analogy);
        if (rendered) suggestions.push(rendered);
      }
    }

    return suggestions.length === 0 ? null : suggestions;
  }

  /** Collect `analogy` relations whose target lives in a DIFFERENT domain. */
  private findCrossDomainAnalogies(concept: RosettaConcept): RosettaConcept[] {
    const out: RosettaConcept[] = [];
    for (const rel of concept.relationships) {
      if (rel.type !== 'analogy') continue;
      const target = this.registry.get(rel.targetId);
      if (target && target.domain !== concept.domain) {
        out.push(target);
      }
    }
    return out;
  }

  /** Render a concept via RosettaCore; null on any failure. */
  private async renderConcept(
    concept: RosettaConcept,
  ): Promise<ConceptSuggestion | null> {
    try {
      const translation = await this.engine.translate(concept.id, {
        ...this.contextBase,
        currentDomain: concept.domain,
      });
      const expr = translation.primary;
      const renderedText = expr.explanation ?? expr.code ?? concept.description;
      return {
        conceptId: concept.id,
        rendered: renderedText,
        domain: concept.domain,
        via: 'rosetta-analogy',
      };
    } catch {
      return null;
    }
  }
}

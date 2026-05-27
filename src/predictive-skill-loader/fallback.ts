/**
 * Predictive Skill Loader — concept-fallback contract (v1.49.830 / T1.3 Option C).
 *
 * Cross-rootdir interface that defines the low-confidence fallback hook. When a
 * prediction round returns a top-score below `lowConfidenceThreshold` (from
 * settings), substrate consumers (`src/chipset/copper/activation.ts` and
 * `src/orchestration/selector.ts`) invoke the operator-supplied
 * `ConceptFallbackProvider` to ask a richer engine (e.g. RosettaCore in
 * `.college/rosetta-core/`) for an analogous concept.
 *
 * The interface is declared in src/ but never imports .college/ — implementations
 * (such as the v1.49.831 `RosettaConceptFallback` in `.college/integration/`)
 * structurally satisfy it across the rootdir boundary. Mirrors the
 * `SkillActivationObserver` duck-typed wire shipped in v1.49.823.
 *
 * @module predictive-skill-loader/fallback
 */

/**
 * A single suggested fallback concept returned from a low-confidence query.
 *
 * Carries only primitive fields so the contract stays free of any .college/
 * type imports (preserves the cross-rootdir boundary).
 */
export interface ConceptSuggestion {
  /** ID of the suggested fallback concept. */
  conceptId: string;
  /** Rendered expression text from the fallback engine. */
  rendered: string;
  /** Optional domain / department label. */
  domain?: string;
  /** Channel that produced the suggestion (e.g. 'rosetta-analogy', 'rosetta-search'). */
  via: string;
}

/**
 * Concept-fallback provider. Substrate consumers invoke `onLowConfidence` when
 * a prediction round yields top-score below `lowConfidenceThreshold`. The
 * provider returns a list of suggestions, or `null` when no fallback applies.
 *
 * Implementations should be fail-soft — callers swallow thrown errors so a
 * fallback failure cannot mask a successful activation.
 */
export interface ConceptFallbackProvider {
  onLowConfidence(
    currentSkill: string,
    maxScore: number,
  ): Promise<ConceptSuggestion[] | null>;
}

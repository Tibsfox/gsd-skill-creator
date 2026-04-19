/**
 * ME-1 Tractability Classifier — core classification function.
 *
 * Classifies a skill's tractability from its `output_structure` frontmatter
 * declaration (ME-5).  The classifier is a pure function: same input → same
 * output, no side effects, no I/O.
 *
 * Classification rules (Thread E §6 ME-1, Zhang 2026 §4.3):
 *   - `json-schema` or `markdown-template` → **tractable**
 *     Structured output has exploitable latent capability; prompt-content edits
 *     have statistically reliable effects ("can but doesn't" pattern).
 *   - `prose` → **coin-flip**
 *     Free-form natural language output; optimization is statistically
 *     indistinguishable from a coin flip (Zhang 2026 §4.2).
 *   - missing / unknown → **unknown**
 *     Conservative default; treated as coin-flip by downstream methods but
 *     surfaced distinctly in audit output so authors can act on it.
 *
 * Secondary signal (observationStats): optional historical activation variance.
 * Per LS-26, ME-1 MUST classify from frontmatter alone when observation data
 * is absent; the observation param only adjusts confidence, never the class.
 *
 * Acceptance gates implemented here:
 *   CF-ME1-04 — pure function (referential transparency).
 *   CF-ME1-05 — never throws; malformed/partial frontmatter → 'unknown'.
 *   LS-26     — 100% of skills classified from frontmatter alone.
 *
 * @module tractability/classifier
 */

import {
  classifyTractability as _classifyFromSchema,
  type TractabilityClass,
} from '../output-structure/schema.js';
import { resolveOutputStructure } from '../output-structure/frontmatter.js';
import type { OutputStructure } from '../output-structure/schema.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** One piece of evidence that contributed to the classification. */
export interface TractabilityEvidence {
  /** Short description of the signal (e.g. 'output_structure.kind=json-schema'). */
  signal: string;
  /**
   * Weight this signal carries in [0, 1].
   * Primary (frontmatter) signals are 1.0; secondary (observation) signals
   * lower the confidence but do not override the class.
   */
  weight: number;
  /** Direction of effect: 'tractable', 'coin-flip', or 'unknown'. */
  direction: TractabilityClass;
}

/** Full classification result returned by `classifySkill()`. */
export interface ClassificationResult {
  /** The determined tractability class. */
  tractabilityClass: TractabilityClass;
  /**
   * Confidence in the classification, in [0, 1].
   *   1.0 — clean `json-schema` or `markdown-template` declaration.
   *   0.8 — prose with no structural hints (cf. CF-ME1-02 headroom logic).
   *   0.5 — prose with conflicting observation data or no frontmatter at all.
   */
  confidence: number;
  /** Ordered evidence trail for debuggability. */
  evidence: TractabilityEvidence[];
  /**
   * Non-fatal warnings (e.g. malformed frontmatter, observation variance
   * exceeds expected range).  Empty when classification is clean.
   */
  warnings: string[];
}

/**
 * Optional observation-derived statistics for a skill.
 *
 * Per LS-26, passing these is optional and they only adjust `confidence` —
 * they cannot change the primary `tractabilityClass` derived from frontmatter.
 */
export interface ObservationStats {
  /**
   * Historical activation variance over recent invocations, in [0, 1].
   * High variance on a structured-output skill is anomalous and lowers
   * confidence (but does not change class).
   */
  activationVariance?: number;
  /**
   * Number of invocations the variance was computed over.
   * Fewer than 5 samples → observation signal is treated as absent.
   */
  sampleCount?: number;
}

// ---------------------------------------------------------------------------
// Keyword indicators of implicit structure (for prose skills)
// ---------------------------------------------------------------------------

/**
 * Prose-body keywords that suggest the skill *may* have implicit structure even
 * though no explicit `output_structure` is declared.  Their presence upgrades
 * the classification to `partial` in the evidence trail while keeping the
 * primary class `coin-flip` (per proposal: three classes are exhaustive and
 * coin-flip is the correct class for prose).  They DO lower confidence to 0.7
 * to signal "partial" alignment — the partial hint is surfaced in evidence.
 *
 * NOTE: "partial" is NOT a fourth TractabilityClass — the proposal spec defines
 * exactly three exhaustive classes.  The evidence direction for these signals is
 * deliberately 'coin-flip' because the class remains coin-flip; the "partial"
 * semantic lives in the evidence signal string and the reduced confidence.
 */
const IMPLICIT_STRUCTURE_KEYWORDS: readonly string[] = [
  'json',
  'yaml',
  'markdown',
  'template',
  'schema',
  'format:',
  'output:',
  'structured',
  '```json',
  '```yaml',
];

function hasImplicitStructureHints(content: string): boolean {
  const lower = content.toLowerCase();
  return IMPLICIT_STRUCTURE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Core classifier
// ---------------------------------------------------------------------------

/**
 * Classify a skill's tractability from its resolved frontmatter.
 *
 * @param outputStructure - The resolved `output_structure` value (from ME-5
 *   `resolveOutputStructure()`), or `undefined` / `null` when absent.
 * @param skillBody - Optional skill body text; used only to detect implicit
 *   structure hints in prose skills (adjusts confidence, not class).
 * @param observationStats - Optional historical activation statistics;
 *   adjusts confidence only (LS-26).
 * @returns Full ClassificationResult with class, confidence, evidence, and warnings.
 */
export function classifySkill(
  outputStructure: OutputStructure | undefined | null,
  skillBody?: string,
  observationStats?: ObservationStats,
): ClassificationResult {
  const evidence: TractabilityEvidence[] = [];
  const warnings: string[] = [];

  // --- Primary signal: output_structure.kind -------------------------------

  const primaryClass = _classifyFromSchema(outputStructure);
  let confidence: number;

  if (outputStructure == null) {
    evidence.push({
      signal: 'output_structure: absent (no frontmatter field)',
      weight: 1.0,
      direction: 'unknown',
    });
    confidence = 0.5;
  } else {
    switch (outputStructure.kind) {
      case 'json-schema':
        evidence.push({
          signal: `output_structure.kind=json-schema (schema: ${
            outputStructure.schema ? 'present' : 'empty'
          })`,
          weight: 1.0,
          direction: 'tractable',
        });
        confidence = 1.0;
        break;

      case 'markdown-template':
        evidence.push({
          signal: `output_structure.kind=markdown-template (template: ${
            outputStructure.template ? 'present' : 'empty'
          })`,
          weight: 1.0,
          direction: 'tractable',
        });
        confidence = 1.0;
        break;

      case 'prose': {
        // Check for implicit structure hints in the body
        const hasHints = skillBody ? hasImplicitStructureHints(skillBody) : false;
        if (hasHints) {
          evidence.push({
            signal:
              'output_structure.kind=prose with implicit-structure keywords in body ' +
              '(consider declaring output_structure: json-schema or markdown-template)',
            weight: 0.9,
            direction: 'coin-flip',
          });
          confidence = 0.7;
        } else {
          evidence.push({
            signal: 'output_structure.kind=prose (no structural hints detected)',
            weight: 1.0,
            direction: 'coin-flip',
          });
          confidence = 0.8;
        }
        break;
      }

      default: {
        // Exhaustiveness guard; TypeScript narrows to never for known union
        const _exhaustive: never = outputStructure;
        void _exhaustive;
        evidence.push({
          signal: `output_structure.kind unrecognised; treating as unknown`,
          weight: 1.0,
          direction: 'unknown',
        });
        confidence = 0.5;
        warnings.push(
          `Unrecognised output_structure.kind — please update to a recognised value.`,
        );
      }
    }
  }

  // --- Secondary signal: observation stats (LS-26 — confidence only) ------

  const minSamples = 5;
  if (observationStats && (observationStats.sampleCount ?? 0) >= minSamples) {
    const variance = observationStats.activationVariance ?? 0;

    if (variance > 0.5 && primaryClass === 'tractable') {
      // High variance on a structured skill is anomalous — lower confidence
      const penalty = Math.min(0.3, variance * 0.4);
      confidence = Math.max(0, confidence - penalty);
      evidence.push({
        signal: `observation: high activation variance (${variance.toFixed(3)}) over ${
          observationStats.sampleCount
        } samples — confidence reduced`,
        weight: 1 - variance,
        direction: 'tractable',
      });
      warnings.push(
        `High activation variance (${variance.toFixed(3)}) on a tractable skill; ` +
          `consider running ME-3 A/B harness to validate tractability claim.`,
      );
    } else if (observationStats.activationVariance !== undefined) {
      evidence.push({
        signal: `observation: activation variance ${variance.toFixed(3)} over ${
          observationStats.sampleCount
        } samples (within expected range)`,
        weight: 1.0,
        direction: primaryClass,
      });
    }
  } else if (
    observationStats &&
    (observationStats.sampleCount ?? 0) > 0 &&
    (observationStats.sampleCount ?? 0) < minSamples
  ) {
    warnings.push(
      `Observation stats provided but sample count (${observationStats.sampleCount}) < ${minSamples}; ` +
        `observation signal treated as absent.`,
    );
  }

  return {
    tractabilityClass: primaryClass,
    confidence,
    evidence,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Convenience wrapper: classify from raw frontmatter value
// ---------------------------------------------------------------------------

/**
 * Classify a skill directly from a raw YAML-parsed frontmatter `output_structure`
 * value (as returned by a frontmatter parser).
 *
 * Uses `resolveOutputStructure()` from ME-5 internally, so the resolution
 * logic (defaults, validation, shorthand) is applied before classification.
 *
 * @param rawOutputStructure - The raw value from frontmatter (any type).
 * @param skillBody          - Optional body text for implicit-hint detection.
 * @param observationStats   - Optional observation stats.
 */
export function classifySkillFromRaw(
  rawOutputStructure: unknown,
  skillBody?: string,
  observationStats?: ObservationStats,
): ClassificationResult {
  const resolved = resolveOutputStructure(rawOutputStructure);
  const result = classifySkill(
    resolved.source === 'default' ? null : resolved.structure,
    skillBody,
    observationStats,
  );
  // Propagate resolver warnings
  if (resolved.warnings.length > 0) {
    result.warnings.push(...resolved.warnings);
  }
  return result;
}

// Re-export TractabilityClass from schema for consumers that only import
// from tractability/.
export type { TractabilityClass };

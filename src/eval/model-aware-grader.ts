/**
 * ModelAwareGrader -- enriches grading prompts with chip capability profiles
 * and generates model-specific improvement hints.
 *
 * Enables the eval system to produce targeted improvement guidance per model:
 * - Small local models get context-length and tool-calling guidance
 * - Large local models get moderate-context guidance
 * - Cloud models get prompt-specificity guidance
 *
 * IMP-03 constants:
 *   LOCAL_SMALL_CONTEXT_THRESHOLD = 8192  -- below this, model is local-small
 *   CLOUD_CONTEXT_THRESHOLD = 100000      -- at or above this, model is cloud-tier
 */

import { z } from 'zod';
import type { ChipRegistry } from '../chips/chip-registry.js';
import { CapabilityClassifier, CapabilityClassSchema } from './capability-classifier.js';
import type { CapabilityClass } from './capability-classifier.js';
import { LimitationRegistry } from './limitation-registry.js';
import type { CalibrationStore } from './calibration-store.js';

// ============================================================================
// IMP-03: Threshold constants (model-aware-grader level)
// ============================================================================

/**
 * Maximum context length below which a model is classified as 'local-small'.
 *
 * IMP-03: Models with fewer than 8192 tokens of context are considered small
 * local models that may struggle with longer skill evaluation prompts. This
 * threshold corresponds to common small model limits (e.g., 4096 or 8192
 * token windows in 1B-7B parameter local models).
 */
export const LOCAL_SMALL_CONTEXT_THRESHOLD = 8192;

/**
 * Minimum context length at or above which a model is classified as 'cloud'.
 *
 * IMP-03: Models with 100k+ context are effectively cloud-tier in capability.
 * The gap between 8192 and 100000 is 'local-large' (e.g., 32k context Llama
 * models). Cloud models (Claude, GPT-4 Turbo, Gemini 1.5) exceed this.
 */
export const CLOUD_CONTEXT_THRESHOLD = 100000;

// ============================================================================
// ModelCapabilityProfile
// ============================================================================

/**
 * Capability profile for a specific chip/model, derived from ChipCapabilities.
 *
 * Used by ModelAwareGrader to tailor grading prompts and improvement hints
 * to the specific model's known strengths and limitations.
 */
export interface ModelCapabilityProfile {
  /** Chip/model name (matches ChipConfig.name) */
  model: string;
  /** Maximum context window length in tokens */
  maxContextLength: number;
  /** Whether this model supports tool/function calling */
  supportsTools: boolean;
  /** Whether this model supports streaming responses */
  supportsStreaming: boolean;
  /** Number of models available on this chip */
  modelCount: number;
  /** Capability tier derived from maxContextLength */
  tier: 'local-small' | 'local-large' | 'cloud';
}

// ============================================================================
// Tier derivation helper
// ============================================================================

/**
 * Derive capability tier from maxContextLength.
 *
 * - maxContextLength < LOCAL_SMALL_CONTEXT_THRESHOLD => 'local-small'
 * - LOCAL_SMALL_CONTEXT_THRESHOLD <= maxContextLength < CLOUD_CONTEXT_THRESHOLD => 'local-large'
 * - maxContextLength >= CLOUD_CONTEXT_THRESHOLD => 'cloud'
 */
function deriveTier(maxContextLength: number): 'local-small' | 'local-large' | 'cloud' {
  if (maxContextLength >= CLOUD_CONTEXT_THRESHOLD) {
    return 'cloud';
  }
  if (maxContextLength >= LOCAL_SMALL_CONTEXT_THRESHOLD) {
    return 'local-large';
  }
  return 'local-small';
}

// ============================================================================
// ModelAwareGrader
// ============================================================================

/**
 * Grader that incorporates model capability profiles into the evaluation process.
 *
 * Usage:
 * ```typescript
 * const grader = new ModelAwareGrader();
 * const profile = await grader.buildCapabilityProfile('anthropic', registry);
 * const prompt = grader.enrichGradingPrompt(basePrompt, profile);
 * const hints = grader.generateModelHints(failedTests, profile);
 * ```
 */
export class ModelAwareGrader {
  /**
   * Build a capability profile for a chip by querying the registry.
   *
   * Returns null if:
   * - The chip is not found in the registry
   * - The chip's capabilities() method throws
   *
   * @param chipName - Name of the chip to profile
   * @param registry - ChipRegistry to look up the chip
   * @returns ModelCapabilityProfile or null if unavailable
   */
  async buildCapabilityProfile(
    chipName: string,
    registry: ChipRegistry
  ): Promise<ModelCapabilityProfile | null> {
    const chip = registry.get(chipName);
    if (!chip) {
      return null;
    }

    try {
      const capabilities = await chip.capabilities();
      return {
        model: chipName,
        maxContextLength: capabilities.maxContextLength,
        supportsTools: capabilities.supportsTools,
        supportsStreaming: capabilities.supportsStreaming,
        modelCount: capabilities.models.length,
        tier: deriveTier(capabilities.maxContextLength),
      };
    } catch {
      // capabilities() threw -- return null (no profile available)
      return null;
    }
  }

  /**
   * Enrich a grading prompt with model capability context.
   *
   * If profile is null, returns the basePrompt unchanged (fallback for
   * legacy/unknown models -- no model-specific info available).
   *
   * @param basePrompt - The base grading prompt to enrich
   * @param profile - The model's capability profile, or null for generic grading
   * @returns Enriched prompt string with model context appended
   */
  enrichGradingPrompt(basePrompt: string, profile: ModelCapabilityProfile | null): string {
    if (profile === null) {
      return basePrompt;
    }

    const toolsStr = profile.supportsTools ? 'yes' : 'no';
    const enrichment =
      `Model under evaluation: ${profile.model} ` +
      `(tier: ${profile.tier}, context: ${profile.maxContextLength} tokens, tools: ${toolsStr}). ` +
      `Consider model capabilities when judging response quality.`;

    return `${basePrompt}\n${enrichment}`;
  }

  /**
   * Generate model-specific improvement hints based on capability tier.
   *
   * Combines tier-specific structural hints with generic hints extracted
   * from failed test explanations (deduplicated).
   *
   * @param failedTests - Array of failed test prompts and their explanations
   * @param profile - The model's capability profile, or null for generic hints only
   * @returns Array of improvement hint strings
   */
  generateModelHints(
    failedTests: Array<{ prompt: string; explanation: string }>,
    profile: ModelCapabilityProfile | null
  ): string[] {
    const hints: string[] = [];

    // Tier-specific hints
    if (profile !== null) {
      switch (profile.tier) {
        case 'local-small':
          hints.push(
            `Model has limited context (${profile.maxContextLength} tokens) -- consider shorter, more focused prompts`
          );
          if (!profile.supportsTools) {
            hints.push(
              `Model does not support tool calling -- avoid test scenarios requiring function calls`
            );
          }
          break;

        case 'local-large':
          hints.push(
            `Model has moderate context -- may struggle with very long multi-turn scenarios`
          );
          break;

        case 'cloud':
          hints.push(
            `Cloud-tier model has full capability -- improvement should focus on prompt specificity and skill description clarity`
          );
          break;
      }
    }

    // Generic hints from failed test explanations (deduplicated)
    const seenExplanations = new Set<string>();
    for (const test of failedTests) {
      if (!seenExplanations.has(test.explanation)) {
        seenExplanations.add(test.explanation);
        hints.push(test.explanation);
      }
    }

    return hints;
  }

  // ========================================================================
  // Extended grading methods (Phase 58 -- Grader Calibration)
  // ========================================================================

  /**
   * Build a full grading context for calibrated grading.
   * Returns GradingContext with model_context populated from chip capabilities,
   * classifier, limitation registry, and calibration store.
   *
   * @returns GradingContext with modelContext (or null if chip not found)
   */
  async buildGradingContext(
    chipName: string,
    basePrompt: string,
    registry: ChipRegistry,
    classifier: CapabilityClassifier,
    limitationRegistry: LimitationRegistry,
    calibrationStore: CalibrationStore,
  ): Promise<GradingContext> {
    const profile = await this.buildCapabilityProfile(chipName, registry);
    if (!profile) {
      return { basePrompt, modelContext: null };
    }

    const capabilityClass = classifier.classifyFromProfile(profile);
    const knownLimitations = limitationRegistry.getLimitations(capabilityClass);
    const calibrationAdjustments = calibrationStore.getAdjustment(capabilityClass);

    return {
      basePrompt,
      modelContext: {
        chipName,
        capabilityClass,
        knownLimitations,
        calibrationAdjustments,
      },
    };
  }

  /**
   * Enhanced prompt enrichment that includes known limitations and calibration.
   * If modelContext is null, returns basePrompt unchanged (backward compat).
   */
  enrichGradingPromptWithContext(context: GradingContext): string {
    if (!context.modelContext) return context.basePrompt;

    const mc = context.modelContext;
    const limStr = mc.knownLimitations.length > 0
      ? ` Known limitations: ${mc.knownLimitations.join(', ')}.`
      : '';
    const adjStr = mc.calibrationAdjustments.passRateAdjustment !== 0
      ? ` Pass rate adjustment: ${mc.calibrationAdjustments.passRateAdjustment > 0 ? '+' : ''}${mc.calibrationAdjustments.passRateAdjustment}.`
      : '';

    const enrichment =
      `Model: ${mc.chipName} (class: ${mc.capabilityClass}).${limStr}${adjStr} ` +
      `Consider model capabilities when judging response quality.`;

    return `${context.basePrompt}\n${enrichment}`;
  }

  /**
   * Generate calibrated hints with model_specific and applicable_to metadata.
   */
  generateCalibratedHints(
    failedTests: Array<{ prompt: string; explanation: string }>,
    context: GradingContext,
  ): CalibratedHint[] {
    const hints: CalibratedHint[] = [];
    const capClass = context.modelContext?.capabilityClass;

    if (capClass) {
      // Model-specific hints based on capability class
      switch (capClass) {
        case 'small':
          hints.push({
            text: 'Simplify output format to reduce JSON formatting failures',
            modelSpecific: true,
            applicableTo: ['small'],
          });
          hints.push({
            text: 'Use shorter, focused prompts to stay within context limits',
            modelSpecific: true,
            applicableTo: ['small', 'medium'],
          });
          break;
        case 'medium':
          hints.push({
            text: 'Avoid deeply nested JSON structures',
            modelSpecific: true,
            applicableTo: ['small', 'medium'],
          });
          break;
        case 'large':
          hints.push({
            text: 'Provide explicit instructions for subtle nuance requirements',
            modelSpecific: true,
            applicableTo: ['large'],
          });
          break;
        case 'cloud':
          // Cloud gets generic prompt-specificity hint
          hints.push({
            text: 'Improve prompt specificity and skill description clarity',
            modelSpecific: false,
            applicableTo: ['small', 'medium', 'large', 'cloud'],
          });
          break;
      }
    }

    // Generic hints from failed test explanations
    const seen = new Set<string>();
    for (const test of failedTests) {
      if (!seen.has(test.explanation)) {
        seen.add(test.explanation);
        hints.push({
          text: test.explanation,
          modelSpecific: false,
          applicableTo: ['small', 'medium', 'large', 'cloud'],
        });
      }
    }

    return hints;
  }

  /**
   * Assess whether a failure matches a known limitation.
   * Returns discount factor from calibration (0 = no discount, 1 = full discount).
   */
  assessLimitationMatch(
    failureDescription: string,
    context: GradingContext,
    limitationRegistry: LimitationRegistry,
  ): { limitationMatch: boolean; limitation?: string; discountFactor: number } {
    if (!context.modelContext) {
      return { limitationMatch: false, discountFactor: 0 };
    }

    const match = limitationRegistry.matchFailure(
      failureDescription,
      context.modelContext.capabilityClass,
    );

    if (!match.matched) {
      return { limitationMatch: false, discountFactor: 0 };
    }

    const weight = context.modelContext.calibrationAdjustments.knownLimitationWeight;
    return {
      limitationMatch: true,
      limitation: match.limitation,
      discountFactor: weight * match.confidence,
    };
  }
}

// ============================================================================
// Grading Context Schemas (Phase 58)
// ============================================================================

export const CalibrationAdjustmentSchema = z.object({
  passRateAdjustment: z.number().min(-0.25).max(0.25).default(0),
  knownLimitationWeight: z.number().min(0).max(1).default(0),
  lastUpdated: z.string().datetime(),
});

export type CalibrationAdjustment = z.infer<typeof CalibrationAdjustmentSchema>;

export const ModelContextSchema = z.object({
  chipName: z.string(),
  capabilityClass: CapabilityClassSchema,
  knownLimitations: z.array(z.string()),
  calibrationAdjustments: CalibrationAdjustmentSchema,
});

export type ModelContext = z.infer<typeof ModelContextSchema>;

export const GradingContextSchema = z.object({
  basePrompt: z.string(),
  modelContext: ModelContextSchema.nullable(),
});

export type GradingContext = z.infer<typeof GradingContextSchema>;

export const CalibratedHintSchema = z.object({
  text: z.string(),
  modelSpecific: z.boolean(),
  applicableTo: z.array(CapabilityClassSchema),
});

export type CalibratedHint = z.infer<typeof CalibratedHintSchema>;

/**
 * Multi-model optimizer for model-specific SKILL.md guidance.
 *
 * generateModelGuidance() and generateMultiModelReport() produce per-chip
 * recommendations based on tier (local-small/local-large/cloud) and status
 * (passing/marginal/failing) (MESH-06).
 *
 * IMP-06: All functions are pure -- no IO, no Date, no random, no side effects.
 * IMP-03: MARGINAL_PASS_RATE_THRESHOLD exported with rationale.
 */

import { z } from 'zod';
import { LOCAL_SMALL_CONTEXT_THRESHOLD, CLOUD_CONTEXT_THRESHOLD } from '../eval/model-aware-grader.js';
import { DEFAULT_PASS_RATE_THRESHOLD } from '../eval/types.js';

// ============================================================================
// IMP-03 Constants
// ============================================================================

/**
 * Pass rate below which a model is classified as 'failing'.
 * 0.50 -- below 50%, the model fails more than it passes.
 */
export const MARGINAL_PASS_RATE_THRESHOLD = 0.50;

// ============================================================================
// Schemas / Types
// ============================================================================

/** Model tier classification */
export const TierSchema = z.enum(['local-small', 'local-large', 'cloud']);
export type Tier = z.infer<typeof TierSchema>;

/** Model performance status */
export const StatusSchema = z.enum(['passing', 'failing', 'marginal']);
export type Status = z.infer<typeof StatusSchema>;

/** Per-chip guidance with tier-aware recommendations */
export const ModelGuidanceSchema = z.object({
  chipName: z.string(),
  tier: TierSchema,
  passRate: z.number(),
  status: StatusSchema,
  recommendations: z.array(z.string()),
});

/** TypeScript type for model guidance */
export type ModelGuidance = z.infer<typeof ModelGuidanceSchema>;

/** Multi-model report with per-chip guidance and summary */
export const MultiModelReportSchema = z.object({
  skillName: z.string(),
  guidances: z.array(ModelGuidanceSchema),
  summary: z.string(),
});

/** TypeScript type for multi-model reports */
export type MultiModelReport = z.infer<typeof MultiModelReportSchema>;

// ============================================================================
// Pure derivation functions
// ============================================================================

/** Derive tier from context length */
export function deriveTier(contextLength: number): Tier {
  if (contextLength >= CLOUD_CONTEXT_THRESHOLD) return 'cloud';
  if (contextLength >= LOCAL_SMALL_CONTEXT_THRESHOLD) return 'local-large';
  return 'local-small';
}

/** Derive status from pass rate */
export function deriveStatus(passRate: number): Status {
  if (passRate >= DEFAULT_PASS_RATE_THRESHOLD) return 'passing';
  if (passRate >= MARGINAL_PASS_RATE_THRESHOLD) return 'marginal';
  return 'failing';
}

/** Build tier+status-aware recommendations */
export function buildRecommendations(tier: Tier, status: Status): string[] {
  const key = `${tier}:${status}`;
  switch (key) {
    case 'local-small:failing':
      return [
        'Consider larger context model for this skill',
        'Simplify skill prompts for constrained context',
        'Break skill into smaller sub-skills',
      ];
    case 'local-small:marginal':
      return [
        'Fine-tune prompts for small context window',
        'Consider context compression techniques',
      ];
    case 'local-small:passing':
      return [
        'Skill is well-adapted for small models',
        'Consider optimizing for speed',
      ];
    case 'local-large:failing':
      return [
        'Review skill prompt complexity',
        'Check if skill requires capabilities beyond this model',
      ];
    case 'local-large:marginal':
      return [
        'Tune prompts for this model\'s strengths',
        'Consider adding few-shot examples',
      ];
    case 'local-large:passing':
      return [
        'Good candidate for local-first routing',
        'Monitor for regression',
      ];
    case 'cloud:failing':
      return [
        'Investigate skill test quality',
        'This should pass on cloud -- check eval setup',
      ];
    case 'cloud:marginal':
      return [
        'Review edge cases in skill tests',
        'Consider prompt refinement',
      ];
    case 'cloud:passing':
      return [
        'Skill performs well',
        'Consider if local model could handle this to reduce cost',
      ];
    default:
      return [];
  }
}

// ============================================================================
// generateModelGuidance
// ============================================================================

/**
 * Generates guidance for a single chip based on pass rate and context length.
 */
export function generateModelGuidance(
  chipName: string,
  passRate: number,
  contextLength: number,
): ModelGuidance {
  const tier = deriveTier(contextLength);
  const status = deriveStatus(passRate);
  const recommendations = buildRecommendations(tier, status);

  return {
    chipName,
    tier,
    passRate,
    status,
    recommendations,
  };
}

// ============================================================================
// generateMultiModelReport
// ============================================================================

/**
 * Generates a multi-model report with per-chip guidance and summary.
 */
export function generateMultiModelReport(
  skillName: string,
  chips: Array<{ chipName: string; passRate: number; contextLength: number }>,
): MultiModelReport {
  const guidances = chips.map((chip) =>
    generateModelGuidance(chip.chipName, chip.passRate, chip.contextLength),
  );

  const passing = guidances.filter((g) => g.status === 'passing').length;
  const marginal = guidances.filter((g) => g.status === 'marginal').length;
  const failing = guidances.filter((g) => g.status === 'failing').length;

  const summary = `${chips.length} models evaluated: ${passing} passing, ${marginal} marginal, ${failing} failing`;

  return {
    skillName,
    guidances,
    summary,
  };
}

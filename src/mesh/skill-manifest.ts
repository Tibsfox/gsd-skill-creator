/**
 * Skill manifest builder for mesh-aware skill packaging.
 *
 * Derives tested_models and mesh_hints from a MultiModelReport,
 * producing a SkillManifest suitable for distribution and routing.
 *
 * IMP-06: buildSkillManifest is pure except for Date.now() in createdAt.
 */

import { z } from 'zod';
import type { MultiModelReport } from './multi-model-optimizer.js';

// ============================================================================
// Schemas
// ============================================================================

/** Per-model test result for inclusion in manifest */
export const TestedModelSchema = z.object({
  chipName: z.string(),
  tier: z.enum(['local-small', 'local-large', 'cloud']),
  passRate: z.number(),
  status: z.enum(['passing', 'marginal', 'failing']),
});

/** TypeScript type for tested model entries */
export type TestedModel = z.infer<typeof TestedModelSchema>;

/** Mesh routing hints derived from multi-model evaluation */
export const MeshHintsSchema = z.object({
  preferredTier: z.enum(['local-small', 'local-large', 'cloud', 'any']),
  minimumPassRate: z.number().min(0).max(1),
  costSensitive: z.boolean().default(true),
});

/** TypeScript type for mesh hints */
export type MeshHints = z.infer<typeof MeshHintsSchema>;

/** Complete skill manifest with model test results and routing hints */
export const SkillManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  tested_models: z.array(TestedModelSchema),
  mesh_hints: MeshHintsSchema,
  createdAt: z.string(),
  packagedBy: z.string(),
});

/** TypeScript type for skill manifest */
export type SkillManifest = z.infer<typeof SkillManifestSchema>;

// ============================================================================
// buildSkillManifest
// ============================================================================

/**
 * Builds a SkillManifest from a MultiModelReport.
 *
 * - tested_models: mapped from report.guidances (chipName, tier, passRate, status)
 * - mesh_hints.preferredTier: tier of best-performing model (highest passRate), or 'any' if empty
 * - mesh_hints.minimumPassRate: lowest passing model's passRate, or 0.50 if none passing
 * - mesh_hints.costSensitive: true if any local model (local-small or local-large) passes
 * - createdAt: current ISO timestamp
 * - packagedBy: 'skill-creator'
 */
export function buildSkillManifest(
  name: string,
  version: string,
  description: string,
  report: MultiModelReport,
): SkillManifest {
  // Map guidances to tested_models (strip recommendations)
  const tested_models: TestedModel[] = report.guidances.map((g) => ({
    chipName: g.chipName,
    tier: g.tier,
    passRate: g.passRate,
    status: g.status,
  }));

  // Derive preferredTier: tier of highest passRate model
  let preferredTier: MeshHints['preferredTier'] = 'any';
  if (report.guidances.length > 0) {
    const best = report.guidances.reduce((a, b) =>
      b.passRate > a.passRate ? b : a,
    );
    preferredTier = best.tier;
  }

  // Derive minimumPassRate: lowest passing model's rate, or 0.50 default
  const passingModels = report.guidances.filter((g) => g.status === 'passing');
  let minimumPassRate = 0.50;
  if (passingModels.length > 0) {
    minimumPassRate = passingModels.reduce(
      (min, g) => (g.passRate < min ? g.passRate : min),
      passingModels[0].passRate,
    );
  }

  // Derive costSensitive: true if any local model passes
  const costSensitive = report.guidances.some(
    (g) =>
      (g.tier === 'local-small' || g.tier === 'local-large') &&
      g.status === 'passing',
  );

  return {
    name,
    version,
    description,
    tested_models,
    mesh_hints: {
      preferredTier,
      minimumPassRate,
      costSensitive,
    },
    createdAt: new Date().toISOString(),
    packagedBy: 'skill-creator',
  };
}

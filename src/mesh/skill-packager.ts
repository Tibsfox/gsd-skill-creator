/**
 * Skill packager that bundles manifest, variants, and benchmarks.
 *
 * Combines a SkillManifest (from buildSkillManifest) with per-chip
 * variant entries and optional benchmark results into a complete
 * SkillPackage for distribution.
 */

import { z } from 'zod';
import { SkillManifestSchema, buildSkillManifest } from './skill-manifest.js';
import type { SkillManifest, TestedModel } from './skill-manifest.js';
import type { MultiModelReport } from './multi-model-optimizer.js';

// ============================================================================
// Schemas
// ============================================================================

/** Per-chip variant with tier-specific description and recommendations */
export const VariantEntrySchema = z.object({
  chipName: z.string(),
  tier: z.enum(['local-small', 'local-large', 'cloud']),
  description: z.string(),
  recommendations: z.array(z.string()),
});

/** TypeScript type for variant entries */
export type VariantEntry = z.infer<typeof VariantEntrySchema>;

/** Benchmark result for a specific chip */
export const BenchmarkEntrySchema = z.object({
  chipName: z.string(),
  passRate: z.number(),
  testCount: z.number(),
  runAt: z.string(),
});

/** TypeScript type for benchmark entries */
export type BenchmarkEntry = z.infer<typeof BenchmarkEntrySchema>;

/** Complete skill package with manifest, variants, and benchmarks */
export const SkillPackageSchema = z.object({
  manifest: SkillManifestSchema,
  variants: z.array(VariantEntrySchema),
  benchmarks: z.array(BenchmarkEntrySchema),
});

/** TypeScript type for skill packages */
export type SkillPackage = z.infer<typeof SkillPackageSchema>;

// ============================================================================
// packageSkill
// ============================================================================

/**
 * Packages a skill with manifest, per-chip variants, and optional benchmarks.
 *
 * - manifest: built via buildSkillManifest from the report
 * - variants: one per report.guidances entry; description is recommendations joined by newline
 * - benchmarks: provided array or empty
 */
export function packageSkill(
  skillName: string,
  version: string,
  description: string,
  report: MultiModelReport,
  benchmarkResults?: BenchmarkEntry[],
): SkillPackage {
  const manifest = buildSkillManifest(skillName, version, description, report);

  const variants: VariantEntry[] = report.guidances.map((g) => ({
    chipName: g.chipName,
    tier: g.tier,
    description: g.recommendations.join('\n'),
    recommendations: g.recommendations,
  }));

  return {
    manifest,
    variants,
    benchmarks: benchmarkResults ?? [],
  };
}

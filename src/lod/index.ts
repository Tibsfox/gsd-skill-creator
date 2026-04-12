/**
 * Level of Detail (LOD) — Dynamic detail scaling.
 *
 * BIM-inspired content scaling for GSD workflows.
 * Controls WHAT kind of information is generated (depth),
 * while Magic controls what the user SEES (verbosity).
 *
 * @example
 * ```ts
 * import { lodService, LodLevel } from './lod';
 *
 * // Automatic resolution from context signals
 * const lod = lodService.resolve({ phase: 'plan', tokenBudget: 40_000 });
 * // → LodLevel.DETAILED (300)
 *
 * // Scale content parameters
 * const scaling = lodService.getScaling(lod);
 * // → { wordCountMultiplier: 0.5, maxPasses: 4, includeCode: false, ... }
 *
 * // Check if a section should be included
 * lodService.shouldInclude('implementation-code', lod);
 * // → false (code excluded at LOD 300)
 *
 * // Generate prompt suffix for agent dispatch
 * const suffix = lodService.toPromptSuffix(lod);
 * // → "## Level of Detail: LOD 300 (Detailed)\n..."
 * ```
 *
 * @module lod
 */

export { LodLevel, DEFAULT_LOD, LOD_SCALING, LOD_DESCRIPTORS, MAGIC_TO_LOD_DEFAULT } from './types.js';
export type { LodContext, LodScaling, LodDescriptor } from './types.js';
export { LodService, lodService } from './service.js';

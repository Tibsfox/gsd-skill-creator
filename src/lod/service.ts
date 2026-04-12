/**
 * LOD Service — resolves the appropriate Level of Detail for any context.
 *
 * The core decision engine: given signals about the current workflow state,
 * token budget, content type, and user preferences, determine what LOD
 * to generate at.
 *
 * Design principle: LOD is about what KIND of information to include,
 * not just how MUCH. LOD 100 isn't "less text" — it's "different text"
 * (boundaries vs specifications vs implementation vs verification).
 *
 * @module lod/service
 */

import {
  LodLevel,
  DEFAULT_LOD,
  LOD_SCALING,
  LOD_DESCRIPTORS,
  MAGIC_TO_LOD_DEFAULT,
} from './types.js';
import type { LodContext, LodScaling, LodDescriptor } from './types.js';

// ─── Phase → LOD Mapping ─────────────────────────────────────────────────────

/** Default LOD for each GSD workflow phase. */
const PHASE_LOD: Record<string, LodLevel> = {
  discuss: LodLevel.SCHEMATIC,
  plan: LodLevel.DETAILED,
  execute: LodLevel.FABRICATION,
  verify: LodLevel.AS_BUILT,
  ship: LodLevel.AS_BUILT,
};

/** Default LOD for each content type. */
const CONTENT_TYPE_LOD: Record<string, LodLevel> = {
  research: LodLevel.DETAILED,
  plan: LodLevel.DETAILED,
  code: LodLevel.FABRICATION,
  documentation: LodLevel.CONSTRUCTION,
  review: LodLevel.CONSTRUCTION,
  report: LodLevel.SCHEMATIC,
};

// ─── Token Budget Thresholds ─────────────────────────────────────────────────

/** Token budget thresholds for LOD selection. */
const BUDGET_THRESHOLDS: Array<[number, LodLevel]> = [
  [5_000, LodLevel.CONCEPT],
  [15_000, LodLevel.SCHEMATIC],
  [30_000, LodLevel.DETAILED],
  [50_000, LodLevel.CONSTRUCTION],
  [80_000, LodLevel.FABRICATION],
  [Infinity, LodLevel.AS_BUILT],
];

/** Effort level → LOD mapping. */
const EFFORT_LOD: Record<string, LodLevel> = {
  minimal: LodLevel.CONCEPT,
  standard: LodLevel.DETAILED,
  thorough: LodLevel.FABRICATION,
  exhaustive: LodLevel.AS_BUILT,
};

// ─── LOD Service ─────────────────────────────────────────────────────────────

export class LodService {
  private magicLevel: number | null = null;

  /**
   * Resolve the LOD for a given context.
   *
   * Priority (highest to lowest):
   *   1. Explicit override
   *   2. Magic level mapping
   *   3. Effort level
   *   4. GSD phase
   *   5. Content type
   *   6. Token budget
   *   7. Default (DETAILED)
   *
   * When multiple signals are present, the MINIMUM is used —
   * we never generate more detail than the most restrictive signal allows.
   * Exception: explicit override always wins.
   */
  resolve(context: LodContext): LodLevel {
    // 1. Explicit override always wins
    if (context.override !== undefined) {
      return context.override;
    }

    const candidates: LodLevel[] = [];

    // 2. Magic level
    if (this.magicLevel !== null) {
      const magicLod = MAGIC_TO_LOD_DEFAULT[this.magicLevel];
      if (magicLod !== undefined) candidates.push(magicLod);
    }

    // 3. Effort level
    if (context.effort) {
      const effortLod = EFFORT_LOD[context.effort];
      if (effortLod !== undefined) candidates.push(effortLod);
    }

    // 4. GSD phase
    if (context.phase) {
      const phaseLod = PHASE_LOD[context.phase];
      if (phaseLod !== undefined) candidates.push(phaseLod);
    }

    // 5. Content type
    if (context.contentType) {
      const contentLod = CONTENT_TYPE_LOD[context.contentType];
      if (contentLod !== undefined) candidates.push(contentLod);
    }

    // 6. Token budget
    if (context.tokenBudget !== undefined) {
      for (const [threshold, lod] of BUDGET_THRESHOLDS) {
        if (context.tokenBudget <= threshold) {
          candidates.push(lod);
          break;
        }
      }
    }

    // Take the minimum — most restrictive signal wins
    if (candidates.length > 0) {
      return Math.min(...candidates) as LodLevel;
    }

    // 7. Default
    return DEFAULT_LOD;
  }

  /** Get scaling parameters for a LOD level. */
  getScaling(level: LodLevel): LodScaling {
    return LOD_SCALING[level];
  }

  /** Get the human-readable descriptor for a LOD level. */
  getDescriptor(level: LodLevel): LodDescriptor {
    return LOD_DESCRIPTORS[level];
  }

  /** Set the current Magic level (from desktop/src/magic/). */
  setMagicLevel(level: number): void {
    this.magicLevel = level;
  }

  /**
   * Determine whether a content section should be included at the given LOD.
   *
   * @param sectionType — e.g. 'implementation-code', 'cross-references', 'bibliography'
   * @param level — current LOD level
   * @returns true if the section should be generated
   */
  shouldInclude(sectionType: string, level: LodLevel): boolean {
    const descriptor = LOD_DESCRIPTORS[level];
    return descriptor.includes.includes(sectionType);
  }

  /**
   * Scale a base word count target for the given LOD.
   *
   * @param baseWordCount — the "full detail" word count target
   * @param level — current LOD level
   * @returns scaled word count
   */
  scaleWordCount(baseWordCount: number, level: LodLevel): number {
    const scaling = LOD_SCALING[level];
    return Math.round(baseWordCount * scaling.wordCountMultiplier);
  }

  /**
   * Scale a token budget for agent dispatch at the given LOD.
   *
   * @param baseBudget — the full token budget
   * @param level — current LOD level
   * @returns scaled token budget
   */
  scaleTokenBudget(baseBudget: number, level: LodLevel): number {
    const scaling = LOD_SCALING[level];
    return Math.round(baseBudget * scaling.tokenBudgetMultiplier);
  }

  /**
   * Get the maximum refinement passes for the co-processor at this LOD.
   */
  getMaxPasses(level: LodLevel): number {
    return LOD_SCALING[level].maxPasses;
  }

  /**
   * Estimate LOD from a token budget alone.
   * Useful when budget is the only signal available.
   */
  estimateFromBudget(tokenBudget: number): LodLevel {
    for (const [threshold, lod] of BUDGET_THRESHOLDS) {
      if (tokenBudget <= threshold) return lod;
    }
    return LodLevel.AS_BUILT;
  }

  /**
   * Generate a prompt suffix that instructs an agent about the current LOD.
   *
   * Appended to agent prompts so they know what detail level to target.
   */
  toPromptSuffix(level: LodLevel): string {
    const d = LOD_DESCRIPTORS[level];
    const s = LOD_SCALING[level];
    const lines = [
      `\n## Level of Detail: LOD ${level} (${d.name})`,
      `Content strategy: ${d.contentStrategy}`,
      `Include: ${d.includes.join(', ')}`,
    ];
    if (d.excludes.length > 0) {
      lines.push(`Exclude: ${d.excludes.join(', ')}`);
    }
    lines.push(`Target depth: h${s.maxHeadingDepth} max, ~${s.targetSections} sections`);
    if (!s.includeCode) lines.push('Do NOT include code blocks.');
    if (!s.includeTables) lines.push('Do NOT include tables.');
    return lines.join('\n');
  }
}

/** Singleton instance. */
export const lodService = new LodService();

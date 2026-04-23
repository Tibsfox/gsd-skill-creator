/**
 * Experience Compression Spectrum — transition logic + spectrum analysis.
 *
 * Pure functions. No I/O, no globals.
 *
 * @module compression-spectrum/spectrum
 */

import type {
  CompressionLevel,
  CompressedItem,
  TransitionDecision,
  TransitionEvent,
  TransitionInputs,
  SpectrumReport,
} from './types.js';
import { SHEN_RATIO_RANGES, DEFAULT_THRESHOLDS, LEVEL_RANK } from './types.js';

/**
 * Decide whether an item should transition levels based on usage + stale signals.
 *
 * Promotion rules (lower-compression → higher-compression):
 *   episodic → procedural  when usageCount >= promoteToProceduralThreshold
 *   procedural → declarative when usageCount >= promoteToDeclarativeThreshold
 *
 * Demotion rules (higher-compression → lower-compression):
 *   declarative → procedural when staleDays >= demoteFromDeclarativeStaleDays
 *   procedural → episodic   when staleDays >= demoteFromProceduralStaleDays
 *
 * Demotion takes precedence over promotion when both conditions fire simultaneously
 * (rare: an item must be both stale AND heavily-used, which signals usage-decay
 * rather than usage-growth).
 */
export function analyzeTransition(inputs: TransitionInputs): TransitionDecision {
  const { item } = inputs;
  const currentRank = LEVEL_RANK[item.level];

  // Check demotion first (takes precedence)
  if (item.level === 'declarative' && item.staleDays >= inputs.demoteFromDeclarativeStaleDays) {
    return {
      shouldTransition: true,
      from: 'declarative',
      to: 'procedural',
      direction: 'demote',
      reason: `staleDays ${item.staleDays} >= ${inputs.demoteFromDeclarativeStaleDays}; demote declarative → procedural`,
      ratioEstimateAfter: estimateRatio('procedural'),
    };
  }
  if (item.level === 'procedural' && item.staleDays >= inputs.demoteFromProceduralStaleDays) {
    return {
      shouldTransition: true,
      from: 'procedural',
      to: 'episodic',
      direction: 'demote',
      reason: `staleDays ${item.staleDays} >= ${inputs.demoteFromProceduralStaleDays}; demote procedural → episodic`,
      ratioEstimateAfter: estimateRatio('episodic'),
    };
  }

  // Check promotion
  if (item.level === 'episodic' && item.usageCount >= inputs.promoteToProceduralThreshold) {
    return {
      shouldTransition: true,
      from: 'episodic',
      to: 'procedural',
      direction: 'promote',
      reason: `usageCount ${item.usageCount} >= ${inputs.promoteToProceduralThreshold}; promote episodic → procedural`,
      ratioEstimateAfter: estimateRatio('procedural'),
    };
  }
  if (item.level === 'procedural' && item.usageCount >= inputs.promoteToDeclarativeThreshold) {
    return {
      shouldTransition: true,
      from: 'procedural',
      to: 'declarative',
      direction: 'promote',
      reason: `usageCount ${item.usageCount} >= ${inputs.promoteToDeclarativeThreshold}; promote procedural → declarative`,
      ratioEstimateAfter: estimateRatio('declarative'),
    };
  }

  return {
    shouldTransition: false,
    from: item.level,
    to: null,
    direction: 'hold',
    reason: `no threshold crossed; usageCount=${item.usageCount}, staleDays=${item.staleDays}`,
    ratioEstimateAfter: item.ratio,
  };
}

/** Estimate the typical compression ratio for a level (Shen et al. midpoint). */
export function estimateRatio(level: CompressionLevel): number {
  const range = SHEN_RATIO_RANGES[level];
  return Math.sqrt(range.min * range.max); // geometric mean
}

/** Emit a TransitionEvent from a decision that should transition. */
export function buildTransitionEvent(
  decision: TransitionDecision,
  item: CompressedItem,
  timestamp: string = new Date().toISOString(),
): TransitionEvent {
  if (!decision.shouldTransition || decision.to == null) {
    throw new Error('buildTransitionEvent: decision.shouldTransition must be true');
  }
  return {
    type: 'compression-spectrum.transition',
    timestamp,
    itemId: item.id,
    from: decision.from,
    to: decision.to,
    rationale: decision.reason,
    ratioBefore: item.ratio,
    ratioAfter: decision.ratioEstimateAfter,
  };
}

/** Analyze a collection of items and produce a spectrum report. */
export function analyzeSpectrum(
  items: CompressedItem[],
  recentTransitions: TransitionEvent[] = [],
): SpectrumReport {
  const byLevel: Record<CompressionLevel, number> = { episodic: 0, procedural: 0, declarative: 0 };
  const ratioSums: Record<CompressionLevel, number> = { episodic: 0, procedural: 0, declarative: 0 };

  for (const item of items) {
    byLevel[item.level]++;
    ratioSums[item.level] += item.ratio;
  }

  const averageRatio: Record<CompressionLevel, number> = {
    episodic: byLevel.episodic > 0 ? ratioSums.episodic / byLevel.episodic : 0,
    procedural: byLevel.procedural > 0 ? ratioSums.procedural / byLevel.procedural : 0,
    declarative: byLevel.declarative > 0 ? ratioSums.declarative / byLevel.declarative : 0,
  };

  // Missing-diagonal health: how evenly distributed are items across levels?
  // Use normalized entropy: H(distribution) / log2(3).
  // Empty collection → 0 (no items, no diagonal).
  const total = items.length;
  let diagonalHealth = 0;
  if (total > 0) {
    const probs = [byLevel.episodic / total, byLevel.procedural / total, byLevel.declarative / total];
    const entropy = probs.reduce((acc, p) => acc + (p > 0 ? -p * Math.log2(p) : 0), 0);
    diagonalHealth = entropy / Math.log2(3);
  }

  return {
    totalItems: total,
    byLevel,
    averageRatio,
    diagonalHealth,
    recentTransitions,
  };
}

/** Expose the default thresholds as a plain object. */
export function getDefaultTransitionThresholds(): Omit<TransitionInputs, 'item'> {
  return { ...DEFAULT_THRESHOLDS };
}

/** Check whether a transition crosses a level boundary (non-trivial). */
export function isLevelPromotion(from: CompressionLevel, to: CompressionLevel): boolean {
  return LEVEL_RANK[to] > LEVEL_RANK[from];
}

/** Check whether a transition demotes (toward lower compression ratio). */
export function isLevelDemotion(from: CompressionLevel, to: CompressionLevel): boolean {
  return LEVEL_RANK[to] < LEVEL_RANK[from];
}

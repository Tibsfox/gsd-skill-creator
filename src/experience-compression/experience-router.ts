/**
 * Experience-level router — memory vs skill vs rule.
 *
 * Wires the theorem-attested classifyLevel + bridgeLevels primitives into the
 * correction / pattern intake so every captured signal is classified along the
 * episodic→procedural→declarative compression axis (Zhang et al.,
 * arXiv:2604.15877, §2) and routed to a target artifact tier:
 *
 *   episodic    → memory          (the Knowledge Spine / MemorySink) — a one-off
 *   procedural  → skill-candidate  — a recurring pattern
 *   declarative → college-rule     — a stable invariant
 *
 * DEFAULT-ADVISORY: `classifySignal` only annotates — it never writes. The
 * upward promotion of accumulated episodics (`consolidate`) is likewise pure
 * ADVICE, gated by the thermodynamic ROI gate `shouldInstall`
 * (src/skill-promotion). A human acts on the advice; nothing here mutates a
 * skill, agent, memory, or College rule.
 *
 * Pure: no I/O, no clock reads.
 *
 * @module experience-compression/experience-router
 */

import type { CompressionLevel, ExperienceContent } from './types.js';
import { classifyLevel } from './level-classifier.js';
import { bridgeLevels } from './cross-level-bridge.js';
import { shouldInstall } from '../skill-promotion/promotion-roi.js';
import type { SkillCandidate } from '../skill-promotion/types.js';

// ---------------------------------------------------------------------------
// Level → artifact-tier mapping
// ---------------------------------------------------------------------------

/** The artifact tier a classified signal is routed to. */
export type RouteTarget = 'memory' | 'skill-candidate' | 'college-rule';

const LEVEL_TO_TARGET: Record<CompressionLevel, RouteTarget> = {
  episodic: 'memory',
  procedural: 'skill-candidate',
  declarative: 'college-rule',
};

const LEVEL_ORDER: ReadonlyArray<CompressionLevel> = [
  'episodic',
  'procedural',
  'declarative',
];

const TARGET_BLURB: Record<CompressionLevel, string> = {
  episodic: 'one-off → episodic memory (Knowledge Spine)',
  procedural: 'recurring pattern → procedural skill candidate',
  declarative: 'stable invariant → declarative College rule',
};

// ---------------------------------------------------------------------------
// Captured-signal adapter
// ---------------------------------------------------------------------------

/**
 * A generic captured intake signal — a correction candidate, a mined pattern,
 * or any other learner observation reduced to a routable shape.
 */
export interface CapturedSignal {
  /** Stable identifier for this signal. */
  readonly id: string;
  /** The raw semantic payload (serialisable object or string). */
  readonly payload: unknown;
  /** Uncompressed byte size; derived from the payload when omitted. */
  readonly byteSize?: number;
  /**
   * How many times this signal (or an equivalent one) has been observed. Drives
   * the density → variability proxy when no explicit `variabilityScore` is
   * supplied: a one-off is highly variable (episodic); a recurring signal is
   * regular (procedural / declarative).
   */
  readonly occurrences?: number;
  /** Grouping key for consolidation (e.g. a file path). Defaults to `id`. */
  readonly groupKey?: string;
  /** Optional classifier hint tags (see ExperienceContent.tags). */
  readonly tags?: ReadonlyArray<string>;
  /** Optional explicit variability score in [0, 1]. */
  readonly variabilityScore?: number;
  /** Optional explicit abstraction depth (non-negative integer). */
  readonly abstractionDepth?: number;
}

function approxByteSize(payload: unknown): number {
  if (typeof payload === 'string') return Math.max(1, payload.length);
  try {
    return Math.max(1, JSON.stringify(payload)?.length ?? 1);
  } catch {
    return 1;
  }
}

/**
 * Map observed density to a variability proxy: a one-off is highly variable
 * (episodic lean), a handful is moderate (procedural lean), and a well-worn
 * signal is regular (declarative lean when paired with structure/abstraction).
 */
function densityToVariability(occurrences: number): number {
  if (occurrences <= 1) return 0.8;
  if (occurrences <= 4) return 0.4;
  return 0.1;
}

function toExperienceContent(signal: CapturedSignal, occurrences: number): ExperienceContent {
  return {
    id: signal.id,
    payload: signal.payload,
    byteSize: signal.byteSize ?? approxByteSize(signal.payload),
    variabilityScore: signal.variabilityScore ?? densityToVariability(occurrences),
    abstractionDepth: signal.abstractionDepth,
    tags: signal.tags,
  };
}

// ---------------------------------------------------------------------------
// classifySignal — single-signal routing
// ---------------------------------------------------------------------------

export interface RoutingDecision {
  /** The classified compression level. */
  readonly level: CompressionLevel;
  /** The artifact tier the signal is routed to. */
  readonly target: RouteTarget;
  /** Classifier confidence in [0, 1]. */
  readonly confidence: number;
  /** Human-readable routing rationale. */
  readonly rationale: string;
  /** Raw classifier signals (informational). */
  readonly signals: {
    readonly variability: number;
    readonly structuralRegularity: number;
    readonly abstractionDepth: number;
  };
}

/**
 * Classify a single captured signal and route it to its artifact tier.
 *
 * Advisory only — returns the decision; performs no writes.
 */
export function classifySignal(signal: CapturedSignal): RoutingDecision {
  const occurrences = Math.max(1, signal.occurrences ?? 1);
  const content = toExperienceContent(signal, occurrences);
  const classification = classifyLevel(content);
  const level = classification.level;
  return {
    level,
    target: LEVEL_TO_TARGET[level],
    confidence: classification.confidence,
    rationale: TARGET_BLURB[level],
    signals: classification.signals,
  };
}

// ---------------------------------------------------------------------------
// consolidate — density-gated upward promotion advice
// ---------------------------------------------------------------------------

export interface ConsolidationOptions {
  /**
   * Bits of work saved per future use of a promoted artifact. Feeds the ROI
   * gate's payoff side (payoffBits = occurrences × perUseSavingsBits).
   * Default 1.
   */
  readonly perUseSavingsBits?: number;
  /**
   * Install cost in bits (I_K) — the density a group must clear before the ROI
   * gate advises promotion. Promotion is advised iff
   * `occurrences × perUseSavingsBits > installCostBits`. Default 4.
   */
  readonly installCostBits?: number;
}

export interface ConsolidationAdvice {
  /** The group these accumulated signals share. */
  readonly groupKey: string;
  /** Total observed density across the group. */
  readonly occurrences: number;
  /** The tier the signals currently live in (episodic for one-off corrections). */
  readonly currentLevel: CompressionLevel;
  /** The tier promotion is advised to, or null when no promotion is advised. */
  readonly promoteTo: CompressionLevel | null;
  /** Whether the ROI gate + bridge admission both pass (advisory). */
  readonly shouldPromote: boolean;
  /** Signed ROI margin in bits (positive → install region). */
  readonly marginBits: number;
  /** Adjacent levels the bridge admitted (the "missing diagonal"). */
  readonly diagonalLevels: ReadonlyArray<CompressionLevel>;
  /** Human-readable rationale. */
  readonly rationale: string;
}

/**
 * Consolidate a group of accumulated signals that share a key and advise
 * whether their density warrants promoting them one tier up the compression
 * axis (the "missing diagonal" migration of Zhang et al. §4).
 *
 * Promotion is gated by BOTH:
 *   1. bridge admission — the content admits an adjacent-level framing; and
 *   2. the thermodynamic ROI gate `shouldInstall` — density clears install cost.
 *
 * Purely advisory: no writes, no mutation of any artifact.
 */
export function consolidateGroup(
  signals: ReadonlyArray<CapturedSignal>,
  options: ConsolidationOptions = {},
): ConsolidationAdvice {
  const perUseSavingsBits = options.perUseSavingsBits ?? 1;
  const installCostBits = options.installCostBits ?? 4;

  const occurrences = signals.reduce((sum, s) => sum + Math.max(1, s.occurrences ?? 1), 0);
  const rep = signals[0];
  const groupKey = rep?.groupKey ?? rep?.id ?? '(empty)';

  if (!rep) {
    return {
      groupKey,
      occurrences: 0,
      currentLevel: 'episodic',
      promoteTo: null,
      shouldPromote: false,
      marginBits: 0,
      diagonalLevels: [],
      rationale: 'empty group — nothing to consolidate',
    };
  }

  // Classify at single-occurrence density: what tier do these signals live in
  // today (episodic, for one-off corrections)?
  const currentContent = toExperienceContent(rep, 1);
  const currentLevel = classifyLevel(currentContent).level;

  // The upward target tier, if any.
  const idx = LEVEL_ORDER.indexOf(currentLevel);
  const upward = idx >= 0 && idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1]! : null;

  // Bridge admission — does the content admit the adjacent (upward) framing?
  const bridge = bridgeLevels(currentContent, true);
  const admitted = upward !== null && bridge.diagonalLevels.includes(upward);

  // ROI gate — has density accumulated enough to clear the install cost?
  const candidate: SkillCandidate = {
    id: groupKey,
    estimatedUses: occurrences,
    perUseSavingsBits,
    estimatedIK: installCostBits,
  };
  const marginBits = occurrences * perUseSavingsBits - installCostBits;
  const roiPass = shouldInstall(candidate);

  const shouldPromote = upward !== null && admitted && roiPass;
  const promoteTo = shouldPromote ? upward : null;

  const rationale = shouldPromote
    ? `density ${occurrences} clears install cost ${installCostBits} — advise promoting ${currentLevel} → ${promoteTo}`
    : upward === null
      ? `already at the top tier (${currentLevel}) — no upward promotion`
      : !admitted
        ? `bridge does not admit ${currentLevel} → ${upward} framing`
        : `density ${occurrences} below install cost ${installCostBits} — hold at ${currentLevel}`;

  return {
    groupKey,
    occurrences,
    currentLevel,
    promoteTo,
    shouldPromote,
    marginBits,
    diagonalLevels: bridge.diagonalLevels,
    rationale,
  };
}

/**
 * Group accumulated signals by their `groupKey` (default: `id`) and produce one
 * consolidation advice row per group. Advisory only.
 */
export function consolidate(
  signals: ReadonlyArray<CapturedSignal>,
  options: ConsolidationOptions = {},
): ConsolidationAdvice[] {
  const groups = new Map<string, CapturedSignal[]>();
  for (const s of signals) {
    const key = s.groupKey ?? s.id;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }
  return [...groups.values()].map((g) => consolidateGroup(g, options));
}

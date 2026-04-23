/**
 * Knowledge-drift mitigations: early-stop and rerank hooks.
 *
 * Implements the early-stop and rerank hooks described in DRIFT-19 (Phase 692),
 * adapting the oracle mitigation strategies from Spataru et al. 2024
 * (arXiv:2404.05411), specifically the oracle early-stopping result that raises
 * FActScore from 44.6% to 81.7% when generation is truncated at the drift point.
 *
 * Both hooks are agent-output middleware — they are designed to be called by a
 * pipeline orchestrator after SD-score detection.  They do NOT run automatically
 * on import. No global hooks are registered.
 *
 * Feature-flag gating:
 *  - `drift.knowledge.earlyStop` (default false) — enables early-stop truncation.
 *  - `drift.knowledge.rerank`    (default false) — enables rerank by ascending SD score.
 *
 * When both flags are false, both hooks are no-ops and return their first
 * argument unchanged — byte-identical to v1.49.568 outputs.
 *
 * Flag location in `.claude/settings.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "drift": {
 *       "knowledge": {
 *         "earlyStop": true,
 *         "rerank":    false
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @module drift/knowledge-mitigations
 */

import { readFileSync } from 'node:fs';
import type { SDResult } from './semantic-drift.js';

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

/**
 * Read `drift.knowledge.earlyStop` from settings.json.
 * Returns `false` on any read / parse / shape error.
 */
export function readEarlyStopFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  return _readDriftKnowledgeFlag(settingsPath, 'earlyStop');
}

/**
 * Read `drift.knowledge.rerank` from settings.json.
 * Returns `false` on any read / parse / shape error.
 */
export function readRerankFlag(
  settingsPath: string = '.claude/settings.json',
): boolean {
  return _readDriftKnowledgeFlag(settingsPath, 'rerank');
}

function _readDriftKnowledgeFlag(
  settingsPath: string,
  flagName: 'earlyStop' | 'rerank',
): boolean {
  try {
    const raw = (() => {
      const DEFAULT_PATH = '.claude/settings.json';
      const LIB_PATH = '.claude/gsd-skill-creator.json';
      // When the caller didn't override settingsPath (i.e. it's the default
      // harness path), also check the library-native .claude/gsd-skill-creator.json
      // first, since Claude Code's harness rejects unknown keys in settings.json.
      const paths = settingsPath === DEFAULT_PATH ? [LIB_PATH, DEFAULT_PATH] : [settingsPath];
      for (const _p of paths) {
        try {
          const _txt = readFileSync(_p, 'utf8');
          if (_txt) return _txt;
        } catch {}
      }
      throw new Error('no settings file found');
    })();
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;

    const driftSection = (scope as Record<string, unknown>).drift;
    if (!driftSection || typeof driftSection !== 'object') return false;

    const knowledge = (driftSection as Record<string, unknown>).knowledge;
    if (!knowledge || typeof knowledge !== 'object') return false;

    const flag = (knowledge as Record<string, unknown>)[flagName];
    return flag === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Early-stop hook
// ---------------------------------------------------------------------------

/** Options for `earlyStopHook`. */
export interface EarlyStopOptions {
  /** The generated text. */
  text: string;
  /** SD score result from `detectSemanticDrift`. */
  sdResult: SDResult;
  /** Score threshold above which early-stop fires. Default: 0.6. */
  threshold?: number;
  /**
   * Path to settings.json. If omitted, defaults to `.claude/settings.json`.
   * Pass `null` to skip flag read and use `flagOverride` instead.
   */
  settingsPath?: string | null;
  /**
   * Override the feature flag value directly.
   * Useful for testing without touching the filesystem.
   * When provided, `settingsPath` is ignored.
   */
  flagOverride?: boolean;
}

/** Result returned by `earlyStopHook`. */
export interface EarlyStopResult {
  /** The (possibly truncated) output text. */
  text: string;
  /** Whether truncation was applied. */
  truncated: boolean;
  /** The claim index at which truncation occurred, or null if not truncated. */
  truncated_at: number | null;
}

/**
 * Early-stop hook: truncates `text` at the SD drift point when the feature
 * flag is enabled and the SD score exceeds `threshold`.
 *
 * When the flag is off, returns the original text unchanged (no-op).
 *
 * Implements the oracle early-stopping strategy from Spataru 2024:
 * truncating at drift_point recovers ~37% of incorrect claims and raises
 * FActScore toward the oracle 81.7% ceiling.
 */
export function earlyStopHook(options: EarlyStopOptions): EarlyStopResult {
  const { text, sdResult, threshold = 0.6 } = options;

  // Resolve flag.
  const flagEnabled =
    options.flagOverride !== undefined
      ? options.flagOverride
      : readEarlyStopFlag(options.settingsPath ?? '.claude/settings.json');

  // Flag-off: no-op, byte-identical output.
  if (!flagEnabled) {
    return { text, truncated: false, truncated_at: null };
  }

  // Flag-on: truncate if score exceeds threshold and drift_point is known.
  if (sdResult.score >= threshold && sdResult.drift_point !== null) {
    const truncatedText = _truncateAtClaimIndex(text, sdResult.drift_point);
    return {
      text: truncatedText,
      truncated: true,
      truncated_at: sdResult.drift_point,
    };
  }

  return { text, truncated: false, truncated_at: null };
}

// ---------------------------------------------------------------------------
// Rerank hook
// ---------------------------------------------------------------------------

/** A single candidate with its associated SD score result. */
export interface RerankCandidate {
  /** The candidate text. */
  text: string;
  /** SD score result from `detectSemanticDrift` for this candidate. */
  sdResult: SDResult;
}

/** Options for `rerankHook`. */
export interface RerankOptions {
  /** Candidate texts with their SD scores. */
  candidates: RerankCandidate[];
  /**
   * Path to settings.json. If omitted, defaults to `.claude/settings.json`.
   * Pass `null` to skip flag read and use `flagOverride` instead.
   */
  settingsPath?: string | null;
  /**
   * Override the feature flag value directly.
   * Useful for testing without touching the filesystem.
   * When provided, `settingsPath` is ignored.
   */
  flagOverride?: boolean;
}

/** Result returned by `rerankHook`. */
export interface RerankResult {
  /** Candidates in their final order. */
  candidates: RerankCandidate[];
  /** Whether reranking was applied. */
  reranked: boolean;
}

/**
 * Rerank hook: reorders `candidates` by SD score ascending (lowest drift first)
 * when the feature flag is enabled.
 *
 * When the flag is off, returns the original array in its original order (no-op).
 * The returned `candidates` array is a new array — the input is never mutated.
 *
 * Implements the resample-rerank mitigation from Spataru 2024's factuality
 * tradeoff curve, which recovers ~70% of the oracle gain.
 */
export function rerankHook(options: RerankOptions): RerankResult {
  const { candidates } = options;

  // Resolve flag.
  const flagEnabled =
    options.flagOverride !== undefined
      ? options.flagOverride
      : readRerankFlag(options.settingsPath ?? '.claude/settings.json');

  // Flag-off: no-op, original order preserved.
  if (!flagEnabled) {
    return { candidates: [...candidates], reranked: false };
  }

  // Flag-on: sort by SD score ascending (lowest drift = best candidate first).
  const sorted = [...candidates].sort((a, b) => a.sdResult.score - b.sdResult.score);
  return { candidates: sorted, reranked: true };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Truncate text at a given claim (sentence) index.
 *
 * Splits the text into sentences using the same rule as `splitClaims` in
 * semantic-drift.ts, keeps sentences 0..driftPoint-1, and rejoins.
 *
 * If driftPoint is 0 or the text cannot be split, returns the original text.
 */
function _truncateAtClaimIndex(text: string, driftPoint: number): string {
  if (driftPoint <= 0) return text;

  const claims = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (driftPoint >= claims.length) {
    // drift_point is past end — no truncation needed.
    return text;
  }

  return claims.slice(0, driftPoint).join(' ');
}

/**
 * ME-2 Per-Skill Model Affinity — Frontmatter extension.
 *
 * Extends skill frontmatter with a `model_affinity:` block; mirrors the
 * pattern established by `src/output-structure/frontmatter.ts` (ME-5):
 *   - Declares the DEFAULT (absent = no affinity) for skills without the block.
 *   - Exposes `resolveModelAffinity()` that accepts a raw frontmatter value
 *     and returns a typed, validated `ModelAffinity | null`.
 *   - Exposes `serializeModelAffinity()` for round-trip write-back.
 *
 * Skills that do not declare `model_affinity:` return `null` (no affinity),
 * which per CF-ME2-03 incurs zero penalty and no escalation.
 *
 * **Feature-flag compatibility (CF-ME2-01):** When the
 * `gsd-skill-creator.model_affinity.enabled` flag is `false`, call sites
 * should skip invoking this module's policy evaluation entirely.  The parser
 * itself is always safe to import — callers honour the flag.
 *
 * @module model-affinity/frontmatter
 */

import { isModelAffinity, type ModelAffinity } from './schema.js';

// ---------------------------------------------------------------------------
// Resolution outcome type (mirrors ResolvedOutputStructure in ME-5)
// ---------------------------------------------------------------------------

/** Whether the `model_affinity` came from explicit frontmatter or was absent. */
export type ModelAffinitySource = 'explicit' | 'absent';

export interface ResolvedModelAffinity {
  /** The validated affinity block, or `null` when absent. */
  affinity: ModelAffinity | null;
  /** How the value was determined. */
  source: ModelAffinitySource;
  /** Non-fatal warnings; empty array on clean input. */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a raw frontmatter `model_affinity` value into a validated
 * `ModelAffinity | null`.  Missing or null values return `null` (no affinity).
 * Invalid values produce warnings and return `null` (non-fatal fallback).
 *
 * @param raw - The raw YAML-parsed value from frontmatter (any type).
 * @returns `ResolvedModelAffinity` with the typed value, source, and warnings.
 */
export function resolveModelAffinity(raw: unknown): ResolvedModelAffinity {
  // Absent or null → no affinity declared (CF-ME2-03: zero penalty, no escalation)
  if (raw == null) {
    return { affinity: null, source: 'absent', warnings: [] };
  }

  if (isModelAffinity(raw)) {
    return { affinity: raw, source: 'explicit', warnings: [] };
  }

  // Invalid shape → warn and return null (non-fatal)
  const warnings: string[] = [
    `[model_affinity] Invalid shape; expected {reliable: ModelFamily[], unreliable?: ModelFamily[]}. ` +
    `Got: ${JSON.stringify(raw)}. Treating as absent (zero penalty).`,
  ];
  return { affinity: null, source: 'absent', warnings };
}

// ---------------------------------------------------------------------------
// Serializer (for migration / write-back)
// ---------------------------------------------------------------------------

/**
 * Serialize a `ModelAffinity` back to a plain-object frontmatter shape.
 * Returns `undefined` when `affinity` is `null` (omit the field entirely).
 */
export function serializeModelAffinity(
  affinity: ModelAffinity | null,
): Record<string, unknown> | undefined {
  if (affinity === null) return undefined;

  const result: Record<string, unknown> = {
    reliable: [...affinity.reliable],
  };
  if (affinity.unreliable && affinity.unreliable.length > 0) {
    result['unreliable'] = [...affinity.unreliable];
  }
  return result;
}

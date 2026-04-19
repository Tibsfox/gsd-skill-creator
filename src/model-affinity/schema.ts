/**
 * ME-2 Per-Skill Model Affinity — Canonical schema types.
 *
 * Operationalises Zhang 2026 §5 "The Dominant Factor Is Model, Not Prompt":
 * model choice dominates prompt-level optimisation, so skills should declare
 * which model families they reliably execute on.
 *
 * Three-tier cost ordering: haiku < sonnet < opus.
 * `pickNextTierUp` always selects the cheapest reliable model above the current
 * session model to minimise escalation cost.
 *
 * @module model-affinity/schema
 */

// ---------------------------------------------------------------------------
// ModelFamily enum (cost-ordered: haiku = cheapest, opus = most capable)
// ---------------------------------------------------------------------------

/**
 * The three Claude model families plus an `unknown` sentinel for undetectable
 * session-model environments.
 *
 * Tier ordering (cost-ascending):
 *   haiku (0) < sonnet (1) < opus (2)
 *
 * `unknown` has tier −1; comparisons against it are safe but escalation to
 * `unknown` is not meaningful (filtered by `pickNextTierUp`).
 */
export type ModelFamily = 'haiku' | 'sonnet' | 'opus' | 'unknown';

/** Numeric tier for cost-ordering. Higher = more capable and more expensive. */
export const MODEL_TIER: Record<ModelFamily, number> = {
  haiku: 0,
  sonnet: 1,
  opus: 2,
  unknown: -1,
};

/** All known model families in cost-ascending order (excluding unknown). */
export const MODEL_FAMILIES_ORDERED: readonly ModelFamily[] = [
  'haiku',
  'sonnet',
  'opus',
] as const;

// ---------------------------------------------------------------------------
// ModelAffinity type
// ---------------------------------------------------------------------------

/**
 * Skill-authored model-affinity declaration.
 *
 * `min` — the cheapest model family the skill reliably executes on.
 * `preferred` — the recommended model family for best results.
 * `max` — the most capable model needed (skills work on this and above).
 *
 * All three are optional; absence means the skill makes no claim for that tier.
 * The conservative rule (CF-ME2-03): a skill with no `model_affinity` declared
 * incurs zero penalty and triggers no escalation.
 *
 * Per the proposal spec, the affinity is expressed as a `reliable` list in the
 * YAML frontmatter; `min`, `preferred`, and `max` are derivative conveniences
 * for the scoring API. The raw frontmatter shape uses `{reliable, unreliable}`.
 */
export interface ModelAffinity {
  /**
   * Model families on which the skill is known to work reliably.
   * Must contain at least one entry when the block is present.
   */
  reliable: ModelFamily[];
  /**
   * Model families on which the skill is known NOT to work reliably.
   * Optional; absence means "not confirmed unreliable" (neutral).
   */
  unreliable?: ModelFamily[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_FAMILIES = new Set<string>(['haiku', 'sonnet', 'opus', 'unknown']);

/**
 * Type guard — returns `true` when `value` is a well-formed `ModelAffinity`.
 * Used by the frontmatter resolver to validate the raw YAML block.
 */
export function isModelAffinity(value: unknown): value is ModelAffinity {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (!Array.isArray(obj['reliable'])) return false;
  if ((obj['reliable'] as unknown[]).length === 0) return false;
  if (!(obj['reliable'] as unknown[]).every((f) => typeof f === 'string' && VALID_FAMILIES.has(f))) {
    return false;
  }

  if (obj['unreliable'] !== undefined) {
    if (!Array.isArray(obj['unreliable'])) return false;
    if (
      !(obj['unreliable'] as unknown[]).every(
        (f) => typeof f === 'string' && VALID_FAMILIES.has(f),
      )
    ) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------

/**
 * Pick the cheapest reliable model family strictly above `current`.
 *
 * Per the spec: "picks the cheapest reliable tier above the current session
 * model" for minimum-cost recovery. `unknown` is filtered from the reliable
 * list before picking (escalation to `unknown` is not meaningful).
 *
 * Returns `undefined` when no higher reliable tier exists.
 */
export function pickNextTierUp(
  current: ModelFamily,
  reliable: ModelFamily[],
): ModelFamily | undefined {
  const currentTier = MODEL_TIER[current];
  const candidates = reliable.filter(
    (m) => m !== 'unknown' && MODEL_TIER[m] > currentTier,
  );
  // Sort ascending by tier, pick the cheapest
  candidates.sort((a, b) => MODEL_TIER[a] - MODEL_TIER[b]);
  return candidates[0];
}

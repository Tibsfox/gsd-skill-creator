/**
 * DACP fidelity-tier codec: bit-allocation oracle.
 *
 * Anchored on arXiv:2511.18884 (Robust Nonlinear Transform Coding), which
 * establishes that optimal rate allocation under a total budget constraint
 * must allocate from the highest-priority dimension down until the budget is
 * exhausted -- preserving the most perceptually (semantically) significant
 * dimensions monotonically as the budget decreases.
 *
 * This module implements that oracle for DACP fidelity tiers. Each "dimension"
 * is a named component of a DACP bundle (prose, schema, code, tests, etc.).
 * The oracle allocates P_budget across dimensions in priority order, returning
 * the set of dimensions that fit and the fidelity tier they imply.
 *
 * Convergent reference: arXiv:2604.20874 (Root Theorem of Context Engineering),
 * which anchors Hard Constraints on the bounded-tape framing -- P_budget is
 * treated as a Hard Constraint (non-negotiable ceiling, never relaxed).
 *
 * Monotonicity guarantee: for any P_budget' < P_budget, the set of allocated
 * dimensions under P_budget' is a subset of those under P_budget, ordered by
 * priority. The highest-priority dimensions are always preserved first.
 *
 * @module dacp/codec-fidelity
 */

import type { FidelityLevel } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A single dimension that can be allocated within a DACP bundle.
 * Dimensions are sorted by descending priority before allocation.
 */
export interface FidelityDimension {
  /** Unique name identifying this dimension (e.g., "prose", "schema", "code"). */
  name: string;

  /**
   * Priority rank. Higher values = higher priority.
   * Ties are broken by insertion order (stable sort).
   */
  priority: number;

  /**
   * Token cost of including this dimension.
   * Must be a non-negative integer.
   */
  cost: number;
}

/**
 * Result of the bit-allocation oracle.
 */
export interface CodecAllocationResult {
  /** Dimensions allocated (in priority order, highest first). */
  allocated: FidelityDimension[];

  /**
   * Dimensions excluded because the budget was exhausted before reaching them
   * (sorted by priority descending, same as allocated).
   */
  excluded: FidelityDimension[];

  /** Total tokens consumed by allocated dimensions. */
  totalCost: number;

  /** Remaining budget after allocation. */
  remaining: number;

  /**
   * Fidelity tier implied by the allocated dimension set.
   * Derived from how many of the canonical tier dimensions were funded.
   */
  fidelityTier: FidelityLevel;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Canonical DACP tier dimensions in default priority order (highest first).
 * These map to the FidelityLevel values defined in types.ts:
 *   0 = PROSE
 *   1 = PROSE_DATA
 *   2 = PROSE_DATA_SCHEMA
 *   3 = PROSE_DATA_CODE
 *   4 = PROSE_DATA_CODE_TESTS
 *
 * Callers may supply their own dimension set; this is the default.
 */
export const DEFAULT_FIDELITY_DIMENSIONS: FidelityDimension[] = [
  { name: 'prose', priority: 100, cost: 1_000 },
  { name: 'data', priority: 80, cost: 2_000 },
  { name: 'schema', priority: 60, cost: 3_000 },
  { name: 'code', priority: 40, cost: 8_000 },
  { name: 'tests', priority: 20, cost: 6_000 },
];

// ============================================================================
// Tier inference
// ============================================================================

/**
 * Infer the DACP fidelity tier from the set of allocated dimension names.
 *
 * Tier logic mirrors the FidelityLevel definitions in types.ts, with strict
 * cumulative hierarchy: each tier requires all lower-tier dimensions.
 * - 4 (PROSE_DATA_CODE_TESTS): prose + data + schema + code + tests all allocated
 * - 3 (PROSE_DATA_CODE):       prose + data + schema + code allocated
 * - 2 (PROSE_DATA_SCHEMA):     prose + data + schema allocated
 * - 1 (PROSE_DATA):            prose + data allocated
 * - 0 (PROSE):                 only prose (or nothing) allocated
 *
 * This cumulative requirement ensures monotone tier descent as budget decreases:
 * tier N is only achievable if all tier N-1 dimensions are also allocated.
 */
function inferTier(allocatedNames: Set<string>): FidelityLevel {
  // Cumulative: each tier requires all dimensions of lower tiers.
  const hasProse = allocatedNames.has('prose');
  const hasData = hasProse && allocatedNames.has('data');
  const hasSchema = hasData && allocatedNames.has('schema');
  const hasCode = hasSchema && allocatedNames.has('code');
  const hasTests = hasCode && allocatedNames.has('tests');

  if (hasTests) return 4;
  if (hasCode) return 3;
  if (hasSchema) return 2;
  if (hasData) return 1;
  return 0;
}

// ============================================================================
// Bit-allocation oracle
// ============================================================================

/**
 * Allocate dimensions under a token budget (P_budget Hard Constraint).
 *
 * Algorithm (arXiv:2511.18884 §3 greedy allocation):
 * 1. Sort dimensions by priority descending (stable: insertion order on ties).
 * 2. Greedily include each dimension if its cost fits within the remaining budget.
 * 3. Stop when all dimensions have been considered.
 *
 * Monotonicity property: for P_budget' ≤ P_budget, allocated(P_budget') ⊆
 * allocated(P_budget), where the subset relation respects priority order.
 * Proof sketch: the sort order is identical for all budgets; the only
 * difference is how far down the priority-sorted list we can afford.
 * Reducing the budget can only remove tail dimensions (lowest priority),
 * never head dimensions (highest priority).
 *
 * @param pBudget   Token budget (Hard Constraint; must be ≥ 0).
 * @param dimensions  Dimension set to allocate from (default: DEFAULT_FIDELITY_DIMENSIONS).
 * @returns Allocation result including tier inference.
 * @throws {RangeError} If pBudget is negative.
 */
export function allocateFidelityDimensions(
  pBudget: number,
  dimensions: FidelityDimension[] = DEFAULT_FIDELITY_DIMENSIONS,
): CodecAllocationResult {
  if (pBudget < 0) {
    throw new RangeError(`P_budget must be non-negative; got ${pBudget}`);
  }

  // Stable sort: descending priority, insertion order on ties.
  const sorted = [...dimensions].sort((a, b) => b.priority - a.priority);

  const allocated: FidelityDimension[] = [];
  const excluded: FidelityDimension[] = [];
  let remaining = pBudget;

  for (const dim of sorted) {
    if (dim.cost <= remaining) {
      allocated.push(dim);
      remaining -= dim.cost;
    } else {
      excluded.push(dim);
    }
  }

  const totalCost = pBudget - remaining;
  const allocatedNames = new Set(allocated.map(d => d.name));
  const fidelityTier = inferTier(allocatedNames);

  return { allocated, excluded, totalCost, remaining, fidelityTier };
}

/**
 * Convenience: return only the fidelity tier for a given budget.
 *
 * Uses DEFAULT_FIDELITY_DIMENSIONS unless overridden.
 *
 * @param pBudget   Token budget (Hard Constraint; must be ≥ 0).
 * @param dimensions  Optional custom dimension set.
 * @returns Inferred FidelityLevel.
 */
export function selectFidelityTier(
  pBudget: number,
  dimensions?: FidelityDimension[],
): FidelityLevel {
  return allocateFidelityDimensions(pBudget, dimensions).fidelityTier;
}

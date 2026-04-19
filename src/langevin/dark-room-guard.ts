/**
 * MD-3 — Dark-Room Guard for noise-injected updates.
 *
 * M7's `actionPolicy.ts` enforces a SC-DARK minimum-activity floor: an
 * action whose predicted activity falls below `minActivity` is penalised
 * so the agent cannot collapse to the trivial "do nothing and observe
 * silence" policy (Friston 2012 dark-room critique).
 *
 * Langevin noise can perturb a parameter vector enough to drop predicted
 * activity below the floor. This module verifies post-noise updates and
 * rejects (returning the pre-noise vector) any update that would violate
 * the SC-DARK invariant. The result includes diagnostics so callers can
 * count rejection events without re-implementing the activity computation.
 *
 * The guard treats the **sum** of the parameter vector as the activity
 * proxy. For row-stochastic / simplex inputs the sum is 1 by construction
 * and the guard is a no-op; for raw parameter vectors that have not yet
 * been normalised the sum is a usable activity scalar (matches the
 * `predicted` activity treatment in `actionPolicy.predictUnder`).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-3-langevin-noise.md
 *
 * @module langevin/dark-room-guard
 */

/**
 * Default SC-DARK minimum-activity floor — kept in sync with
 * `actionPolicy.rankActions` default (`options.minActivity ?? 0.1`).
 */
export const DEFAULT_DARK_ROOM_FLOOR = 0.1;

export interface DarkRoomGuardOptions {
  /**
   * SC-DARK minimum-activity floor. Default {@link DEFAULT_DARK_ROOM_FLOOR}.
   * The floor applies to the sum of the post-noise parameter vector.
   */
  minActivity?: number;
}

export interface DarkRoomGuardResult {
  /** Vector accepted into the system. Equals `noisy` on accept, `original` on reject. */
  accepted: number[];
  /** Whether the update was rejected (i.e. would violate the floor). */
  rejected: boolean;
  /** Activity (sum) measured on the noisy vector. */
  noisyActivity: number;
  /** Activity (sum) measured on the pre-noise vector. */
  originalActivity: number;
  /** Floor used for the comparison. */
  floor: number;
}

/**
 * Verify SC-DARK preservation post-noise injection. When the noisy vector
 * activity falls below `floor`, return the original (pre-noise) vector and
 * flag the rejection.
 *
 * Pure function — no side effects.
 */
export function guardDarkRoom(
  original: readonly number[],
  noisy: readonly number[],
  opts: DarkRoomGuardOptions = {},
): DarkRoomGuardResult {
  const floor = opts.minActivity ?? DEFAULT_DARK_ROOM_FLOOR;
  const noisyActivity = activityOf(noisy);
  const originalActivity = activityOf(original);

  // Reject only when the noisy vector is below the floor *and* the noise
  // is what made it so. If the original was already below (e.g. caller
  // handed in a degenerate input), there is nothing for the guard to
  // protect — pass it through unchanged so the caller can detect the
  // upstream issue.
  const rejected = noisyActivity < floor && originalActivity >= floor;

  return {
    accepted: rejected ? toMutable(original) : toMutable(noisy),
    rejected,
    noisyActivity,
    originalActivity,
    floor,
  };
}

/**
 * Quick predicate variant — true iff the noisy vector preserves SC-DARK.
 */
export function preservesDarkRoom(
  noisy: readonly number[],
  opts: DarkRoomGuardOptions = {},
): boolean {
  const floor = opts.minActivity ?? DEFAULT_DARK_ROOM_FLOOR;
  return activityOf(noisy) >= floor;
}

function activityOf(v: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (Number.isFinite(x)) s += Math.max(0, x as number);
  }
  return s;
}

function toMutable(v: readonly number[]): number[] {
  const out = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i]!;
  return out;
}

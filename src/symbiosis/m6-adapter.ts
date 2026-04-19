/**
 * M8 Symbiosis × M6 Sensoria — teaching-driven K_H adjustment.
 *
 * Wave 2 integration: when the developer records a `constraint` teaching
 * entry referencing a skill, M6's effective K_H for that skill is pushed
 * down (harder to activate — the developer has explicitly asked the system
 * to avoid the skill under similar conditions). Conversely, a `preference`
 * entry referencing a skill raises K_H (easier to activate).
 *
 * K_H adjustment mechanics
 * ------------------------
 * The adapter exposes two hooks:
 *
 *   applyTeachEntryToM6(store, entry, resolver) — apply a single entry's
 *     K_H delta directly to the shared DesensitisationStore.
 *
 *   adjustSensoriaBlock(block, entries)          — functional variant that
 *     returns a new SensoriaBlock with adjusted K_H. Useful for the
 *     applicator hook's `resolveBlock` callback.
 *
 * Calibration
 * -----------
 * Each `constraint` subtracts `constraintDelta` (default 0.15) from the
 * effective K_H; each `preference` adds `preferenceDelta` (default 0.10).
 * K_H is clamped to `[K_L * floorRatio, K_H_initial * ceilRatio]` so runaway
 * accumulation is bounded.
 *
 * Source: component spec §M8↔M6 wire; Lanzara 2023 Appendix III (slow-
 * timescale K_H drift as exogenous-signal channel).
 *
 * @module symbiosis/m6-adapter
 */

import { readTeachEntries } from './teaching.js';
import { DesensitisationStore } from '../sensoria/desensitisation.js';
import { DEFAULT_SENSORIA } from '../sensoria/frontmatter.js';
import type { SensoriaBlock } from '../types/sensoria.js';
import type { TeachEntry } from '../types/symbiosis.js';

/**
 * Weights applied to each teaching category → K_H shift.
 */
export interface KHAdjustmentConfig {
  /** Magnitude subtracted from K_H per `constraint` entry. */
  constraintDelta: number;
  /** Magnitude added to K_H per `preference` entry. */
  preferenceDelta: number;
  /** Lower bound: K_H never falls below `K_L * floorRatio`. Default 1. */
  floorRatio: number;
  /** Upper bound: K_H never exceeds `K_H_initial * ceilRatio`. Default 2. */
  ceilRatio: number;
}

export const DEFAULT_KH_CONFIG: Readonly<KHAdjustmentConfig> = Object.freeze({
  constraintDelta: 0.15,
  preferenceDelta: 0.10,
  floorRatio: 1.0,
  ceilRatio: 2.0,
});

/**
 * For each teaching entry, compute a net K_H shift per skill ref.
 * Returned map: `skillName → shift`. Negative values lower K_H.
 */
export function computeKHShifts(
  entries: readonly TeachEntry[],
  config: KHAdjustmentConfig = DEFAULT_KH_CONFIG,
): Map<string, number> {
  const shifts = new Map<string, number>();
  for (const entry of entries) {
    let delta = 0;
    if (entry.category === 'constraint') {
      delta = -config.constraintDelta;
    } else if (entry.category === 'preference') {
      delta = config.preferenceDelta;
    } else {
      continue;
    }
    for (const ref of entry.refs ?? []) {
      if (!ref) continue;
      shifts.set(ref, (shifts.get(ref) ?? 0) + delta);
    }
  }
  return shifts;
}

/**
 * Apply a set of teaching entries to a live desensitisation store. For each
 * skill ref we nudge the stored `effectiveK_H` by the accumulated shift,
 * clamped to `[K_L*floorRatio, K_H_initial*ceilRatio]`.
 *
 * `resolveBlock` returns the skill's canonical SensoriaBlock (used to
 * compute clamp bounds). Defaults to the documented DEFAULT_SENSORIA.
 */
export function applyTeachEntriesToM6(
  store: DesensitisationStore,
  entries: readonly TeachEntry[],
  opts: {
    resolveBlock?: (skillName: string) => SensoriaBlock;
    config?: KHAdjustmentConfig;
    now?: () => number;
  } = {},
): Map<string, { prevK_H: number; newK_H: number }> {
  const config = opts.config ?? DEFAULT_KH_CONFIG;
  const resolver = opts.resolveBlock ?? (() => ({ ...DEFAULT_SENSORIA }));
  const now = opts.now ?? (() => Date.now());
  const shifts = computeKHShifts(entries, config);

  const changelog = new Map<string, { prevK_H: number; newK_H: number }>();

  for (const [skillName, shift] of shifts) {
    const block = resolver(skillName);
    const state = store.getOrInit(skillName, block, now());
    const prev = state.effectiveK_H;
    const next = clamp(
      prev + shift,
      block.K_L * config.floorRatio,
      block.K_H * config.ceilRatio,
    );
    state.effectiveK_H = next;
    changelog.set(skillName, { prevK_H: prev, newK_H: next });
  }

  return changelog;
}

/**
 * Return a new SensoriaBlock with `K_H` adjusted by the accumulated teaching
 * shifts for the given skill. Useful when the applicator's `resolveBlock`
 * callback wants to reflect teaching without mutating desensitisation state.
 */
export function adjustSensoriaBlock(
  skillName: string,
  baseBlock: SensoriaBlock,
  entries: readonly TeachEntry[],
  config: KHAdjustmentConfig = DEFAULT_KH_CONFIG,
): SensoriaBlock {
  const shifts = computeKHShifts(entries, config);
  const shift = shifts.get(skillName) ?? 0;
  if (shift === 0) return { ...baseBlock };
  const adjusted = clamp(
    baseBlock.K_H + shift,
    baseBlock.K_L * config.floorRatio,
    baseBlock.K_H * config.ceilRatio,
  );
  return { ...baseBlock, K_H: adjusted };
}

/**
 * High-level entry point: read the teaching ledger from disk, apply
 * accumulated shifts to the given store, and return the changelog.
 */
export function syncM6FromTeachingLedger(
  store: DesensitisationStore,
  opts: {
    ledgerPath?: string;
    resolveBlock?: (skillName: string) => SensoriaBlock;
    config?: KHAdjustmentConfig;
    now?: () => number;
  } = {},
): Map<string, { prevK_H: number; newK_H: number }> {
  const entries = readTeachEntries(opts.ledgerPath);
  return applyTeachEntriesToM6(store, entries, opts);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

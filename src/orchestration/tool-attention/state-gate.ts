/**
 * HB-01 — State-aware top-k gate.
 *
 * Adjusts the top-k tool budget by current task phase. Phase-pinned tools
 * survive regardless of their ISO rank; non-pinned tools take the remaining
 * slots in score-desc order.
 *
 * Default-OFF: returns the disabled-result sentinel when the flag is off.
 *
 * @module orchestration/tool-attention/state-gate
 */

import { isToolAttentionEnabled } from './settings.js';
import type {
  IsoScoreOutput,
  IsoScoreDisabled,
  StateGateConfig,
  GateOutput,
  GateDisabled,
  TaskPhase,
} from './types.js';

const DISABLED_RESULT: GateDisabled = Object.freeze({
  selected: [] as never[],
  effectiveTopK: 0 as 0,
  pinnedSurvivors: [] as never[],
  disabled: true,
});

export const DEFAULT_GATE_CONFIG: StateGateConfig = Object.freeze({
  perPhaseTopK: {
    planning: 12,
    executing: 8,
    verifying: 10,
    unknown: 8,
  },
  defaultTopK: 8,
  maxTopK: 24,
});

/**
 * Apply the state-aware gate to a ranked ISO output.
 */
export function applyStateGate(
  iso: IsoScoreOutput | IsoScoreDisabled,
  phase: TaskPhase,
  config: StateGateConfig = DEFAULT_GATE_CONFIG,
  settingsPath?: string,
): GateOutput | GateDisabled {
  if (!isToolAttentionEnabled(settingsPath)) return DISABLED_RESULT;
  if ('disabled' in iso && iso.disabled === true) return DISABLED_RESULT;

  const baseK = config.perPhaseTopK?.[phase] ?? config.defaultTopK;
  const effectiveTopK = Math.max(0, Math.min(baseK, config.maxTopK));

  const ranked = (iso as IsoScoreOutput).ranked;
  const pinnedSurvivors: string[] = [];
  const nonPinned: string[] = [];

  for (const entry of ranked) {
    if (entry.pinned) pinnedSurvivors.push(entry.name);
    else nonPinned.push(entry.name);
  }

  // Pinned always selected; non-pinned fills remaining slots up to topK.
  // If pinned exceeds topK, we still emit all pins (defense: never starve a
  // declared invariant). Note this can exceed maxTopK in pathological cases
  // and is documented as the "pin never starves" rule.
  const remaining = Math.max(0, effectiveTopK - pinnedSurvivors.length);
  const selected = [...pinnedSurvivors, ...nonPinned.slice(0, remaining)];

  return {
    selected,
    effectiveTopK,
    pinnedSurvivors,
  };
}

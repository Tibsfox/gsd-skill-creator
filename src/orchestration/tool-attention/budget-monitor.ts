/**
 * HB-01 — Token-budget monitor.
 *
 * Watches the running fraction of context occupied by tool schemas; warns at
 * the paper's 70% context-fracture threshold (arXiv:2604.21816).
 *
 * Default-OFF: returns the disabled-result sentinel when the flag is off.
 *
 * @module orchestration/tool-attention/budget-monitor
 */

import { isToolAttentionEnabled } from './settings.js';
import type {
  BudgetMonitorOutput,
  BudgetMonitorDisabled,
} from './types.js';

const DISABLED_RESULT: BudgetMonitorDisabled = Object.freeze({
  occupancyTokens: 0 as 0,
  contextWindowTokens: 0 as 0,
  occupancyRatio: 0 as 0,
  fractureAlert: false as false,
  fractureThreshold: 0 as 0,
  disabled: true,
});

export const DEFAULT_FRACTURE_THRESHOLD = 0.70;

export interface BudgetMonitorInput {
  /** Token count attributed to schemas (compact + full). */
  occupancyTokens: number;
  /** Total context window of the active model. */
  contextWindowTokens: number;
  /** Override the default 0.70 threshold (e.g. for stricter contexts). */
  fractureThreshold?: number;
}

export function checkBudget(
  input: BudgetMonitorInput,
  settingsPath?: string,
): BudgetMonitorOutput | BudgetMonitorDisabled {
  if (!isToolAttentionEnabled(settingsPath)) return DISABLED_RESULT;
  const threshold = clamp01(input.fractureThreshold ?? DEFAULT_FRACTURE_THRESHOLD);
  const occupancy = Math.max(0, input.occupancyTokens || 0);
  const window = Math.max(0, input.contextWindowTokens || 0);
  const ratio = window === 0 ? 0 : occupancy / window;
  return {
    occupancyTokens: occupancy,
    contextWindowTokens: window,
    occupancyRatio: ratio,
    fractureAlert: ratio >= threshold,
    fractureThreshold: threshold,
  };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return DEFAULT_FRACTURE_THRESHOLD;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

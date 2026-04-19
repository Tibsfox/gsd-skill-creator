/**
 * M6 Sensoria — Frontmatter schema and default resolution.
 *
 * Skills may declare a `sensoria:` block in their YAML frontmatter:
 *
 * ```yaml
 * ---
 * name: example-skill
 * sensoria:
 *   K_H: 10.0
 *   K_L: 0.1
 *   R_T_init: 1.0
 *   theta: 0.05
 *   disabled: false
 * ---
 * ```
 *
 * Skills without an explicit `sensoria:` block receive the documented
 * defaults (`K_H=5.0, K_L=0.5, R_T_init=1.0, theta=0.05, disabled=false`)
 * — CF-M6-07.
 *
 * @module sensoria/frontmatter
 */

import type { SensoriaBlock } from '../types/sensoria.js';

/**
 * Documented defaults — applied to skills without an explicit `sensoria:`
 * block. Keeps the net-shift enabled (`disabled: false`) with moderate
 * affinity spread so the default is neither a silent binder nor a saturated
 * receptor.
 */
export const DEFAULT_SENSORIA: Readonly<SensoriaBlock> = Object.freeze({
  K_H: 5.0,
  K_L: 0.5,
  R_T_init: 1.0,
  theta: 0.05,
  disabled: false,
});

/**
 * Resolution outcome — whether the block came from explicit frontmatter or
 * from defaults. Callers typically do not care; the CLI surfaces this in
 * verbose output.
 */
export type SensoriaSource = 'explicit' | 'default' | 'partial';

export interface ResolvedSensoria {
  block: SensoriaBlock;
  source: SensoriaSource;
  /** Validation warnings (non-fatal); empty array on clean input. */
  warnings: string[];
}

/**
 * Resolve a raw frontmatter `sensoria` value into a validated
 * `SensoriaBlock`. Missing fields are filled from `DEFAULT_SENSORIA`. Invalid
 * fields (wrong type, out of range) fall back to defaults with a warning.
 *
 * - `K_H`, `K_L`, `R_T_init`, `theta` must be finite numbers ≥ 0.
 * - `K_H` should be ≥ `K_L` for the receptor to have a non-negative
 *   equilibrium shift under positive ligand concentration. A reversed
 *   ordering is permitted (the math tolerates it — ΔR_H simply becomes
 *   negative) but a warning is surfaced so the skill author can audit.
 * - `disabled` must be boolean; non-boolean values fall back to `false`.
 */
export function resolveSensoria(raw: unknown): ResolvedSensoria {
  const warnings: string[] = [];

  if (raw == null) {
    return { block: { ...DEFAULT_SENSORIA }, source: 'default', warnings };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    warnings.push('sensoria: expected object; using defaults');
    return { block: { ...DEFAULT_SENSORIA }, source: 'default', warnings };
  }

  const obj = raw as Record<string, unknown>;
  let explicitFields = 0;
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA };

  const assignNumber = (key: 'K_H' | 'K_L' | 'R_T_init' | 'theta') => {
    if (!(key in obj)) return;
    const v = obj[key];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      block[key] = v;
      explicitFields += 1;
    } else {
      warnings.push(`sensoria.${key}: invalid (expected finite number ≥ 0); using default ${DEFAULT_SENSORIA[key]}`);
    }
  };

  assignNumber('K_H');
  assignNumber('K_L');
  assignNumber('R_T_init');
  assignNumber('theta');

  if ('disabled' in obj) {
    const d = obj.disabled;
    if (typeof d === 'boolean') {
      block.disabled = d;
      explicitFields += 1;
    } else {
      warnings.push('sensoria.disabled: expected boolean; using default false');
    }
  }

  if (block.K_H < block.K_L) {
    warnings.push(
      `sensoria: K_H (${block.K_H}) < K_L (${block.K_L}) — net shift will be negative (inverted receptor).`,
    );
  }

  const source: SensoriaSource = explicitFields === 0
    ? 'default'
    : explicitFields >= 5 ? 'explicit' : 'partial';

  return { block, source, warnings };
}

/**
 * Serialize a SensoriaBlock back to the frontmatter shape. Omits fields that
 * exactly match `DEFAULT_SENSORIA` when `compact` is true.
 */
export function serializeSensoria(
  block: SensoriaBlock,
  compact: boolean = false,
): Record<string, number | boolean> {
  const out: Record<string, number | boolean> = {};
  const keys: Array<keyof SensoriaBlock> = ['K_H', 'K_L', 'R_T_init', 'theta', 'disabled'];
  for (const key of keys) {
    const value = block[key];
    if (value === undefined) continue;
    if (compact && value === DEFAULT_SENSORIA[key]) continue;
    out[key] = value as number | boolean;
  }
  return out;
}

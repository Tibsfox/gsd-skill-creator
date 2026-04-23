/**
 * M6 Sensoria — Feature-flagged applicator hook.
 *
 * M5's applicator (`src/application/skill-applicator.ts`) runs a scoring
 * pipeline that produces an αβγ score per skill. M6 adds a receptor-activation
 * gate on top: after scoring, consult the net-shift equation to decide whether
 * each scored skill should fire.
 *
 * The hook is **strictly additive** and **default-off**:
 *
 *  - The global flag `gsd-skill-creator.sensoria.enabled` (read from
 *    `.claude/settings.json`) defaults to `false`. When off, this module
 *    never runs — the pipeline is byte-identical to the pre-M6 build
 *    (SC-FLAG-OFF guarantee).
 *  - Per-skill opt-out: if a skill's `sensoria.disabled` is `true`, the
 *    hook short-circuits to M5's fallback for that skill only.
 *
 * Signal mapping: M5's relevance score is mapped to ligand concentration
 * `[L]` (the scorer's `finalScore` field, clamped ≥ 0). The receptor
 * parameters `K_H`, `K_L`, `R_T` and the threshold `theta` come from the
 * skill's resolved `SensoriaBlock`.
 *
 * @module sensoria/applicator-hook
 */

import { readFileSync } from 'node:fs';
import type { PipelineStage, PipelineContext } from '../application/skill-pipeline.js';
import type { SkillStore } from '../storage/skill-store.js';
import type { ScoredSkill } from '../types/application.js';
import type { SensoriaBlock } from '../types/sensoria.js';
import { computeNetShift } from './netShift.js';
import { DesensitisationStore } from './desensitisation.js';
import { resolveSensoria, DEFAULT_SENSORIA } from './frontmatter.js';

export interface HookDecision {
  shouldActivate: boolean;
  via: 'netshift' | 'm5-fallback';
  deltaR_H?: number;
  theta?: number;
}

export interface SensoriaHookOptions {
  /** Override the global flag; when unset, reads from settings file. */
  enabled?: boolean;
  /** Path to `.claude/settings.json`; defaults to cwd-relative. */
  settingsPath?: string;
  /** Shared desensitisation store (trunk vs branch isolation). */
  desensitisation?: DesensitisationStore;
  /** Provider for per-skill SensoriaBlock; defaults to `DEFAULT_SENSORIA`. */
  resolveBlock?: (skillName: string) => SensoriaBlock;
  /** Clock injection for tests. */
  now?: () => number;
}

/**
 * Read the global enabled flag from `.claude/settings.json`. Returns `false`
 * (safe default) on any read or parse error — the hook must never run unless
 * the operator has explicitly opted in.
 *
 * Flag location in settings.json:
 * ```json
 * {
 *   "gsd-skill-creator": { "sensoria": { "enabled": true } }
 * }
 * ```
 */
export function readSensoriaEnabledFlag(settingsPath: string = '.claude/settings.json'): boolean {
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
    const sensoria = (scope as Record<string, unknown>).sensoria;
    if (!sensoria || typeof sensoria !== 'object') return false;
    const enabled = (sensoria as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}

/**
 * Decide whether a single skill should activate, given a ligand concentration
 * `L` (derived from M5's relevance score). Returns `shouldActivate=true` via
 * `netshift` when the flag is on, the skill is not opted out, and ΔR_H > θ.
 * Falls back to `m5-fallback` in all other cases — caller should consult the
 * M5 αβγ score when `via === 'm5-fallback'`.
 */
export function decideActivation(
  skillName: string,
  L: number,
  opts: SensoriaHookOptions = {},
): HookDecision {
  const enabled = opts.enabled ?? readSensoriaEnabledFlag(opts.settingsPath);
  if (!enabled) {
    return { shouldActivate: false, via: 'm5-fallback' };
  }

  const block: SensoriaBlock = opts.resolveBlock
    ? opts.resolveBlock(skillName)
    : { ...DEFAULT_SENSORIA };

  if (block.disabled === true) {
    return { shouldActivate: false, via: 'm5-fallback' };
  }

  const now = opts.now ? opts.now() : Date.now();
  const store = opts.desensitisation ?? sharedDesensStore;
  const { effectiveK_H, R_T } = store.recordActivation(
    skillName,
    block,
    L,
    block.R_T_init,
    now,
  );
  const result = computeNetShift(L, R_T, effectiveK_H, block.K_L, block.theta);
  return {
    shouldActivate: result.activated,
    via: 'netshift',
    deltaR_H: result.deltaR_H,
    theta: block.theta,
  };
}

/**
 * Shared in-process desensitisation store. Most callers use this; trunk vs
 * branch isolation (IT-05) is achieved by passing a dedicated
 * `DesensitisationStore` via `SensoriaHookOptions.desensitisation`.
 */
export const sharedDesensStore = new DesensitisationStore();

/**
 * Create a pipeline stage that applies net-shift gating to `scoredSkills`.
 * When the flag is off the stage is still present, but its `process()` is a
 * no-op — `context` flows through untouched. When on, the stage filters out
 * skills whose ΔR_H falls below `theta`; filtered skills remain in
 * `context.skipped` for diagnostics.
 *
 * The caller (skill-applicator.ts) decides whether to add this stage. Because
 * the stage is pure-pass-through when disabled, the byte-identical guarantee
 * (SC-FLAG-OFF) is structural: with the flag off, the same skills in the
 * same order with the same scores flow into the downstream stages as before.
 */
export function createSensoriaStage(
  skillStore: SkillStore,
  opts: SensoriaHookOptions = {},
): PipelineStage {
  return {
    name: 'sensoria',
    async process(ctx: PipelineContext): Promise<PipelineContext> {
      const enabled = opts.enabled ?? readSensoriaEnabledFlag(opts.settingsPath);
      if (!enabled || ctx.earlyExit) return ctx;

      const resolver = opts.resolveBlock ?? (() => ({ ...DEFAULT_SENSORIA }));
      const now = opts.now ?? (() => Date.now());
      const store = opts.desensitisation ?? sharedDesensStore;

      const rejected = new Set<string>();
      const gate = (list: ScoredSkill[]): ScoredSkill[] => {
        const kept: ScoredSkill[] = [];
        for (const scored of list) {
          const block = resolver(scored.name);
          if (block.disabled === true) {
            kept.push(scored);
            continue;
          }
          const L = Math.max(0, scored.score);
          const { effectiveK_H, R_T } = store.recordActivation(
            scored.name,
            block,
            L,
            block.R_T_init,
            now(),
          );
          const r = computeNetShift(L, R_T, effectiveK_H, block.K_L, block.theta);
          if (r.activated) {
            kept.push(scored);
          } else {
            rejected.add(scored.name);
          }
        }
        return kept;
      };

      // Apply to scoredSkills (pre-resolve) AND resolvedSkills (post-resolve).
      // Depending on where the stage is inserted, one or the other is the live
      // downstream input; filtering both keeps the two views consistent.
      ctx.scoredSkills = gate(ctx.scoredSkills);
      ctx.resolvedSkills = ctx.resolvedSkills.filter(s => !rejected.has(s.name));
      for (const name of rejected) {
        if (!ctx.skipped.includes(name)) ctx.skipped.push(name);
      }
      // skillStore is intentionally accepted but not yet used — reserved for
      // a future extension that resolves block data from on-disk frontmatter.
      void skillStore;
      return ctx;
    },
  };
}

/**
 * M6 Sensoria — `skill-creator sensoria <skill>` command.
 *
 * Reports the net-shift response curve for a single skill across a standard
 * ligand sweep, together with the resolved SensoriaBlock (from frontmatter
 * or defaults). Used by authors to tune `K_H`, `K_L`, and `theta` without
 * running the full applicator.
 *
 * @module sensoria/cli
 */

import type { SkillStore } from '../storage/skill-store.js';
import { computeNetShift, peakLigand } from './netShift.js';
import { resolveSensoria, DEFAULT_SENSORIA } from './frontmatter.js';
import { DesensitisationStore } from './desensitisation.js';
import { readSensoriaEnabledFlag } from './applicator-hook.js';

export interface SensoriaCliOptions {
  /** One of: 'table' | 'json' | 'curve'. Default 'table'. */
  format?: string;
  /** Sweep start (default 0.01). */
  min?: number;
  /** Sweep end (default 100). */
  max?: number;
  /** Number of sweep points (default 12). */
  points?: number;
  /** Show the 20-activation tachyphylaxis trace instead of the sweep. */
  tachyphylaxis?: boolean;
  /** Suppress non-essential output (machine readable). */
  quiet?: boolean;
  /** Override `.claude/settings.json` path for flag lookup. */
  settingsPath?: string;
}

export interface SensoriaCommandDeps {
  skillStore: SkillStore;
  /** Optional parsed frontmatter lookup; defaults to `skillStore.read()`. */
  readFrontmatter?: (skillName: string) => Promise<Record<string, unknown>>;
  logger?: (line: string) => void;
}

const DEFAULT_LOG: (line: string) => void = (line) => { console.log(line); };

/**
 * Execute the `sensoria` subcommand.
 *
 * @returns exit code (0 on success, 1 on unknown skill or bad args).
 */
export async function sensoriaCommand(
  skillName: string | undefined,
  options: SensoriaCliOptions,
  deps: SensoriaCommandDeps,
): Promise<number> {
  const log = deps.logger ?? DEFAULT_LOG;

  if (!skillName || skillName === '--help' || skillName === '-h') {
    showSensoriaHelp(log);
    return skillName ? 0 : 1;
  }

  // Resolve frontmatter. On failure we still proceed with DEFAULT_SENSORIA so
  // the tool is useful for skills that have not yet added a sensoria block.
  let frontmatter: Record<string, unknown> = {};
  try {
    if (deps.readFrontmatter) {
      frontmatter = await deps.readFrontmatter(skillName);
    } else {
      const skill = await deps.skillStore.read(skillName);
      frontmatter = (skill as unknown as { metadata?: Record<string, unknown> }).metadata ?? {};
    }
  } catch {
    if (!options.quiet) {
      log(`[warn] skill '${skillName}' not found in store; using DEFAULT_SENSORIA`);
    }
  }

  const resolved = resolveSensoria(frontmatter.sensoria);
  const block = resolved.block;

  if (!options.quiet) {
    const flagOn = readSensoriaEnabledFlag(options.settingsPath);
    log(`skill: ${skillName}`);
    log(`  global flag: gsd-skill-creator.sensoria.enabled = ${flagOn}`);
    log(`  source: ${resolved.source}`);
    log(`  K_H=${block.K_H}  K_L=${block.K_L}  R_T_init=${block.R_T_init}  theta=${block.theta}  disabled=${block.disabled ?? false}`);
    for (const w of resolved.warnings) log(`  [warn] ${w}`);
  }

  const format = options.format ?? 'table';

  if (options.tachyphylaxis) {
    return renderTachyphylaxis(skillName, block, log, format);
  }
  return renderSweep(skillName, block, options, log, format);
}

function renderSweep(
  skillName: string,
  block: ReturnType<typeof resolveSensoria>['block'],
  options: SensoriaCliOptions,
  log: (line: string) => void,
  format: string,
): number {
  const min = options.min ?? 0.01;
  const max = options.max ?? 100;
  const n = Math.max(2, options.points ?? 12);

  const samples: Array<{ L: number; deltaR_H: number; activated: boolean }> = [];
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const L = Math.exp(logMin + t * (logMax - logMin));
    const r = computeNetShift(L, block.R_T_init, block.K_H, block.K_L, block.theta);
    samples.push({ L, deltaR_H: r.deltaR_H, activated: r.activated });
  }

  if (format === 'json') {
    log(JSON.stringify({
      skill: skillName,
      block,
      peakLigand: peakLigand(block.K_H, block.K_L),
      sweep: samples,
    }, null, 2));
    return 0;
  }

  log('  L           ΔR_H         activated');
  for (const s of samples) {
    log(`  ${s.L.toExponential(2).padEnd(12)}${s.deltaR_H.toExponential(4).padEnd(14)}${s.activated ? 'yes' : 'no'}`);
  }
  log(`  peak [L] ≈ ${peakLigand(block.K_H, block.K_L).toExponential(4)}`);
  return 0;
}

function renderTachyphylaxis(
  skillName: string,
  block: ReturnType<typeof resolveSensoria>['block'],
  log: (line: string) => void,
  format: string,
): number {
  const store = new DesensitisationStore();
  const L = peakLigand(block.K_H, block.K_L);
  const trace: Array<{ step: number; deltaR_H: number; effectiveK_H: number; R_T: number }> = [];
  let t = 0;
  for (let step = 0; step < 20; step += 1) {
    t += 1000; // 1 second per step
    const { effectiveK_H, R_T } = store.recordActivation(skillName, block, L, block.R_T_init, t);
    const r = computeNetShift(L, R_T, effectiveK_H, block.K_L, block.theta);
    trace.push({ step, deltaR_H: r.deltaR_H, effectiveK_H, R_T });
  }

  if (format === 'json') {
    log(JSON.stringify({ skill: skillName, block, trace }, null, 2));
    return 0;
  }

  log('  step  ΔR_H         effectiveK_H  R_T');
  for (const row of trace) {
    log(`  ${String(row.step).padEnd(6)}${row.deltaR_H.toExponential(4).padEnd(14)}${row.effectiveK_H.toFixed(4).padEnd(14)}${row.R_T.toFixed(6)}`);
  }
  const first = trace[0]!;
  const last = trace[trace.length - 1]!;
  const fadePct = first.deltaR_H === 0 ? 0 : ((first.deltaR_H - last.deltaR_H) / first.deltaR_H) * 100;
  log(`  20-step fade: ${fadePct.toFixed(1)}%  (CF-M6-03 target ≥30%)`);
  return 0;
}

function showSensoriaHelp(log: (line: string) => void): void {
  log(`skill-creator sensoria - M6 net-shift receptor activation diagnostic

Usage:
  skill-creator sensoria <skill> [options]

Options:
  --format=<table|json>    Output format (default: table)
  --min=<n>                Sweep start concentration (default: 0.01)
  --max=<n>                Sweep end concentration (default: 100)
  --points=<n>             Number of sweep points (default: 12)
  --tachyphylaxis          Show 20-activation tachyphylaxis trace instead
  --quiet                  Machine-readable; suppress status lines
  --settings=<path>        Path to .claude/settings.json

Examples:
  skill-creator sensoria my-skill
  skill-creator sensoria my-skill --format=json
  skill-creator sensoria my-skill --min=0.001 --max=1000 --points=24
  skill-creator sensoria my-skill --tachyphylaxis
  skill-creator sensoria my-skill --tachyphylaxis --format=json

Defaults (when skill has no explicit sensoria: block):
  K_H=${DEFAULT_SENSORIA.K_H}  K_L=${DEFAULT_SENSORIA.K_L}  R_T_init=${DEFAULT_SENSORIA.R_T_init}  theta=${DEFAULT_SENSORIA.theta}

Global flag (default OFF, read from .claude/settings.json):
  { "gsd-skill-creator": { "sensoria": { "enabled": true } } }
`);
}

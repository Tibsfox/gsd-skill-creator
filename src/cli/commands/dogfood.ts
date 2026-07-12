/**
 * Dogfood CLI command.
 *
 * Routes the SkillUpdate proposals produced by the dogfood refinement pass
 * (`refineSkills`) into staged skill DRAFTS ready for the human ship gate.
 *
 * - promote <run>   Materialize the 'create' updates of a run as staged drafts.
 *
 * A "run" is a directory holding the refinement output. `promote` reads its
 * `skill-updates.json` (either a RefinementResult with a `skillUpdates` array,
 * or a bare SkillUpdate[]) and writes drafts under `<run>/drafts/`. Nothing
 * lands in `.claude/skills/` — promotion into the auto-load path stays a human
 * `skill-creator skill ship <name>` step.
 */

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { SkillUpdate } from '../../dogfood/refinement/types.js';
import { routeSkillUpdatesToDrafts } from '../../dogfood/refinement/draft-router.js';

// ─── Argument parsing (pure, tested) ────────────────────────────────────────

export interface ParsedDogfoodArgs {
  subcommand: string | undefined;
  positional: string[];
  input?: string;
  out?: string;
  json: boolean;
  help: boolean;
}

/**
 * Parse the slice after `dogfood`. Recognises `--input <path>` (override the
 * skill-updates source), `--out <path>` (override the drafts directory),
 * `--json`, and `--help`/`-h`. Other dashed tokens are ignored.
 */
export function parseDogfoodArgs(args: string[]): ParsedDogfoodArgs {
  const positional: string[] = [];
  let input: string | undefined;
  let out: string | undefined;
  let json = false;
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--json') {
      json = true;
    } else if (a === '--input') {
      input = args[++i];
    } else if (a.startsWith('--input=')) {
      input = a.slice('--input='.length);
    } else if (a === '--out') {
      out = args[++i];
    } else if (a.startsWith('--out=')) {
      out = a.slice('--out='.length);
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  return { subcommand: positional[0], positional: positional.slice(1), input, out, json, help };
}

// ─── Run resolution (pure, tested) ──────────────────────────────────────────

export interface ResolvedRun {
  runDir: string;
  inputFile: string;
  draftsDir: string;
}

/**
 * Resolve a run identifier to its directory, its skill-updates source file, and
 * its drafts output directory. An absolute or `./`-relative run is used as the
 * directory as-is; a bare id resolves under `<cwd>/.dogfood/runs/<id>`.
 */
export function resolveRun(
  run: string,
  opts: { cwd?: string; input?: string; out?: string } = {},
): ResolvedRun {
  const cwd = opts.cwd ?? process.cwd();
  const looksLikePath = isAbsolute(run) || run.startsWith('.') || run.includes('/');
  const runDir = looksLikePath ? resolve(cwd, run) : join(cwd, '.dogfood', 'runs', run);
  const inputFile = opts.input ? resolve(cwd, opts.input) : join(runDir, 'skill-updates.json');
  const draftsDir = opts.out ? resolve(cwd, opts.out) : join(runDir, 'drafts');
  return { runDir, inputFile, draftsDir };
}

/** Extract the SkillUpdate array from a run's parsed JSON payload. */
export function extractSkillUpdates(payload: unknown): SkillUpdate[] {
  if (Array.isArray(payload)) return payload as SkillUpdate[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { skillUpdates?: unknown }).skillUpdates)) {
    return (payload as { skillUpdates: SkillUpdate[] }).skillUpdates;
  }
  throw new Error('skill-updates JSON must be a SkillUpdate[] or an object with a skillUpdates array');
}

// ─── Subcommand handlers ────────────────────────────────────────────────────

async function handlePromote(run: string | undefined, parsed: ParsedDogfoodArgs): Promise<number> {
  if (!run) {
    p.log.error('Usage: skill-creator dogfood promote <run> [--input <file>] [--out <dir>]');
    return 1;
  }
  const { runDir, inputFile, draftsDir } = resolveRun(run, { input: parsed.input, out: parsed.out });
  if (!existsSync(inputFile)) {
    p.log.error(`No skill-updates source at ${inputFile}`);
    p.log.message('Expected a run directory holding skill-updates.json, or pass --input <file>.');
    return 1;
  }

  let updates: SkillUpdate[];
  try {
    updates = extractSkillUpdates(JSON.parse(readFileSync(inputFile, 'utf8')));
  } catch (err) {
    p.log.error(`Failed to read skill updates: ${(err as Error).message}`);
    return 1;
  }

  let result;
  try {
    result = routeSkillUpdatesToDrafts(updates, { outputDir: draftsDir });
  } catch (err) {
    p.log.error(`Draft routing refused: ${(err as Error).message}`);
    return 1;
  }

  if (parsed.json) {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }

  p.log.message(pc.bold(`dogfood promote ${run}`));
  p.log.message(pc.dim(`  run:    ${runDir}`));
  p.log.message(pc.dim(`  drafts: ${result.outputDir}`));
  if (result.staged.length === 0) {
    p.log.info('No new drafts staged.');
  } else {
    p.log.success(`Staged ${result.staged.length} draft(s):`);
    for (const d of result.staged) {
      p.log.message(`  ${pc.green(d.skillName)} — ${d.skillFile}`);
    }
  }
  if (result.skipped.length > 0) {
    p.log.message(pc.dim(`  skipped ${result.skipped.length} update(s):`));
    for (const s of result.skipped) {
      p.log.message(pc.dim(`    ${s.skillName} (${s.action}) — ${s.reason}`));
    }
  }
  if (result.staged.length > 0) {
    p.log.message('');
    p.log.message('Review the drafts, then promote through the human ship gate:');
    p.log.message('  skill-creator skill ship <name>   (after moving a draft into .claude/skills/)');
  }
  return 0;
}

// ─── Help ───────────────────────────────────────────────────────────────────

function printDogfoodHelp(): void {
  p.log.message('');
  p.log.message(pc.bold('Dogfood — route refinement proposals into staged skill drafts'));
  p.log.message('');
  p.log.message('  Subcommands:');
  p.log.message(`    ${pc.cyan('dogfood promote <run>')}   Stage the run\'s 'create' updates as skill drafts`);
  p.log.message('');
  p.log.message('  Flags:');
  p.log.message('    --input <file>   Override the skill-updates.json source');
  p.log.message('    --out <dir>      Override the drafts output directory');
  p.log.message('    --json           Emit the machine-readable route result');
  p.log.message('');
  p.log.message('  Examples:');
  p.log.message('    skill-creator dogfood promote 2026-07-12-run');
  p.log.message('    skill-creator dogfood promote ./out/refine --json');
}

// ─── Entry point ────────────────────────────────────────────────────────────

/**
 * Dogfood CLI entry point.
 *
 * @param args - argument slice after `dogfood`
 * @returns exit code (0 success, non-zero failure)
 */
export async function dogfoodCommand(args: string[]): Promise<number> {
  const parsed = parseDogfoodArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printDogfoodHelp();
    return 0;
  }

  switch (parsed.subcommand) {
    case 'promote':
    case 'pr':
      return handlePromote(parsed.positional[0], parsed);
    default:
      p.log.error(`Unknown dogfood subcommand: ${parsed.subcommand}`);
      printDogfoodHelp();
      return 1;
  }
}

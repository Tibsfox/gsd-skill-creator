/**
 * Retro CLI command.
 *
 * Front door to the self-improvement retro engine (src/retro). Drives a
 * milestone retrospective end-to-end:
 *
 *   retro milestone [--since <sha>] [--out <path>] [--changelog <path>]
 *                   [--sessions <path>] [--name <n>] [--version <v>] [--json]
 *
 * Collects git metrics for the range, harvests session observations, runs the
 * pure driver (calibration deltas → action items → routing), renders
 * RETROSPECTIVE.md, and prints the routing plan (research / cartridge-distill /
 * skill-retire / memory-lesson).
 *
 * Impure boundary: git metrics via `execSync` (guarded by
 * `ensureProcessAllowed`), the changelog/observation reads, and the
 * RETROSPECTIVE.md write live here; the routing/rendering core is pure.
 *
 * @module cli/commands/retro
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  ensureProcessAllowed,
  type ProcessContext,
} from '../../security/process-context.js';
import type { MilestoneMetrics } from '../../retro/types.js';
import { harvestObservations } from '../../retro/observation-harvester.js';
import { runChangelogWatch } from '../../retro/changelog-watch.js';
import { runRetroMilestone, summarizeRouting } from '../../retro/driver.js';

// ─── Argument parsing (pure, tested) ────────────────────────────────────────

export interface ParsedRetroArgs {
  subcommand: string | undefined;
  since?: string;
  out?: string;
  changelog?: string;
  sessions?: string;
  name?: string;
  version?: string;
  json: boolean;
  help: boolean;
}

function takeValue(args: string[], i: number, flag: string): string | undefined {
  const a = args[i]!;
  if (a === flag) return args[i + 1];
  if (a.startsWith(`${flag}=`)) return a.slice(flag.length + 1);
  return undefined;
}

/**
 * Parse the argument slice after `retro`. Recognises `--since`, `--out`,
 * `--changelog`, `--sessions`, `--name`, `--version` (each with a `--flag=value`
 * form), plus `--json` and `--help`/`-h`.
 */
export function parseRetroArgs(args: string[]): ParsedRetroArgs {
  const positional: string[] = [];
  let since: string | undefined;
  let out: string | undefined;
  let changelog: string | undefined;
  let sessions: string | undefined;
  let name: string | undefined;
  let version: string | undefined;
  let json = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--json') {
      json = true;
    } else if (a === '--since' || a.startsWith('--since=')) {
      const v = takeValue(args, i, '--since');
      if (a === '--since') i++;
      since = v;
    } else if (a === '--out' || a.startsWith('--out=')) {
      const v = takeValue(args, i, '--out');
      if (a === '--out') i++;
      out = v;
    } else if (a === '--changelog' || a.startsWith('--changelog=')) {
      const v = takeValue(args, i, '--changelog');
      if (a === '--changelog') i++;
      changelog = v;
    } else if (a === '--sessions' || a.startsWith('--sessions=')) {
      const v = takeValue(args, i, '--sessions');
      if (a === '--sessions') i++;
      sessions = v;
    } else if (a === '--name' || a.startsWith('--name=')) {
      const v = takeValue(args, i, '--name');
      if (a === '--name') i++;
      name = v;
    } else if (a === '--ver' || a.startsWith('--ver=')) {
      const v = takeValue(args, i, '--ver');
      if (a === '--ver') i++;
      version = v;
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  return {
    subcommand: positional[0],
    since,
    out,
    changelog,
    sessions,
    name,
    version,
    json,
    help,
  };
}

// ─── Git metric collection (impure, guarded) ────────────────────────────────

function git(cmd: string, ctx?: ProcessContext): string {
  ensureProcessAllowed(ctx, 'cli/commands/retro', 'exec', 'git', cmd.split(' '));
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

/**
 * Build a MilestoneMetrics snapshot from git for the range since `sinceSha`.
 *
 * Bounded first cut: derives commit count and source LOC (net insertions) from
 * git. Fields that git cannot supply (token usage, phases, plans, tests,
 * requirements, timings) default to 0 — populate them from pipeline reports in
 * a follow-up. `estimatedWallTime` may be threaded through for calibration.
 */
export function collectGitMetrics(
  opts: { since?: string; name: string; version: string; estimatedWallTimeMinutes?: number },
  ctx?: ProcessContext,
): MilestoneMetrics {
  const range = opts.since ? `${opts.since}..HEAD` : 'HEAD~40..HEAD';
  const log = git(`log --oneline ${range}`, ctx);
  const commits = log ? log.split('\n').filter(Boolean).length : 0;

  const shortstat = git(`diff --shortstat ${range}`, ctx);
  const insertions = /(\d+) insertion/.exec(shortstat)?.[1];
  const sourceLoc = insertions ? parseInt(insertions, 10) : 0;

  return {
    milestone_name: opts.name,
    milestone_version: opts.version,
    completion_date: new Date().toISOString().slice(0, 10),
    wall_time_minutes: 0,
    estimated_wall_time_minutes: opts.estimatedWallTimeMinutes ?? 0,
    total_tokens: 0,
    opus_tokens: 0,
    sonnet_tokens: 0,
    haiku_tokens: 0,
    context_windows: 0,
    sessions: 0,
    phases: 0,
    plans: 0,
    commits,
    tests_written: 0,
    tests_passing: 0,
    requirements_total: 0,
    requirements_met: 0,
    source_loc: sourceLoc,
  };
}

// ─── Handler ────────────────────────────────────────────────────────────────

async function handleMilestone(parsed: ParsedRetroArgs): Promise<number> {
  const name = parsed.name ?? 'Milestone Retrospective';
  const version = parsed.version ?? 'unversioned';

  const metrics = collectGitMetrics({ since: parsed.since, name, version });

  const sessionsPath =
    parsed.sessions ?? join(process.cwd(), '.planning', 'sessions', 'current.jsonl');
  const observations = harvestObservations(sessionsPath);

  let changelog;
  if (parsed.changelog && existsSync(parsed.changelog)) {
    const text = readFileSync(parsed.changelog, 'utf-8');
    changelog = runChangelogWatch({ changelogText: text });
  }

  const result = runRetroMilestone({ metrics, changelog, observations });

  const outPath = resolve(parsed.out ?? join(process.cwd(), 'RETROSPECTIVE.md'));
  writeFileSync(outPath, result.markdown);

  const routingSummary = summarizeRouting(result.routedActions);

  if (parsed.json) {
    console.log(
      JSON.stringify(
        {
          output: outPath,
          commits: metrics.commits,
          source_loc: metrics.source_loc,
          action_items: result.data.action_items.length,
          routing: routingSummary,
          routed: result.routedActions.map((r) => ({
            verb: r.verb,
            target: r.target,
            source: r.item.source,
            priority: r.item.priority,
          })),
        },
        null,
        2,
      ),
    );
    return 0;
  }

  p.log.success(`Wrote ${outPath}`);
  p.log.message(
    `  ${metrics.commits} commits, ${metrics.source_loc} LOC, ${result.data.action_items.length} action items`,
  );
  p.log.message(pc.bold('  Routing plan:'));
  for (const [verb, count] of Object.entries(routingSummary)) {
    p.log.message(`    ${pc.cyan(verb)}: ${count}`);
  }
  const lessons = result.routedActions.filter((r) => r.verb === 'memory-lesson');
  if (lessons.length > 0) {
    p.log.message(
      pc.dim(
        `  ${lessons.length} free-form item(s) routed to Knowledge Spine 'lesson' records ` +
          `(not the correction quarantine). Persisting to the live memory store is a follow-up.`,
      ),
    );
  }
  return 0;
}

// ─── Help ─────────────────────────────────────────────────────────────────

function printRetroHelp(): void {
  p.log.message('');
  p.log.message(pc.bold('Retro — milestone retrospective engine'));
  p.log.message('');
  p.log.message('  Subcommands:');
  p.log.message(
    `    ${pc.cyan('retro milestone [--since <sha>]')}   Generate RETROSPECTIVE.md + route action items`,
  );
  p.log.message('');
  p.log.message('  Flags:');
  p.log.message('    --since <sha>       git range start (default HEAD~40)');
  p.log.message('    --out <path>        output file (default ./RETROSPECTIVE.md)');
  p.log.message('    --changelog <path>  Claude Code changelog markdown to classify');
  p.log.message('    --sessions <path>   observe.mjs log (default .planning/sessions/current.jsonl)');
  p.log.message('    --name <n>          milestone display name');
  p.log.message('    --ver <v>           milestone version string');
  p.log.message('    --json              emit machine-readable result');
  p.log.message('');
  p.log.message('  Example:');
  p.log.message('    skill-creator retro milestone --since v1.49.1050 --name "v1.49.1051" --ver v1.49.1051');
}

// ─── Entry point ────────────────────────────────────────────────────────────

/**
 * Retro CLI command entry point.
 *
 * @param args - argument slice after `retro`
 * @returns exit code (0 success, non-zero failure)
 */
export async function retroCommand(args: string[]): Promise<number> {
  const parsed = parseRetroArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printRetroHelp();
    return 0;
  }

  switch (parsed.subcommand) {
    case 'milestone':
    case 'ms':
      if (parsed.help) {
        printRetroHelp();
        return 0;
      }
      try {
        return await handleMilestone(parsed);
      } catch (err) {
        p.log.error(`Retro milestone failed: ${(err as Error).message}`);
        return 1;
      }
    default:
      p.log.error(`Unknown retro subcommand: ${parsed.subcommand}`);
      printRetroHelp();
      return 1;
  }
}

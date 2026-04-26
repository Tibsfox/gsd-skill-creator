/**
 * ME-3 Skill A/B Harness — CLI entry point.
 *
 * Implements `skill-creator ab <skill> --variant=<file> [--samples=<n>] [--alpha=<p>]`
 *
 * Subcommands:
 *   ab <skill> --variant=<file>   Run a full A/B comparison (fork → explore → decide).
 *   ab status [--branch=<id>]     Show status of a running or completed experiment.
 *   ab list                       List all experiments in the branches directory.
 *
 * Feature flag (SC-ME3-01):
 *   When the harness is disabled, all subcommands print a 'disabled' message
 *   and exit cleanly (exit code 0).  No M4 state is modified.
 *
 * Flags:
 *   --variant=<path>    Path to the variant B skill body file.
 *   --trunk=<path>      Path to the trunk skill file (read + write target).
 *   --samples=<n>       Per-variant sample count override.
 *   --alpha=<p>         Significance threshold (default 0.10).
 *   --tractability=<c>  tractable | unknown | coin-flip (default: unknown).
 *   --branch=<id>       Branch ID for 'status' subcommand.
 *   --branches-dir=<d>  Override branches root directory.
 *   --dry-run           Print what would happen; do not modify state.
 *
 * Zero external dependencies beyond Node.js stdlib.
 *
 * Phase 671, Wave R8 (ME-3).
 *
 * @module ab-harness/cli
 */

import { promises as fs } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { isABHarnessEnabled, disabledMessage } from './settings.js';
import { runAB, type ABVerdict } from './coordinator.js';
import { getExperimentStatus, listExperiments } from './api.js';
import { sampleSizeTable } from './sample-size.js';
import type { TractabilityClass } from '../tractability/selector-api.js';

// ─── Flag parsers (shared pattern from src/cli.ts) ───────────────────────────

function parseFlag(args: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const eq = args.find(a => a.startsWith(prefix));
  if (eq) {
    const v = eq.slice(prefix.length);
    return v || undefined;
  }
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) {
    const v = args[idx + 1]!;
    if (v && !v.startsWith('-')) return v;
  }
  return undefined;
}

function parseTractability(raw: string | undefined): TractabilityClass {
  if (raw === 'tractable' || raw === 'coin-flip') return raw;
  return 'unknown';
}

// ─── Main CLI handler ─────────────────────────────────────────────────────────

/**
 * Handle `skill-creator ab [subcommand] [args]`.
 *
 * @param args — argv slice after 'ab' (i.e. `process.argv.slice(3)` typical usage).
 * @returns exit code (0 = success, 1 = error).
 */
export async function abCommand(args: string[]): Promise<number> {
  // Feature flag check — all paths go through this.
  if (!isABHarnessEnabled()) {
    console.log(disabledMessage());
    return 0;
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'status':
      return runStatus(args.slice(1));
    case 'list':
      return runList(args.slice(1));
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      return 0;
    default:
      // Default: treat first positional arg as skill name and run the full cycle.
      return runFull(args);
  }
}

// ─── 'ab <skill>' — full A/B cycle ───────────────────────────────────────────

async function runFull(args: string[]): Promise<number> {
  const skillName = args.filter(a => !a.startsWith('-'))[0];
  if (!skillName) {
    console.error('Usage: skill-creator ab <skill-name> --variant=<file> [options]');
    return 1;
  }

  const variantFile = parseFlag(args, '--variant');
  if (!variantFile) {
    console.error('--variant=<path> is required.');
    return 1;
  }

  const trunkFile = parseFlag(args, '--trunk') ?? `.claude/skills/${skillName}/SKILL.md`;
  const samplesStr = parseFlag(args, '--samples');
  const alphaStr = parseFlag(args, '--alpha');
  const tractRaw = parseFlag(args, '--tractability');
  const branchesDir = parseFlag(args, '--branches-dir');
  const dryRun = args.includes('--dry-run');

  const tractability = parseTractability(tractRaw);
  const alpha = alphaStr !== undefined ? parseFloat(alphaStr) : 0.10;
  const samplesPerVariant = samplesStr !== undefined ? parseInt(samplesStr, 10) : undefined;

  // Read trunk and variant bodies.
  let trunkBody: string;
  let variantBody: string;
  try {
    trunkBody = await fs.readFile(resolvePath(process.cwd(), trunkFile), 'utf8');
  } catch (err) {
    console.error(`Cannot read trunk file '${trunkFile}': ${String(err)}`);
    return 1;
  }
  try {
    variantBody = await fs.readFile(resolvePath(process.cwd(), variantFile), 'utf8');
  } catch (err) {
    console.error(`Cannot read variant file '${variantFile}': ${String(err)}`);
    return 1;
  }

  if (dryRun) {
    const table = sampleSizeTable(alpha, 0);
    console.log('[dry-run] A/B experiment would run:');
    console.log(`  skill:         ${skillName}`);
    console.log(`  trunk:         ${trunkFile}`);
    console.log(`  variant:       ${variantFile}`);
    console.log(`  tractability:  ${tractability}`);
    console.log(`  alpha:         ${alpha}`);
    console.log(`  samples/var:   ${samplesPerVariant ?? table[tractability]}`);
    console.log('');
    console.log('Sample-size table at current alpha:');
    console.log(`  tractable:  ${table.tractable}`);
    console.log(`  unknown:    ${table.unknown}`);
    console.log(`  coin-flip:  ${table['coin-flip']}`);
    return 0;
  }

  // Stub runner: in production the caller would supply a real skill executor.
  // The CLI exposes the harness infrastructure; real execution is wired by the
  // skill-runner layer (out of ME-3 scope).  We use a stub that scores based on
  // parse float of the skill body length (functional placeholder).
  const runSkill = async (body: string, _idx: number, variant: 'A' | 'B'): Promise<string> => {
    // Stub: returns body length as score.  Real runners are injected by callers
    // of the coordinator directly; the CLI stub is for integration testing only.
    void variant;
    return String(body.length);
  };

  console.log(`Running A/B experiment for '${skillName}'...`);
  console.log(`  tractability: ${tractability}, alpha: ${alpha}`);

  const result = await runAB({
    skillName,
    trunkBody,
    variantBody,
    trunkPath: resolvePath(process.cwd(), trunkFile),
    tractability,
    samplesPerVariant,
    alpha,
    branchesDir,
    runSkill,
    settings: { enabled: true },
    // JP-010a — first real caller seed (v1.49.578). The CLI doesn't know
    // the user's domain or expertise; we record what we can — session-type
    // (CI vs interactive), the caller surface, and the skill's tractability
    // class. Richer callers can supply userDomain / expertiseLevel directly.
    kAxes: {
      userDomain: 'unknown',
      expertiseLevel: 'unknown',
      sessionType: process.env.CI ? 'ci' : 'interactive',
      extraAxes: {
        caller: 'ab-harness-cli',
        tractability,
      },
    },
  });

  if (result.status === 'disabled') {
    console.log(disabledMessage());
    return 0;
  }
  if (result.status === 'error') {
    console.error(`A/B experiment failed: ${result.error}`);
    return 1;
  }

  printVerdict(result.verdict, result.committed);
  return 0;
}

// ─── 'ab status' ─────────────────────────────────────────────────────────────

async function runStatus(args: string[]): Promise<number> {
  const branchId = args.filter(a => !a.startsWith('-'))[0] ?? parseFlag(args, '--branch');
  const branchesDir = parseFlag(args, '--branches-dir');

  if (!branchId) {
    console.error('Usage: skill-creator ab status <branch-id> [--branches-dir=<dir>]');
    return 1;
  }

  const result = await getExperimentStatus(branchId, branchesDir);

  if (result.status === 'not-found') {
    console.log(`No A/B experiment state found for branch '${branchId}'.`);
    return 0;
  }
  if (result.status === 'error') {
    console.error(`Error reading experiment state: ${result.error}`);
    return 1;
  }

  const s = result.state;
  console.log(`A/B Experiment: ${s.skillName} (branch: ${s.branchId})`);
  console.log(`  started:      ${new Date(s.startedAt).toISOString()}`);
  console.log(`  samples/var:  ${s.samplesPerVariant}`);
  console.log(`  outcomes:     ${s.outcomes.length} total`);
  console.log(`  resolved:     ${s.resolved}`);
  if (s.resolution) console.log(`  resolution:   ${s.resolution}`);
  if (s.latestVerdict) {
    printVerdict(s.latestVerdict, s.resolution === 'committed');
  }
  return 0;
}

// ─── 'ab list' ───────────────────────────────────────────────────────────────

async function runList(args: string[]): Promise<number> {
  const branchesDir = parseFlag(args, '--branches-dir');
  const experiments = await listExperiments(branchesDir);

  if (experiments.length === 0) {
    console.log('No A/B experiments found.');
    return 0;
  }

  console.log(`Found ${experiments.length} A/B experiment(s):`);
  for (const { branchId, state } of experiments) {
    const decLabel = state.latestVerdict?.decision ?? 'pending';
    console.log(
      `  ${branchId.slice(0, 8)}  ${state.skillName.padEnd(30)}  ${decLabel}  ` +
      `${state.resolved ? 'resolved' : 'running'}`,
    );
  }
  return 0;
}

// ─── Print helpers ────────────────────────────────────────────────────────────

function printVerdict(verdict: ABVerdict, committed: boolean): void {
  const lines = [
    '',
    '── A/B Verdict ──────────────────────────────────────────────',
    `  decision:      ${verdict.decision}`,
    `  committed:     ${committed}`,
    `  sessions:      ${verdict.nRuns} (${verdict.nRuns / 2} per variant)`,
    `  mean delta:    ${isNaN(verdict.meanDelta) ? 'N/A' : verdict.meanDelta.toFixed(4)}`,
    `  sign p-value:  ${isNaN(verdict.signTest) ? 'N/A' : verdict.signTest.toFixed(4)}`,
    `  noise floor:   ${verdict.noiseFloor.toFixed(2)} (tractability: ${verdict.tractability})`,
    '─────────────────────────────────────────────────────────────',
  ];

  for (const line of lines) console.log(line);

  if (verdict.warnings.length > 0) {
    console.log('  warnings:');
    for (const w of verdict.warnings) console.log(`    - ${w}`);
  }
  console.log('');
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
skill-creator ab — ME-3 Skill A/B Harness

Usage:
  skill-creator ab <skill-name> --variant=<file> [options]
  skill-creator ab status <branch-id> [--branches-dir=<dir>]
  skill-creator ab list [--branches-dir=<dir>]

Options:
  --variant=<path>       Path to the variant B skill body file (required for run).
  --trunk=<path>         Trunk skill file (default: .claude/skills/<skill>/SKILL.md).
  --samples=<n>          Per-variant sample count (default: auto from tractability).
  --alpha=<p>            Significance threshold (default: 0.10).
  --tractability=<c>     tractable | unknown | coin-flip (default: unknown).
  --branches-dir=<dir>   Override branches root directory.
  --dry-run              Print plan without modifying state.
  -h, --help             Show this help.

Verdicts:
  commit-B           Variant B is significantly better; branch committed to trunk.
  keep-A             Variant A is better or sign test disagrees; branch aborted.
  coin-flip          Delta within noise floor; comparison is uninformative.
  insufficient-data  Fewer than 10 samples per variant; cannot test.

Feature flag:
  The harness is OFF by default. Enable via SC_AB_HARNESS_ENABLED=1 or settings.
`);
}

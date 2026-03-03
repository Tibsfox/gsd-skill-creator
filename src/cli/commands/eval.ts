/**
 * CLI command for running and viewing skill evaluation benchmarks.
 *
 * Provides subcommands to run multi-model benchmark comparisons and display
 * results with model filtering and JSON export:
 *
 *   skill-creator eval view <skill>                  -- Show multi-model summary table
 *   skill-creator eval view <skill> --model=NAME     -- Filter to single model detail
 *   skill-creator eval view <skill> --json           -- JSON output (all models)
 *   skill-creator eval view <skill> --json --model=X -- JSON output (one model)
 *   skill-creator eval help                          -- Show usage
 *
 * Follows the pattern from src/cli/commands/chip.ts: hasFlag/parseFlag helpers,
 * picocolors for terminal output, subcommand switch, --json flag.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { createChipRegistry } from '../../chips/chip-registry.js';
import { ChipTestRunner } from '../../chips/chip-test-runner.js';
import { ThresholdsConfigLoader } from '../../eval/thresholds-config.js';
import { MultiModelBenchmarkRunner } from '../../eval/multi-model-benchmark.js';
import { EvalViewer } from '../../eval/eval-viewer.js';
import { TestStore } from '../../testing/test-store.js';
import { ResultStore } from '../../testing/result-store.js';
import { SkillStore } from '../../storage/skill-store.js';
import { parseScope, getSkillsBasePath } from '../../types/scope.js';

// ============================================================================
// Flag Parsing Helpers
// ============================================================================

/**
 * Check if a boolean flag is present.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(
    (flag) => args.includes(`--${flag}`) || args.includes(`-${flag.charAt(0)}`)
  );
}

/**
 * Get value of a named flag (e.g., --model=ollama -> 'ollama').
 */
function parseFlag(args: string[], ...flags: string[]): string | undefined {
  for (const flag of flags) {
    const arg = args.find((a) => a.startsWith(`--${flag}=`));
    if (arg) {
      return arg.slice(`--${flag}=`.length);
    }
  }
  return undefined;
}

/**
 * Get non-flag arguments from args array.
 */
function getNonFlagArgs(args: string[]): string[] {
  return args.filter((a) => !a.startsWith('-'));
}

// ============================================================================
// View subcommand
// ============================================================================

/**
 * Handle 'eval view <skill>' -- run benchmarks and display results.
 *
 * With chips configured: runs MultiModelBenchmarkRunner across all chips.
 * Without chips: shows "no chips configured" message and returns 0.
 */
async function handleView(args: string[]): Promise<number> {
  const jsonMode = hasFlag(args, 'json');
  const modelFilter = parseFlag(args, 'model');
  const nonFlagArgs = getNonFlagArgs(args);

  // First non-flag arg after 'view' is the skill name
  const skillName = nonFlagArgs[0];

  if (!skillName) {
    p.log.error('Usage: skill-creator eval view <skill> [--model=NAME] [--json]');
    return 1;
  }

  // Parse scope (default: user)
  const scope = parseScope(args);
  const basePath = getSkillsBasePath(scope);

  // Load chip registry
  const registry = createChipRegistry();
  await registry.loadFromFile();

  if (!registry.isConfigured()) {
    if (jsonMode) {
      console.log(JSON.stringify({
        configured: false,
        message: 'No chipset.json found. Configure chips to run multi-model benchmarks.',
        skillName,
      }, null, 2));
    } else {
      p.log.warn('No chipset.json found. Chips are optional.');
      p.log.message('Configure chipset.json to run multi-model benchmarks.');
      p.log.message(`Skill: ${pc.cyan(skillName)}`);
      p.log.message(pc.dim('Run `skill-creator chip status` to check chip configuration.'));
    }
    return 0;
  }

  const chipNames = registry.list();

  // Set up stores and runners
  const testStore = new TestStore(scope);
  const skillStore = new SkillStore(basePath);
  const resultStore = new ResultStore(scope);
  const chipTestRunner = new ChipTestRunner(registry, testStore, skillStore, resultStore, scope);
  const thresholdsLoader = new ThresholdsConfigLoader();
  const benchmarkRunner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

  const spin = jsonMode ? null : p.spinner();
  spin?.start(`Running benchmarks for ${pc.bold(skillName)} across ${chipNames.length} chip(s)...`);

  let benchmark;
  try {
    benchmark = await benchmarkRunner.benchmarkSkill(skillName, chipNames);
  } catch (err) {
    spin?.stop('Benchmark failed');
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(`Benchmark failed: ${message}`);
    return 1;
  }

  spin?.stop('Benchmarks complete');

  // Format and output
  const viewer = new EvalViewer();

  if (jsonMode) {
    console.log(viewer.formatJSON(benchmark, modelFilter));
  } else if (modelFilter !== undefined) {
    console.log(viewer.formatModelDetail(benchmark, modelFilter));
  } else {
    console.log(viewer.formatMultiModelSummary(benchmark));
  }

  return 0;
}

// ============================================================================
// Help
// ============================================================================

function evalHelp(): string {
  return `
${pc.bold('skill-creator eval')} -- Run and view skill evaluation benchmarks

${pc.bold('Usage:')}
  skill-creator eval <subcommand> [options]

${pc.bold('Subcommands:')}
  view <skill>    Run benchmarks across all configured chips and display results

${pc.bold('Options:')}
  --model=NAME    Filter results to a single model (detail view)
  --json          Output as JSON (machine-readable)
  --scope=SCOPE   Skill scope: user | project (default: user)

${pc.bold('Examples:')}
  skill-creator eval view my-skill
  skill-creator eval view my-skill --model=ollama
  skill-creator eval view my-skill --json
  skill-creator eval view my-skill --json --model=ollama
`.trim();
}

// ============================================================================
// Main entry point
// ============================================================================

/**
 * Handle 'eval' command with subcommand dispatch.
 *
 * @param args - Arguments after 'eval' (e.g. ['view', 'my-skill', '--json'])
 * @returns Exit code (0 = success, 1 = error)
 */
export async function evalCommand(args: string[]): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const subcommand = nonFlagArgs[0];

  // Help flag
  if (hasFlag(args, 'help', 'h') || subcommand === 'help') {
    console.log(evalHelp());
    return 0;
  }

  switch (subcommand) {
    case 'view':
      return handleView(args.slice(1));

    case undefined:
    case '':
      // No subcommand: show help
      console.log(evalHelp());
      return 0;

    default:
      p.log.error(`Unknown eval subcommand: ${subcommand}`);
      p.log.message('');
      console.log(evalHelp());
      return 1;
  }
}

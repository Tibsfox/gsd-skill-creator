/**
 * CLI command for generating the GSD Planning Docs Dashboard.
 *
 * Usage:
 *   skill-creator dashboard [generate] [--output <dir>] [--force] [--help]
 *   skill-creator db [generate] [--output <dir>] [--force] [--help]
 *
 * Subcommands:
 *   generate (default)  Generate dashboard HTML from .planning/ artifacts
 *
 * Options:
 *   --output, -o <dir>  Output directory (default: dashboard/)
 *   --planning, -p <dir>  Planning directory (default: .planning/)
 *   --force, -f         Overwrite existing files without warning
 *   --help, -h          Show help
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { generate } from '../../dashboard/generator.js';
import type { GenerateOptions } from '../../dashboard/generator.js';

/**
 * Parse a flag value from args. Handles both --flag value and -f value forms.
 */
function parseFlagValue(
  args: string[],
  longFlag: string,
  shortFlag?: string,
): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === longFlag || (shortFlag && args[i] === shortFlag)) {
      return args[i + 1];
    }
  }
  return undefined;
}

/**
 * Check if a boolean flag is present.
 */
function hasFlag(args: string[], longFlag: string, shortFlag?: string): boolean {
  return args.includes(longFlag) || (shortFlag ? args.includes(shortFlag) : false);
}

function showHelp(): void {
  console.log(`
skill-creator dashboard - Generate GSD Planning Docs Dashboard

Usage:
  skill-creator dashboard [generate] [options]
  skill-creator db [generate] [options]

Subcommands:
  generate (default)    Generate dashboard HTML from .planning/ artifacts

Options:
  --output, -o <dir>    Output directory (default: dashboard/)
  --planning <dir>      Planning directory (default: .planning/)
  --force, -f           Overwrite existing files without warning
  --help, -h            Show this help message

Examples:
  skill-creator dashboard                     Generate with defaults
  skill-creator dashboard generate            Same as above
  skill-creator db -o /tmp/docs               Generate to custom dir
  skill-creator dashboard --planning .plan/   Use alternate planning dir
`);
}

export async function dashboardCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (hasFlag(args, '--help', '-h')) {
    showHelp();
    return 0;
  }

  // Determine subcommand — default to 'generate'
  const subcommand = args.find((a) => !a.startsWith('-')) ?? 'generate';

  if (subcommand !== 'generate') {
    p.log.error(`Unknown subcommand: ${subcommand}`);
    showHelp();
    return 1;
  }

  // Parse options
  const outputDir = parseFlagValue(args, '--output', '-o') ?? 'dashboard';
  const planningDir = parseFlagValue(args, '--planning') ?? '.planning';
  const force = hasFlag(args, '--force', '-f');

  const options: GenerateOptions = {
    planningDir,
    outputDir,
    force,
  };

  p.intro(pc.bold('GSD Dashboard Generator'));

  p.log.info(`Planning dir: ${pc.dim(planningDir)}`);
  p.log.info(`Output dir:   ${pc.dim(outputDir)}`);

  const result = await generate(options);

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      p.log.error(error);
    }
    if (result.pages.length === 0) {
      p.log.error('No pages generated.');
      return 1;
    }
  }

  p.log.success(
    `Generated ${result.pages.length} page(s) in ${result.duration.toFixed(0)}ms`,
  );

  for (const page of result.pages) {
    p.log.message(`  ${pc.green('+')} ${page}`);
  }

  return 0;
}

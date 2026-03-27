/**
 * CLI command for generating the GSD Planning Docs Dashboard.
 *
 * Usage:
 *   skill-creator dashboard [generate] [--output <dir>] [--force] [--live] [--watch] [--help]
 *   skill-creator db [generate] [--output <dir>] [--force] [--live] [--watch] [--help]
 *
 * Subcommands:
 *   generate (default)  Generate dashboard HTML from .planning/ artifacts
 *   clean               Remove generated HTML files and build manifest
 *
 * Options:
 *   --output, -o <dir>    Output directory (default: dashboard/)
 *   --planning, -p <dir>  Planning directory (default: .planning/)
 *   --force, -f           Overwrite existing files without warning
 *   --live, -l            Inject auto-refresh script into pages
 *   --refresh-interval <ms>  Auto-refresh interval in ms (default: 5000)
 *   --watch, -w           Watch .planning/ for changes and regenerate
 *   --watch-interval <ms> File polling interval in ms (default: 3000)
 *   --help, -h            Show help
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { generate } from '../../dashboard/generator.js';
import type { GenerateOptions } from '../../dashboard/generator.js';
import { MANIFEST_FILENAME } from '../../dashboard/incremental.js';
import { stat, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

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
  clean                 Remove generated HTML files and build manifest

Options:
  --output, -o <dir>        Output directory (default: dashboard/)
  --planning <dir>          Planning directory (default: .planning/)
  --force, -f               Overwrite existing files without warning
  --live, -l                Inject auto-refresh script into pages
  --refresh-interval <ms>   Auto-refresh interval in ms (default: 5000)
  --watch, -w               Watch .planning/ for changes and regenerate
  --watch-interval <ms>     File polling interval in ms (default: 3000)
  --help, -h                Show this help message

Examples:
  skill-creator dashboard                     Generate with defaults
  skill-creator dashboard generate            Same as above
  skill-creator db -o /tmp/docs               Generate to custom dir
  skill-creator dashboard --planning .plan/   Use alternate planning dir
  skill-creator dashboard --live --watch      Live-refresh with file watching
  skill-creator dashboard --watch -f          Force-rebuild on every watch cycle
  skill-creator dashboard clean               Remove generated files
  skill-creator db clean -o /tmp/docs         Clean custom output dir
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

  if (subcommand === 'clean') {
    const outputDir = parseFlagValue(args, '--output', '-o') ?? 'dashboard';
    return runClean(outputDir);
  }

  if (subcommand !== 'generate') {
    p.log.error(`Unknown subcommand: ${subcommand}`);
    showHelp();
    return 1;
  }

  // Parse options
  const outputDir = parseFlagValue(args, '--output', '-o') ?? 'dashboard';
  const planningDir = parseFlagValue(args, '--planning') ?? '.planning';
  const force = hasFlag(args, '--force', '-f');
  const live = hasFlag(args, '--live', '-l');
  const watch = hasFlag(args, '--watch', '-w');
  const refreshIntervalStr = parseFlagValue(args, '--refresh-interval');
  const refreshInterval = refreshIntervalStr ? parseInt(refreshIntervalStr, 10) : undefined;
  const watchIntervalStr = parseFlagValue(args, '--watch-interval');
  const watchInterval = watchIntervalStr ? parseInt(watchIntervalStr, 10) : 3000;

  const options: GenerateOptions = {
    planningDir,
    outputDir,
    force,
    live: live || watch, // watch mode implies live refresh
    refreshInterval,
  };

  p.intro(pc.bold('GSD Dashboard Generator'));

  p.log.info(`Planning dir: ${pc.dim(planningDir)}`);
  p.log.info(`Output dir:   ${pc.dim(outputDir)}`);
  if (options.live) {
    p.log.info(`Live refresh: ${pc.dim(`${options.refreshInterval ?? 5000}ms`)}`);
  }

  // Run initial generation
  const code = await runGenerate(options);
  if (code !== 0 && !watch) return code;

  // Watch mode: poll for changes and regenerate
  if (watch) {
    p.log.info(`Watching ${pc.dim(planningDir)} every ${pc.dim(`${watchInterval}ms`)} (Ctrl+C to stop)`);

    let lastMtime = await getLatestMtime(planningDir);

    const interval = setInterval(async () => {
      try {
        const currentMtime = await getLatestMtime(planningDir);
        if (currentMtime > lastMtime) {
          lastMtime = currentMtime;
          p.log.info('Change detected, regenerating...');
          await runGenerate(options);
        }
      } catch {
        // Ignore transient errors during watch polling
      }
    }, watchInterval);

    // Keep process alive; clean up on signals
    const cleanup = () => {
      clearInterval(interval);
      p.log.info('Watch mode stopped.');
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Block indefinitely
    await new Promise<never>(() => {});
  }

  return code;
}

/**
 * Remove all generated HTML files and the build manifest from the output directory.
 */
async function runClean(outputDir: string): Promise<number> {
  p.intro(pc.bold('GSD Dashboard Clean'));

  let removed = 0;

  try {
    const entries = await readdir(outputDir);
    for (const entry of entries) {
      if (entry.endsWith('.html') || entry === MANIFEST_FILENAME) {
        await rm(join(outputDir, entry), { force: true });
        p.log.message(`  ${pc.red('-')} ${entry}`);
        removed++;
      }
    }
  } catch {
    p.log.info(`Output directory not found: ${pc.dim(outputDir)}`);
    p.log.info('Nothing to clean.');
    return 0;
  }

  if (removed === 0) {
    p.log.info('No generated files found.');
  } else {
    p.log.success(`Removed ${removed} file(s) from ${pc.dim(outputDir)}`);
  }

  return 0;
}

/**
 * Run a single generation cycle and print results.
 */
async function runGenerate(options: GenerateOptions): Promise<number> {
  const result = await generate(options);

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      p.log.error(error);
    }
    if (result.pages.length === 0 && result.skipped.length === 0) {
      p.log.error('No pages generated.');
      return 1;
    }
  }

  if (result.pages.length > 0) {
    p.log.success(
      `Generated ${result.pages.length} page(s) in ${result.duration.toFixed(0)}ms`,
    );
    for (const page of result.pages) {
      p.log.message(`  ${pc.green('+')} ${page}`);
    }
  }

  if (result.skipped.length > 0) {
    p.log.info(`Skipped ${result.skipped.length} unchanged page(s)`);
    for (const page of result.skipped) {
      p.log.message(`  ${pc.dim('-')} ${page}`);
    }
  }

  if (result.pages.length === 0 && result.skipped.length > 0) {
    p.log.success(`All pages up to date (${result.duration.toFixed(0)}ms)`);
  }

  return 0;
}

/**
 * Get the latest modification time from key .planning/ files.
 */
async function getLatestMtime(planningDir: string): Promise<number> {
  const files = [
    'PROJECT.md',
    'REQUIREMENTS.md',
    'ROADMAP.md',
    'STATE.md',
    'MILESTONES.md',
  ];

  let latest = 0;
  for (const file of files) {
    try {
      const s = await stat(join(planningDir, file));
      if (s.mtimeMs > latest) {
        latest = s.mtimeMs;
      }
    } catch {
      // File may not exist — skip
    }
  }

  return latest;
}

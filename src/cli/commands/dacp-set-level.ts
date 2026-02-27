/**
 * CLI command for setting DACP fidelity level overrides.
 *
 * Writes manual fidelity overrides to ~/.gsd/dacp/config/fidelity-overrides.json.
 * Validates level is 0-3, creates config directory if needed.
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * @module cli/commands/dacp-set-level
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

// ============================================================================
// Help
// ============================================================================

function showDacpSetLevelHelp(): void {
  console.log(`
skill-creator dacp set-level - Set fidelity level override

Usage:
  skill-creator dacp set-level <pattern> <level> [options]
  skill-creator dp sl <pattern> <level> [options]

Sets a manual fidelity level override for a specific handoff pattern.
The override persists in ~/.gsd/dacp/config/fidelity-overrides.json.

Arguments:
  pattern    Handoff pattern (e.g., "planner->executor:task-assignment")
  level      Fidelity level (0, 1, 2, or 3)

Options:
  --quiet, -q  Machine-readable output
  --json       JSON output
  --help, -h   Show this help

Examples:
  skill-creator dacp set-level "planner->executor:task-assignment" 3
  skill-creator dp sl "planner->executor:task" 2 --json
`);
}

// ============================================================================
// Types
// ============================================================================

interface FidelityOverride {
  level: number;
  set_at: string;
  reason?: string;
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Set a fidelity level override for a pattern.
 *
 * @param args - Command-line arguments (after 'dacp set-level')
 * @returns Exit code (0 success, 1 error)
 */
export async function dacpSetLevelCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showDacpSetLevelHelp();
    return 0;
  }

  // Parse output mode flags
  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  // Extract positional arguments (non-flag args)
  const positionalArgs = args.filter((a) => !a.startsWith('-'));

  if (positionalArgs.length < 2) {
    if (!quiet) {
      console.error(
        'Usage: skill-creator dacp set-level <pattern> <level>',
      );
    }
    return 1;
  }

  const pattern = positionalArgs[0];
  const levelStr = positionalArgs[1];

  // Validate level
  const parsedLevel = parseInt(levelStr, 10);
  if (isNaN(parsedLevel) || parsedLevel < 0 || parsedLevel > 3) {
    if (json) {
      console.log(
        JSON.stringify({
          error: `Invalid fidelity level: ${levelStr}. Must be 0-3.`,
        }),
      );
    } else if (!quiet) {
      p.log.error(
        `Invalid fidelity level: ${levelStr}. Must be 0, 1, 2, or 3.`,
      );
    }
    return 1;
  }

  // Define file paths
  const overridesPath = join(
    homedir(),
    '.gsd',
    'dacp',
    'config',
    'fidelity-overrides.json',
  );
  const configDir = dirname(overridesPath);

  // Create config directory if needed
  await mkdir(configDir, { recursive: true });

  // Read existing overrides
  let overrides: Record<string, FidelityOverride> = {};
  try {
    const content = await readFile(overridesPath, 'utf-8');
    overrides = JSON.parse(content) as Record<string, FidelityOverride>;
  } catch {
    // File doesn't exist, start from empty
  }

  // Add/update override
  const setAt = new Date().toISOString();
  overrides[pattern] = { level: parsedLevel, set_at: setAt };

  // Write back
  await writeFile(overridesPath, JSON.stringify(overrides, null, 2), 'utf-8');

  // JSON output
  if (json) {
    console.log(
      JSON.stringify(
        { pattern, level: parsedLevel, set_at: setAt },
        null,
        2,
      ),
    );
    return 0;
  }

  // Quiet output
  if (quiet) {
    console.log(`${pattern},${parsedLevel}`);
    return 0;
  }

  // Text output
  p.log.success(
    `Set fidelity level for ${pc.bold(pattern)} to ${pc.cyan(`Level ${parsedLevel}`)}`,
  );
  p.log.message(
    pc.dim(`Override persisted to ${overridesPath}`),
  );

  return 0;
}

/**
 * CLI command handler for `sc install <url>`.
 *
 * Parses command-line arguments and delegates to the install workflow.
 * Outputs human-readable success/error reports.
 *
 * Requirements: INSTALL-01
 */

import { install } from '../git/workflows/install.js';
import type { InstallOptions, InstallResult } from '../git/workflows/install.js';

/** Result returned by the CLI command handler. */
export interface CommandResult {
  success: boolean;
  message: string;
}

/**
 * Parse CLI arguments for the install command.
 *
 * Supports:
 *   sc install <url>
 *   sc install <url> --main-branch <name>
 *   sc install <url> --dev-branch <name>
 *
 * @param args - Raw CLI arguments after `sc install`
 * @returns The parsed URL and options
 * @throws Error if no URL is provided
 */
function parseArgs(args: string[]): { url: string; options: InstallOptions } {
  if (args.length === 0 || !args[0] || args[0].startsWith('--')) {
    throw new Error('URL is required. Usage: sc install <url> [--main-branch <name>] [--dev-branch <name>]');
  }

  const url = args[0];
  const options: InstallOptions = {};

  for (let i = 1; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];

    if (flag === '--main-branch' && value) {
      options.mainBranch = value;
      i++; // skip the value
    } else if (flag === '--dev-branch' && value) {
      options.devBranch = value;
      i++; // skip the value
    }
  }

  return { url, options };
}

/**
 * Format a success message for display.
 */
function formatSuccess(result: InstallResult): string {
  if (result.alreadyInstalled) {
    return [
      `Repository "${result.repoName}" is already installed.`,
      `  Path: ${result.repoPath}`,
      '',
      'Use `sc git sync` to update from upstream.',
    ].join('\n');
  }

  const config = result.config;
  const lines = [
    `[ok] Installed "${result.repoName}" successfully.`,
    '',
    `  Path:       ${result.repoPath}`,
  ];

  if (config) {
    lines.push(
      `  Branch:     ${config.devBranch} (from ${config.mainBranch})`,
      `  Remotes:    origin -> ${config.origin}`,
      `              upstream -> ${config.upstream}`,
      `  Safety:     push.default=nothing`,
      `  Gates:      merge-to-main=${config.gates.mergeToMain ? 'on' : 'off'}, pr-to-upstream=${config.gates.prToUpstream ? 'on' : 'off'}`,
    );
  }

  lines.push(
    '',
    'Next steps:',
    '  cd ' + result.repoPath,
    '  sc git sync          # fetch latest from upstream',
    '  sc git branch feature/my-change   # create a feature branch',
  );

  return lines.join('\n');
}

/**
 * Format an error message for display.
 */
function formatError(result: InstallResult): string {
  return [
    `[error] Install failed for "${result.repoName ?? 'unknown'}".`,
    '',
    `  ${result.error}`,
    '',
    'Check that:',
    '  1. git is installed and available in PATH',
    '  2. The URL is correct and accessible',
    '  3. You have network connectivity',
  ].join('\n');
}

/**
 * Execute the `sc install <url>` CLI command.
 *
 * Parses arguments, runs the install workflow, and outputs a
 * human-readable report.
 *
 * @param args - Raw CLI arguments after `sc install`
 * @returns Command result with success status and formatted message
 * @throws Error if no URL argument provided
 */
export async function installCommand(args: string[]): Promise<CommandResult> {
  const { url, options } = parseArgs(args);

  const result = await install(url, options);

  if (result.success) {
    const message = formatSuccess(result);
    return { success: true, message };
  } else {
    const message = formatError(result);
    return { success: false, message };
  }
}

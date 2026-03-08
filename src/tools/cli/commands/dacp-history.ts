/**
 * CLI command for displaying DACP handoff history.
 *
 * Reads drift-scores.jsonl and filters by pattern, showing
 * drift scores, fidelity levels, and verification status.
 *
 * Three-tier output: text (styled table), quiet (CSV), JSON.
 *
 * @module cli/commands/dacp-history
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ============================================================================
// Help
// ============================================================================

function showDacpHistoryHelp(): void {
  console.log(`
skill-creator dacp history - Show handoff history for a pattern

Usage:
  skill-creator dacp history <pattern> [options]
  skill-creator dp h <pattern> [options]

Displays drift scores, fidelity levels, and verification status
for handoffs matching the given pattern.

Arguments:
  pattern      Handoff pattern to filter by (e.g., "planner->executor:schema-task")

Options:
  --last=N     Show only the last N entries (default: 10)
  --quiet, -q  Machine-readable CSV output
  --json       JSON output
  --help, -h   Show this help

Examples:
  skill-creator dacp history "planner->executor:schema-task"
  skill-creator dp h "planner->executor:schema-task" --last 5
  skill-creator dacp history "planner->executor:schema-task" --json
`);
}

// ============================================================================
// Types
// ============================================================================

interface DriftHistoryEntry {
  bundle_id: string;
  pattern: string;
  score: number;
  fidelity_level: number;
  recommendation: string;
  timestamp: string;
  intent_alignment?: number;
  rework_required?: boolean;
  tokens_spent_interpreting?: number;
  code_modifications?: number;
  verification_pass?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse JSONL content into array of entries.
 */
function parseJsonl(content: string): DriftHistoryEntry[] {
  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const entries: DriftHistoryEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line) as DriftHistoryEntry);
    } catch {
      // Skip malformed lines
    }
  }
  return entries;
}

/**
 * Pad a string to the right to reach the desired width.
 */
function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + ' '.repeat(width - text.length);
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Display DACP handoff history for a pattern.
 *
 * @param args - Command-line arguments (after 'dacp history')
 * @returns Exit code (0 success, 1 error)
 */
export async function dacpHistoryCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showDacpHistoryHelp();
    return 0;
  }

  // Parse output mode flags
  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  // Parse --last flag
  let lastN = 10;
  const lastIdx = args.indexOf('--last');
  if (lastIdx !== -1 && args[lastIdx + 1]) {
    const parsed = parseInt(args[lastIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) lastN = parsed;
  }
  // Also support --last=N format
  const lastEqualsArg = args.find((a) => a.startsWith('--last='));
  if (lastEqualsArg) {
    const parsed = parseInt(lastEqualsArg.split('=')[1], 10);
    if (!isNaN(parsed) && parsed > 0) lastN = parsed;
  }

  // Build set of args that are flag values (not the pattern)
  const flagValues = new Set<string>();
  if (lastIdx !== -1 && args[lastIdx + 1]) {
    flagValues.add(args[lastIdx + 1]);
  }

  // Extract pattern (first non-flag argument that isn't a flag value)
  const pattern = args.find(
    (a) => !a.startsWith('-') && !flagValues.has(a),
  );

  if (!pattern) {
    console.error(
      'Usage: skill-creator dacp history <pattern> [--last N] [--json] [--quiet]',
    );
    return 1;
  }

  // Read drift-scores.jsonl
  const driftPath = join(
    homedir(),
    '.gsd',
    'dacp',
    'retrospective',
    'drift-scores.jsonl',
  );

  let content: string;
  try {
    content = await readFile(driftPath, 'utf-8');
  } catch {
    if (json) {
      console.log(JSON.stringify([]));
    } else if (!quiet) {
      p.log.info('No handoff history available.');
    }
    return 0;
  }

  if (!content.trim()) {
    if (json) {
      console.log(JSON.stringify([]));
    } else if (!quiet) {
      p.log.info('No handoff history available.');
    }
    return 0;
  }

  // Parse and filter
  const allEntries = parseJsonl(content);
  const filtered = allEntries.filter((e) => e.pattern === pattern);

  if (filtered.length === 0) {
    if (json) {
      console.log(JSON.stringify([]));
    } else if (!quiet) {
      p.log.info(`No handoffs found for pattern "${pattern}".`);
    }
    return 0;
  }

  // Sort by timestamp descending and take last N
  filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const limited = filtered.slice(0, lastN);

  // JSON output
  if (json) {
    console.log(JSON.stringify(limited, null, 2));
    return 0;
  }

  // Quiet output: CSV lines
  if (quiet) {
    for (let i = 0; i < limited.length; i++) {
      const e = limited[i];
      const verified = e.verification_pass ? 'yes' : 'no';
      const tokens = e.tokens_spent_interpreting ?? 0;
      console.log(`${i + 1},${e.fidelity_level},${e.score},${verified},${tokens}`);
    }
    return 0;
  }

  // Text output: styled table
  p.log.message(pc.bold(`Handoff History: ${pattern}`));
  p.log.message(pc.dim('\u2500'.repeat(60)));

  // Header
  const numW = 4;
  const levelW = 6;
  const driftW = 8;
  const statusW = 10;
  const tokensW = 8;

  const header =
    `  ${padRight('#', numW)}` +
    `${padRight('Level', levelW)}` +
    `${padRight('Drift', driftW)}` +
    `${padRight('Status', statusW)}` +
    `${padRight('Tokens', tokensW)}`;
  p.log.message(header);
  p.log.message(
    pc.dim(
      `  ${'\u2500'.repeat(numW)}${'\u2500'.repeat(levelW)}${'\u2500'.repeat(driftW)}${'\u2500'.repeat(statusW)}${'\u2500'.repeat(tokensW)}`,
    ),
  );

  for (let i = 0; i < limited.length; i++) {
    const e = limited[i];
    const verified = e.verification_pass ? pc.green('verified') : pc.red('rework');
    const tokens = String(e.tokens_spent_interpreting ?? 0);
    const driftColor =
      e.score > 0.3 ? pc.red(e.score.toFixed(2)) : pc.green(e.score.toFixed(2));

    const row =
      `  ${padRight(String(i + 1), numW)}` +
      `${padRight(`L${e.fidelity_level}`, levelW)}` +
      `${padRight(driftColor, driftW)}` +
      `${padRight(verified, statusW)}` +
      `${padRight(tokens, tokensW)}`;
    p.log.message(row);
  }

  p.log.message('');
  p.log.message(
    pc.dim(`Showing ${limited.length} of ${filtered.length} entries`),
  );

  return 0;
}

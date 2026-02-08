/**
 * Bash command pattern extraction for Claude Code session analysis.
 *
 * Classifies Bash tool invocations into workflow categories (git, test, build,
 * package, file-op, search, scripted, other) and normalizes commands to keyword
 * form for deduplication and frequency analysis.
 *
 * Used by Phase 33 pattern scoring to surface recurring shell workflows like
 * "user always does git add && git commit" separately from tool sequence n-grams.
 */

import type { ParsedEntry, ExtractedToolUse } from './types.js';

// ============================================================================
// Types
// ============================================================================

/** Workflow category for a Bash command invocation */
export type BashCategory =
  | 'git-workflow'
  | 'test-command'
  | 'build-command'
  | 'package-management'
  | 'file-operation'
  | 'search'
  | 'scripted'
  | 'other';

/** A classified and normalized Bash command pattern */
export interface BashPattern {
  category: BashCategory;
  command: string;
  normalized: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum stored command length (longer commands are truncated) */
const MAX_COMMAND_LENGTH = 500;

/** File operation commands */
const FILE_OPS = new Set(['ls', 'cat', 'mkdir', 'cp', 'mv', 'rm', 'touch', 'chmod']);

/** Search commands */
const SEARCH_CMDS = new Set(['find', 'grep', 'rg', 'ag']);

// ============================================================================
// classifyBashCommand
// ============================================================================

/**
 * Classify a Bash command string into a workflow category.
 *
 * Classification is based on the first command keyword on the first line.
 * For chained commands (&&), the first/primary command determines category.
 */
export function classifyBashCommand(command: string): BashCategory {
  const trimmed = command.trim();
  if (trimmed === '') return 'other';

  // Take first line only
  const firstLine = trimmed.split('\n')[0].trim();
  if (firstLine === '') return 'other';

  // For chained commands, classify by the first segment
  const firstSegment = firstLine.split('&&')[0].trim();
  const tokens = firstSegment.split(/\s+/);
  const cmd = tokens[0];
  const sub = tokens[1] ?? '';

  // 1. Git commands
  if (cmd === 'git') return 'git-workflow';

  // 2. Test runners
  if (cmd === 'npx' && (sub === 'vitest' || sub === 'jest')) return 'test-command';
  if (cmd === 'npm' && sub === 'test') return 'test-command';
  if (cmd === 'pytest') return 'test-command';
  if (cmd === 'cargo' && sub === 'test') return 'test-command';

  // 3. Build tools
  if (cmd === 'npx' && (sub === 'tsc' || sub === 'esbuild')) return 'build-command';
  if (cmd === 'npm' && sub === 'run') return 'build-command';
  if (cmd === 'cargo' && sub === 'build') return 'build-command';

  // 4. Package managers
  if (cmd === 'npm' && (sub === 'install' || sub === 'add' || sub === 'remove' || sub === 'uninstall')) return 'package-management';
  if ((cmd === 'yarn' || cmd === 'pnpm') && (sub === 'add' || sub === 'remove')) return 'package-management';

  // 5. File operations
  if (FILE_OPS.has(cmd)) return 'file-operation';

  // 6. Search
  if (SEARCH_CMDS.has(cmd)) return 'search';

  // 7. Scripted (inline scripts)
  if ((cmd === 'python3' || cmd === 'python' || cmd === 'node') && (sub === '-c' || sub === '-e')) {
    // More precise: python/python3 use -c, node uses -e
    if ((cmd === 'python3' || cmd === 'python') && sub === '-c') return 'scripted';
    if (cmd === 'node' && sub === '-e') return 'scripted';
  }

  return 'other';
}

// ============================================================================
// normalizeBashCommand
// ============================================================================

/**
 * Normalize a Bash command to keyword form for deduplication.
 *
 * Strips arguments and file paths, keeping only command keywords.
 * For chained commands (&&), normalizes each segment independently
 * and preserves the chain structure.
 */
export function normalizeBashCommand(command: string): string {
  const trimmed = command.trim();
  if (trimmed === '') return '';

  // Take first line only
  const firstLine = trimmed.split('\n')[0].trim();
  if (firstLine === '') return '';

  // Split on && for chained commands
  const segments = firstLine.split('&&').map(s => s.trim()).filter(s => s !== '');

  const normalized = segments.map(normalizeSegment);
  return normalized.join(' && ');
}

/**
 * Normalize a single command segment to its keyword form.
 */
function normalizeSegment(segment: string): string {
  const tokens = segment.split(/\s+/);
  const cmd = tokens[0];
  if (!cmd) return '';

  // Git: keep "git <subcommand>"
  if (cmd === 'git') {
    return tokens[1] ? `git ${tokens[1]}` : 'git';
  }

  // npx: keep "npx <tool> <subcommand>" (up to 3 keyword tokens)
  if (cmd === 'npx') {
    const tool = tokens[1] ?? '';
    const sub = tokens[2] ?? '';
    // If sub is a flag or path, don't include it
    if (sub && !sub.startsWith('-') && !sub.startsWith('/') && !sub.startsWith('.') && !sub.includes('/')) {
      return `npx ${tool} ${sub}`;
    }
    return tool ? `npx ${tool}` : 'npx';
  }

  // npm: keep "npm <subcommand>"
  if (cmd === 'npm') {
    return tokens[1] ? `npm ${tokens[1]}` : 'npm';
  }

  // yarn/pnpm: keep "<pm> <subcommand>"
  if (cmd === 'yarn' || cmd === 'pnpm') {
    return tokens[1] ? `${cmd} ${tokens[1]}` : cmd;
  }

  // cargo: keep "cargo <subcommand>"
  if (cmd === 'cargo') {
    return tokens[1] ? `cargo ${tokens[1]}` : 'cargo';
  }

  // pytest: just the command
  if (cmd === 'pytest') return 'pytest';

  // Scripted: keep "python3 -c" or "node -e"
  if ((cmd === 'python3' || cmd === 'python') && tokens[1] === '-c') {
    return `${cmd} -c`;
  }
  if (cmd === 'node' && tokens[1] === '-e') {
    return 'node -e';
  }

  // Simple commands (ls, cat, etc.): just the command name
  return cmd;
}

// ============================================================================
// extractBashPatterns
// ============================================================================

/**
 * Extract Bash command patterns from parsed session entries.
 *
 * Filters to tool-uses entries, then to Bash tool invocations,
 * classifies and normalizes each command, and returns BashPattern[].
 * Commands longer than 500 chars are truncated for storage.
 */
export function extractBashPatterns(entries: ParsedEntry[]): BashPattern[] {
  const patterns: BashPattern[] = [];

  for (const entry of entries) {
    if (entry.kind !== 'tool-uses') continue;

    for (const tool of entry.data) {
      if (tool.name !== 'Bash') continue;

      const rawCommand = tool.input.command;
      if (typeof rawCommand !== 'string') continue;

      const command = rawCommand.length > MAX_COMMAND_LENGTH
        ? rawCommand.slice(0, MAX_COMMAND_LENGTH)
        : rawCommand;

      patterns.push({
        category: classifyBashCommand(command),
        command,
        normalized: normalizeBashCommand(command),
      });
    }
  }

  return patterns;
}

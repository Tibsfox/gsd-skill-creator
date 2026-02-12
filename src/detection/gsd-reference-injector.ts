/**
 * GSD command reference injection for generated skill bodies.
 *
 * When a generated skill relates to GSD workflows (planning, debugging,
 * executing, research, etc.), this module appends a "Related GSD Commands"
 * section with relevant `/gsd:*` command references.
 *
 * Uses a static keyword map (no runtime discovery) for zero overhead.
 * Only active when GSD is installed (.claude/commands/gsd/ exists).
 */

import { stat } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// Static command map
// ============================================================================

/**
 * Maps keywords to GSD commands that are relevant when those keywords
 * appear in a skill's body or description.
 *
 * Multiple keywords may map to the same command (synonyms).
 * Each entry has a command (the /gsd:* reference) and a description.
 */
export const GSD_COMMAND_MAP: Record<string, { command: string; description: string }[]> = {
  plan: [
    { command: '/gsd:plan-phase', description: 'Create detailed execution plan for a phase' },
    { command: '/gsd:discuss-phase', description: 'Discuss approach before planning' },
  ],
  execute: [
    { command: '/gsd:execute-phase', description: 'Execute a planned phase' },
  ],
  build: [
    { command: '/gsd:execute-phase', description: 'Execute a planned phase' },
  ],
  debug: [
    { command: '/gsd:debug', description: 'Systematic debugging with persistent state' },
  ],
  troubleshoot: [
    { command: '/gsd:debug', description: 'Systematic debugging with persistent state' },
  ],
  research: [
    { command: '/gsd:research-phase', description: 'Deep investigation before planning' },
  ],
  investigate: [
    { command: '/gsd:research-phase', description: 'Deep investigation before planning' },
  ],
  verify: [
    { command: '/gsd:verify-work', description: 'User acceptance testing for completed work' },
  ],
  validate: [
    { command: '/gsd:verify-work', description: 'User acceptance testing for completed work' },
  ],
  milestone: [
    { command: '/gsd:new-milestone', description: 'Initialize a new project milestone' },
    { command: '/gsd:audit-milestone', description: 'Comprehensive milestone completion check' },
  ],
  commit: [
    { command: '/gsd:quick', description: 'Lightweight path for ad-hoc tasks' },
  ],
};

// ============================================================================
// injectGsdReferences
// ============================================================================

/**
 * Inject GSD command references into a skill body when relevant keywords
 * are detected in the body or description.
 *
 * @param body - The skill body markdown content
 * @param description - The skill description text
 * @param hasGsdInstalled - Whether GSD is installed in the project
 * @returns The body with appended "Related GSD Commands" section, or unchanged if no matches
 */
export function injectGsdReferences(
  body: string,
  description: string,
  hasGsdInstalled: boolean,
): string {
  if (!hasGsdInstalled) {
    return body;
  }

  // Combine body and description, lowercase for case-insensitive matching
  const combined = `${description} ${body}`.toLowerCase();

  // Collect unique command references using a Map keyed by command string
  // to deduplicate across synonym keywords
  const matchedCommands = new Map<string, string>();

  for (const [keyword, entries] of Object.entries(GSD_COMMAND_MAP)) {
    if (combined.includes(keyword)) {
      for (const entry of entries) {
        if (!matchedCommands.has(entry.command)) {
          matchedCommands.set(entry.command, `- \`${entry.command}\` - ${entry.description}`);
        }
      }
    }
  }

  if (matchedCommands.size === 0) {
    return body;
  }

  return body + '\n\n## Related GSD Commands\n\n' + Array.from(matchedCommands.values()).join('\n') + '\n';
}

// ============================================================================
// checkGsdInstalled
// ============================================================================

/**
 * Check whether GSD is installed by looking for the .claude/commands/gsd/ directory.
 *
 * @param projectRoot - Project root directory (defaults to cwd)
 * @returns true if GSD command directory exists
 */
export async function checkGsdInstalled(projectRoot?: string): Promise<boolean> {
  const root = projectRoot ?? process.cwd();
  try {
    const gsdDir = join(root, '.claude', 'commands', 'gsd');
    const stats = await stat(gsdDir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

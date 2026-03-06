/**
 * wl browse — list open wanted items from DoltHub with filtering.
 *
 * Lets users discover available wasteland work items from the terminal
 * without navigating to DoltHub manually. Supports filtering by status,
 * effort level, and tags — both as flags and smart positional arguments.
 *
 * Smart positional args:
 *   'wl browse open'   == 'wl browse --status open'
 *   'wl browse medium' == 'wl browse --effort medium'
 *   'wl browse rust'   == 'wl browse --tag rust'
 *
 * Output modes:
 *   compact (default): ID, title, status, effort
 *   --verbose: all columns including posted_by, claimed_by, tags, created_at
 *   --json: machine-readable JSON with rows array
 *
 * @module wl-browse
 */

import pc from 'picocolors';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { renderTable, renderBadge, smartFit } from '../../../integrations/wasteland/formatters.js';
import { sqlEscape } from '../../../integrations/wasteland/sql-escape.js';

// ============================================================================
// Help text
// ============================================================================

const BROWSE_HELP_TEXT = `wl browse — list wanted items from the wasteland

Usage:
  wl browse [status|effort|tag] [options]

Positional args (smart detection):
  open | claimed | submitted | in_review | completed | withdrawn  → --status
  trivial | small | medium | large | epic                         → --effort
  any other word                                                   → --tag

Options:
  --status <status>   Filter by status (open, claimed, submitted, in_review, completed, withdrawn)
  --effort <effort>   Filter by effort level (trivial, small, medium, large, epic)
  --tag <tag>         Filter by tag (JSON_CONTAINS match)
  --verbose           Show all columns (posted_by, claimed_by, tags, created_at)
  --json              Output machine-readable JSON
  --offline           Skip dolt pull sync, use local data only
  --help, -h          Show this help

Examples:
  wl browse                    List all items (compact view)
  wl browse open               List open items (positional shorthand)
  wl browse --status open      Same as above
  wl browse open medium        Open items with medium effort
  wl browse --tag rust         Items tagged with 'rust'
  wl browse open --verbose     Open items with all columns
  wl browse --json             Machine-readable JSON output
  wl browse --offline          Use local data, skip network sync
`;

// ============================================================================
// Constant lists for smart positional arg detection
// ============================================================================

const STATUSES = ['open', 'claimed', 'submitted', 'in_review', 'completed', 'withdrawn'];
const EFFORTS = ['trivial', 'small', 'medium', 'large', 'epic'];

// ============================================================================
// Flag helpers
// ============================================================================

/**
 * Return true when any of the named flags appear in the args array.
 * Handles both --flag and -f (first char) forms.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(f => args.includes(`--${f}`) || args.includes(`-${f.charAt(0)}`));
}

/**
 * Return the value following --flag in the args array, or undefined when absent.
 */
function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(`--${flag}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

/**
 * Extract positional args — everything that is not a flag (--foo) or a
 * value following a known flag.
 */
function extractPositionalArgs(args: string[]): string[] {
  const positionals: string[] = [];
  const flagsWithValues = new Set(['--status', '--effort', '--tag']);
  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg.startsWith('--')) {
      // Skip flag and its value if this flag takes a value
      if (flagsWithValues.has(arg)) {
        i += 2; // skip flag + value
      } else {
        i += 1; // boolean flag, skip only the flag
      }
    } else if (arg.startsWith('-')) {
      i += 1; // short flag, skip
    } else {
      positionals.push(arg);
      i += 1;
    }
  }
  return positionals;
}

// ============================================================================
// Command
// ============================================================================

/**
 * wl browse command — discover available wasteland work items.
 *
 * Queries DoltHub (or local Dolt clone) for wanted items and renders
 * a table to stdout. Filters compose: --status and --effort can be
 * combined to narrow results.
 *
 * @param args    - CLI arguments (flags and values)
 * @param options - Optional overrides for testing (e.g. configDir)
 * @returns Exit code: 0 success, 1 error
 */
export async function wlBrowseCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  // 1. Help check
  if (hasFlag(args, 'help', 'h')) {
    console.log(BROWSE_HELP_TEXT);
    return 0;
  }

  // 2. Parse mode flags
  const jsonMode = hasFlag(args, 'json');
  const verboseMode = hasFlag(args, 'verbose');

  // 3. Parse filters from flags
  let statusFilter = getFlagValue(args, 'status');
  let effortFilter = getFlagValue(args, 'effort');
  let tagFilter = getFlagValue(args, 'tag');

  // 4. Smart positional arg detection
  const positionals = extractPositionalArgs(args);
  for (const pos of positionals) {
    if (STATUSES.includes(pos)) {
      statusFilter = pos;
    } else if (EFFORTS.includes(pos)) {
      effortFilter = pos;
    } else {
      tagFilter = pos;
    }
  }

  // 5. Bootstrap — pass original args (includes --offline if present)
  const { client, synced } = await bootstrap(args, options);

  // 6. Build SQL
  const selectCols = verboseMode
    ? `id, title, COALESCE(status,'open') as status, COALESCE(effort_level,'medium') as effort_level, posted_by, claimed_by, tags, created_at`
    : `id, title, COALESCE(status,'open') as status, COALESCE(effort_level,'medium') as effort_level`;

  const conditions: string[] = [];
  if (statusFilter) {
    conditions.push(`COALESCE(status,'open') = '${sqlEscape(statusFilter)}'`);
  }
  if (effortFilter) {
    conditions.push(`effort_level = '${sqlEscape(effortFilter)}'`);
  }
  if (tagFilter) {
    conditions.push(`JSON_CONTAINS(tags, JSON_QUOTE('${sqlEscape(tagFilter)}'))`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = [
    `SELECT ${selectCols}`,
    `FROM wanted`,
    whereClause,
    `ORDER BY CASE COALESCE(status,'open') WHEN 'open' THEN 0 WHEN 'claimed' THEN 1 ELSE 2 END, created_at DESC`,
  ]
    .filter(Boolean)
    .join(' ');

  // 7. Execute query
  const { rows, source } = await client.query(sql);

  // 8. Empty state
  if (rows.length === 0) {
    console.log(
      pc.dim("No items found. Try `wl browse --status claimed` or post work with `wl post`"),
    );
    return 0;
  }

  // 9. Parse tags in each row (JSON column — may be string or already parsed)
  const parsedRows = rows.map(r => {
    const row = { ...r };
    if ('tags' in row) {
      try {
        const parsed = JSON.parse(row['tags'] ?? '[]');
        row['tags'] = Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
      } catch {
        row['tags'] = '';
      }
    }
    return row;
  });

  // 10. JSON mode — output raw rows before badge rendering
  if (jsonMode) {
    console.log(JSON.stringify({ rows: parsedRows, synced, source }, null, 2));
    return 0;
  }

  // 11. Build table headers and rows
  const headers = verboseMode
    ? ['ID', 'Title', 'Status', 'Effort', 'Posted By', 'Claimed By', 'Tags', 'Created']
    : ['ID', 'Title', 'Status', 'Effort'];

  const tableRows = parsedRows.map(row => {
    const status = row['status'] ?? '';
    const title = row['title'] ?? '';
    if (verboseMode) {
      return [
        row['id'] ?? '',
        smartFit(title, 40),
        renderBadge(status),
        row['effort_level'] ?? '',
        row['posted_by'] ?? '',
        row['claimed_by'] ?? '',
        row['tags'] ?? '',
        row['created_at'] ?? '',
      ];
    }
    return [
      row['id'] ?? '',
      smartFit(title, 40),
      renderBadge(status),
      row['effort_level'] ?? '',
    ];
  });

  // 12. Render table
  console.log(renderTable(headers, tableRows));

  if (!synced) {
    console.log(pc.dim('Note: working from local data (sync failed)'));
  }

  return 0;
}

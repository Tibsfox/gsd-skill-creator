/**
 * Purge CLI command.
 *
 * Provides manual cleanup for observation JSONL files using JsonlCompactor.
 * Supports --dry-run to preview changes and --max-age to override retention.
 *
 * Usage:
 *   skill-creator purge [--dry-run] [--max-age=N] [--patterns-dir=<path>]
 */

import { join } from 'node:path';
import { readFile, writeFile, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { JsonlCompactor } from '../../observation/jsonl-compactor.js';
import type { CompactionResult } from '../../observation/jsonl-compactor.js';

/** Known JSONL files in the patterns directory */
const JSONL_FILES = [
  'sessions.jsonl',
  '.ephemeral.jsonl',
  'budget-history.jsonl',
  'events.jsonl',
  'feedback.jsonl',
];

interface PurgeOutput {
  files: Array<{ path: string } & CompactionResult>;
  totals: {
    retained: number;
    removed: number;
    malformed: number;
    tampered: number;
  };
  dry_run: boolean;
}

/**
 * Extract a flag value from args in --key=value format.
 */
function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

/**
 * Purge CLI command entry point.
 *
 * Compacts observation JSONL files, removing expired, malformed, and
 * tampered entries. Reports per-file and total compaction results as JSON.
 *
 * @param args - Command-line arguments after 'purge'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function purgeCommand(args: string[]): Promise<number> {
  // Help flag
  if (args.includes('--help') || args.includes('-h')) {
    showPurgeHelp();
    return 0;
  }

  // Parse flags
  const dryRun = args.includes('--dry-run');
  const maxAgeStr = extractFlag(args, 'max-age');
  const maxAge = maxAgeStr ? parseInt(maxAgeStr, 10) : 30;
  const patternsDir = extractFlag(args, 'patterns-dir') ?? '.planning/patterns';

  if (isNaN(maxAge) || maxAge < 0) {
    console.log(JSON.stringify({ error: 'Invalid --max-age value: must be a non-negative number' }));
    return 1;
  }

  try {
    const compactor = new JsonlCompactor({ maxAgeDays: maxAge });
    const fileResults: PurgeOutput['files'] = [];
    const totals = { retained: 0, removed: 0, malformed: 0, tampered: 0 };

    for (const fileName of JSONL_FILES) {
      const filePath = join(patternsDir, fileName);

      let result: CompactionResult;

      if (dryRun) {
        // Compact a temp copy to preview results without modifying original
        const tempPath = join(
          tmpdir(),
          `.purge-dry-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
        );

        try {
          await copyFile(filePath, tempPath);
          result = await compactor.compact(tempPath);
          await rm(tempPath, { force: true });
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            // File doesn't exist, skip
            result = { retained: 0, removed: 0, malformed: 0, tampered: 0 };
          } else {
            throw err;
          }
        }
      } else {
        result = await compactor.compact(filePath);
      }

      // Only report files that had some activity (not all-zero)
      if (result.retained > 0 || result.removed > 0 || result.malformed > 0 || result.tampered > 0) {
        fileResults.push({ path: fileName, ...result });
      }

      totals.retained += result.retained;
      totals.removed += result.removed;
      totals.malformed += result.malformed;
      totals.tampered += result.tampered;
    }

    const output: PurgeOutput = {
      files: fileResults,
      totals,
      dry_run: dryRun,
    };

    console.log(JSON.stringify(output, null, 2));
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }));
    return 1;
  }
}

/**
 * Display help text for the purge command.
 */
function showPurgeHelp(): void {
  console.log(`
skill-creator purge - Compact and clean observation JSONL files

Usage:
  skill-creator purge [options]
  skill-creator pg [options]

Options:
  --dry-run              Preview changes without modifying files
  --max-age=<days>       Remove entries older than N days (default: 30)
  --patterns-dir=<path>  Override patterns directory (default: .planning/patterns)
  --help, -h             Show this help message

Description:
  Compacts observation JSONL files by removing:
  - Expired entries (older than --max-age days)
  - Malformed entries (invalid JSON or missing required fields)
  - Tampered entries (checksum mismatch detected)

  Files compacted:
  - sessions.jsonl       Session observations
  - .ephemeral.jsonl     Ephemeral observation buffer
  - budget-history.jsonl Budget tracking history
  - events.jsonl         Inter-skill event log
  - feedback.jsonl       User feedback log

Output:
  JSON with per-file results and totals:
  {
    "files": [{"path": "sessions.jsonl", "retained": 45, "removed": 12, ...}],
    "totals": {"retained": 120, "removed": 35, "malformed": 2, "tampered": 1},
    "dry_run": false
  }

Examples:
  skill-creator purge                    # Clean with default 30-day retention
  skill-creator purge --dry-run          # Preview what would be cleaned
  skill-creator purge --max-age=7        # Remove entries older than 7 days
  skill-creator pg --max-age=1           # Aggressive 1-day cleanup
`);
}

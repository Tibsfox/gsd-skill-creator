/**
 * CLI wrapper for `skill-creator drift <subcommand>` (DRIFT-26).
 *
 * The functional logic lives in `scripts/drift/drift-audit.mjs` (pure ESM
 * JavaScript, no TypeScript transform required). This wrapper forwards
 * argv to that script via `node` subprocess so that stdout/stderr/exit
 * codes mirror the standalone invocation exactly.
 *
 * Currently supports one subcommand:
 *   - `audit` → delegates to scripts/drift/drift-audit.mjs with all
 *     remaining argv forwarded.
 *
 * Example invocations:
 *   skill-creator drift audit --format=json
 *   skill-creator drift audit --since=2026-04-23T00:00:00Z
 *   skill-creator drift audit --severity critical
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// src/drift/cli.ts → three levels up to repo root, then into scripts/drift
const DRIFT_AUDIT_SCRIPT = join(here, '..', '..', 'scripts', 'drift', 'drift-audit.mjs');

function printHelp(): void {
  console.log(`
skill-creator drift — drift-telemetry audit + governance utilities

Usage:
  skill-creator drift <subcommand> [options]

Subcommands:
  audit    Run the drift-telemetry audit against .logs/drift-telemetry.jsonl

audit options:
  --logs <path>                     Override log file path (default: .logs/drift-telemetry.jsonl)
  --format markdown|json            Output format (default: markdown)
  --since <ISO-8601>                Include only events at or after this timestamp
  --surface knowledge|alignment|retrieval|all   Filter by surface
  --severity info|warn|critical|all             Filter by severity

Exit codes:
  0 — clean audit
  1 — CRITICAL findings present
  2 — argument validation failure

See docs/cli/drift-audit.md for detailed reference.
`.trim());
}

export async function driftCommand(args: string[]): Promise<number> {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    printHelp();
    return 0;
  }

  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'audit': {
      const result = spawnSync(process.execPath, [DRIFT_AUDIT_SCRIPT, ...rest], {
        stdio: 'inherit',
        encoding: 'utf8',
      });
      if (result.error) {
        console.error(`skill-creator drift audit: failed to spawn: ${result.error.message}`);
        return 2;
      }
      // status is null when the child was killed by a signal; treat as 1.
      return result.status ?? 1;
    }

    default:
      console.error(`skill-creator drift: unknown subcommand "${sub}".`);
      printHelp();
      return 2;
  }
}

/**
 * CLI command for displaying DACP communication protocol status.
 *
 * Shows active bundles, fidelity distribution, drift summary,
 * catalog counts, and pending actions from the retrospective analyzer.
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * @module cli/commands/dacp-status
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ============================================================================
// Help
// ============================================================================

function showDacpStatusHelp(): void {
  console.log(`
skill-creator dacp status - Show DACP communication status

Usage:
  skill-creator dacp status [options]
  skill-creator dp s [options]

Displays active bundles, fidelity distribution, drift summary,
catalog counts, and pending actions.

Options:
  --quiet, -q  Machine-readable CSV output
  --json       JSON output
  --help, -h   Show this help
`);
}

// ============================================================================
// Helpers
// ============================================================================

interface DacpStatusData {
  total_handoffs: number;
  total_bundles_assembled: number;
  avg_drift_score: number;
  last_retrospective: string;
}

interface DriftEntry {
  handoff_type: string;
  score: number;
  fidelity_level: number;
  recommendation: string;
  timestamp: string;
}

interface Recommendation {
  handoff_type: string;
  action: string;
  from: number;
  to: number;
  reason: string;
}

/**
 * Safely read and parse a JSON file. Returns null if file doesn't exist.
 */
async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Safely read and parse a JSONL file. Returns empty array if file doesn't exist.
 */
async function readJsonlSafe<T>(filePath: string): Promise<T[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

/**
 * Calculate fidelity distribution from drift entries.
 */
function calculateFidelityDistribution(
  entries: DriftEntry[],
): Record<string, number> {
  const dist: Record<string, number> = { L0: 0, L1: 0, L2: 0, L3: 0 };
  for (const entry of entries) {
    const key = `L${entry.fidelity_level}`;
    if (key in dist) {
      dist[key]++;
    }
  }
  return dist;
}

/**
 * Format a relative time string from an ISO timestamp.
 */
function formatRelativeTime(isoTimestamp: string): string {
  const then = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0)
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'just now';
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Display DACP communication status.
 *
 * @param args - Command-line arguments (after 'dacp status')
 * @returns Exit code (0 success, 1 error)
 */
export async function dacpStatusCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showDacpStatusHelp();
    return 0;
  }

  // Parse output mode flags
  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  const dacpDir = join(homedir(), '.gsd', 'dacp');

  // Read all data sources (each may be missing)
  const status = await readJsonSafe<DacpStatusData>(
    join(dacpDir, 'retrospective', 'status.json'),
  );
  const driftEntries = await readJsonlSafe<DriftEntry>(
    join(dacpDir, 'retrospective', 'drift-scores.jsonl'),
  );
  const recommendations = await readJsonSafe<Recommendation[]>(
    join(dacpDir, 'retrospective', 'recommendations.json'),
  );
  const templates = await readJsonSafe<unknown[]>(
    join(dacpDir, 'templates', 'registry.json'),
  );
  const scripts = await readJsonSafe<unknown[]>(
    join(dacpDir, 'catalog', 'scripts.json'),
  );
  const schemas = await readJsonSafe<unknown[]>(
    join(dacpDir, 'catalog', 'schemas.json'),
  );

  // Check if we have any data at all
  const hasData =
    status !== null || driftEntries.length > 0 || recommendations !== null;

  if (!hasData) {
    if (json) {
      console.log(JSON.stringify({ message: 'No DACP data yet' }));
    } else if (!quiet) {
      p.log.info('No DACP data yet. Run handoffs to generate data.');
    }
    return 0;
  }

  // Calculate fidelity distribution from drift entries
  const fidelityDist = calculateFidelityDistribution(driftEntries);

  const totalHandoffs = status?.total_handoffs ?? driftEntries.length;
  const bundledHandoffs = status?.total_bundles_assembled ?? 0;
  const avgDrift = status?.avg_drift_score ?? 0;
  const scriptCount = scripts?.length ?? 0;
  const schemaCount = schemas?.length ?? 0;
  const templateCount = templates?.length ?? 0;
  const pendingActions = recommendations ?? [];

  // JSON output
  if (json) {
    const output = {
      handoffs: {
        total: totalHandoffs,
        bundled: bundledHandoffs,
      },
      avgDrift,
      fidelityDistribution: fidelityDist,
      catalog: {
        scripts: scriptCount,
        schemas: schemaCount,
        templates: templateCount,
      },
      lastRetrospective: status?.last_retrospective ?? null,
      pendingActions,
    };
    console.log(JSON.stringify(output, null, 2));
    return 0;
  }

  // Quiet output: single CSV line
  if (quiet) {
    console.log(
      `${totalHandoffs},${bundledHandoffs},${avgDrift},${scriptCount},${schemaCount},${templateCount}`,
    );
    return 0;
  }

  // Text output (styled)
  const bundledPct =
    totalHandoffs > 0
      ? Math.round((bundledHandoffs / totalHandoffs) * 100)
      : 0;

  p.log.message(pc.bold('DACP Communication Status'));
  p.log.message(
    pc.dim('\u2500'.repeat(25)),
  );
  p.log.message(
    `Handoffs: ${pc.cyan(String(totalHandoffs))} total | ${pc.cyan(String(bundledHandoffs))} bundled (${bundledPct}%)`,
  );
  p.log.message(`Avg Drift Score: ${pc.cyan(String(avgDrift))}`);
  p.log.message(
    `Fidelity Distribution: L0:${fidelityDist.L0} L1:${fidelityDist.L1} L2:${fidelityDist.L2} L3:${fidelityDist.L3}`,
  );
  p.log.message('');
  p.log.message(
    `Catalog: ${pc.cyan(String(scriptCount))} scripts | ${pc.cyan(String(schemaCount))} schemas | ${pc.cyan(String(templateCount))} templates`,
  );

  if (status?.last_retrospective) {
    p.log.message(
      `Last Retrospective: ${formatRelativeTime(status.last_retrospective)}`,
    );
  }

  if (pendingActions.length > 0) {
    p.log.message('');
    p.log.message('Pending Actions:');
    for (const action of pendingActions) {
      const arrow =
        action.action === 'promote' ? '\u2191' : '\u2193';
      const actionType = action.handoff_type ?? 'unknown';
      p.log.message(
        `  ${arrow} ${actionType} \u2192 Level ${action.to} (${action.reason})`,
      );
    }
  }

  return 0;
}

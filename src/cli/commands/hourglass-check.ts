/**
 * CLI command for the hourglass-persistence advisory audit.
 *
 * Constructs a small canonical "hourglass" skill-DAG, runs the topological
 * hole detector + per-vertex contraction-index computation + waist
 * detection, and emits a structured audit finding. Reports counts +
 * top-N indices in text mode; full record in JSON mode.
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * ADVISORY-ONLY. Exit code is always 0 regardless of audit verdict — the
 * CAPCOM handoff retains full authority over enforcement decisions. The
 * hourglass-persistence module's audit findings are explicitly
 * advisory-only by design.
 *
 * @module cli/commands/hourglass-check
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

import type { SkillDag } from '../../hourglass-persistence/index.js';
import {
  DEFAULT_WAIST_THRESHOLD,
  aggregateContractionIndex,
  computeContractionIndices,
  detectHoles,
  detectWaists,
  emitFinding,
  isHourglassPersistenceEnabled,
} from '../../hourglass-persistence/index.js';
import { getFlagValue } from '../lib/flag-lookup.js';

// ============================================================================
// Help
// ============================================================================

function showHourglassCheckHelp(): void {
  console.log(`
skill-creator hourglass-check - Advisory hourglass-persistence audit

Usage:
  skill-creator hourglass-check [options]
  skill-creator hc [options]

Constructs a small canonical hourglass-shaped skill-DAG (one bottleneck
vertex connecting two clusters), runs the topological hole detector +
per-vertex contraction-index computation + waist detection, and emits a
structured audit finding (waist | hole | healthy).

ADVISORY-ONLY: exit code is always 0; CAPCOM retains enforcement authority.
The hourglass-persistence module is default-OFF; this command reports the
opt-in state via the 'mathematical-foundations.hourglass-persistence.enabled'
flag but does not require it to run the check (the check is pure
read-only in-memory computation).

Options:
  --shape <hourglass|chain|empty>  Canonical fixture (default hourglass)
  --waist-threshold <N>            Index threshold for waist (default ${DEFAULT_WAIST_THRESHOLD})
  --quiet, -q                      Machine-readable CSV output
  --json                           JSON output
  --help, -h                       Show this help
`);
}

// ============================================================================
// Helpers
// ============================================================================

function parseFinite(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Build a canonical hourglass: two 3-vertex clusters connected by a
 * single bottleneck vertex `m`. Removing `m` disconnects the graph —
 * `m` is the textbook waist.
 *
 *   a — b — m — d — e
 *       |       |
 *       c       f
 */
function hourglassDag(): SkillDag {
  const vertices = new Set(['a', 'b', 'c', 'm', 'd', 'e', 'f']);
  const edges = new Map<string, Set<string>>([
    ['a', new Set(['b'])],
    ['b', new Set(['c', 'm'])],
    ['c', new Set([])],
    ['m', new Set(['d'])],
    ['d', new Set(['e', 'f'])],
    ['e', new Set([])],
    ['f', new Set([])],
  ]);
  return { vertices, edges };
}

/** Linear chain with no waist — control fixture. */
function chainDag(): SkillDag {
  const vertices = new Set(['a', 'b', 'c', 'd']);
  const edges = new Map<string, Set<string>>([
    ['a', new Set(['b'])],
    ['b', new Set(['c'])],
    ['c', new Set(['d'])],
    ['d', new Set([])],
  ]);
  return { vertices, edges };
}

/** Empty DAG — degenerate fixture. */
function emptyDag(): SkillDag {
  return { vertices: new Set(), edges: new Map() };
}

function pickShape(shape: string): SkillDag | null {
  switch (shape) {
    case 'hourglass':
      return hourglassDag();
    case 'chain':
      return chainDag();
    case 'empty':
      return emptyDag();
    default:
      return null;
  }
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Advisory hourglass-persistence audit.
 *
 * @param args - Command-line arguments (after 'hourglass-check')
 * @returns Exit code (always 0 on advisory paths; 1 only on argument errors).
 */
export async function hourglassCheckCommand(
  args: string[],
): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showHourglassCheckHelp();
    return 0;
  }

  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  const shapeLookup = getFlagValue(args, '--shape');
  const thresholdLookup = getFlagValue(args, '--waist-threshold');

  const rawShape = shapeLookup.present ? shapeLookup.value : 'hourglass';
  const shapeName = rawShape ?? '';
  const dag = pickShape(shapeName);
  if (dag === null) {
    if (json) {
      console.log(
        JSON.stringify({ error: 'invalid-flag', flag: '--shape', value: rawShape }),
      );
    } else if (!quiet) {
      p.log.error(`--shape must be one of: hourglass, chain, empty. Got '${rawShape ?? '<missing>'}'.`);
    }
    return 1;
  }

  let threshold = DEFAULT_WAIST_THRESHOLD;
  if (thresholdLookup.present) {
    const parsed = parseFinite(thresholdLookup.value);
    if (parsed === null) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'invalid-flag', flag: '--waist-threshold', value: thresholdLookup.value }),
        );
      } else if (!quiet) {
        p.log.error(`--waist-threshold must be a non-negative finite number; got '${thresholdLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    threshold = parsed;
  }

  const enabled = isHourglassPersistenceEnabled();
  const holes = detectHoles(dag);
  const indices = computeContractionIndices(dag);
  const waists = detectWaists(indices, threshold);
  const aggregate = aggregateContractionIndex(indices);
  const finding = emitFinding(indices, holes, threshold);

  if (json) {
    console.log(
      JSON.stringify(
        {
          enabled,
          shape: shapeName,
          vertices: dag.vertices.size,
          waistThreshold: threshold,
          holes,
          indices,
          waists,
          aggregate,
          finding,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  if (quiet) {
    console.log(
      `${shapeName},${dag.vertices.size},${enabled ? 'on' : 'off'},${holes.length},${waists.length},${aggregate.toFixed(3)},${finding.type}`,
    );
    return 0;
  }

  // Text (styled) output
  p.log.message(pc.bold('Hourglass-Persistence Audit (advisory)'));
  p.log.message(pc.dim('─'.repeat(40)));
  p.log.message(
    `Shape: ${pc.cyan(shapeName)} ` +
      `(vertices=${dag.vertices.size})  ` +
      `waist-threshold=${pc.cyan(String(threshold))}`,
  );
  p.log.message(
    `Opt-in flag: ${enabled ? pc.green('on') : pc.dim('off (advisory check still runs)')}`,
  );
  p.log.message('');

  p.log.message(`  ${pc.bold('Holes:')} ${holes.length}`);
  for (const h of holes.slice(0, 3)) {
    p.log.message(
      `    ${pc.dim('•')} [${h.vertices.join(',')}]  persistence=${h.persistence.toFixed(3)}  kind=${h.kind}`,
    );
  }
  if (holes.length > 3) p.log.message(`    ${pc.dim('…')} (${holes.length - 3} more)`);

  p.log.message(`  ${pc.bold('Waists (top):')}`);
  for (const w of waists.slice(0, 3)) {
    p.log.message(
      `    ${pc.dim('•')} ${w.vertex}  index=${w.index.toFixed(3)}  ` +
        `(before=${w.componentsBefore} → after=${w.componentsAfter})`,
    );
  }
  if (waists.length === 0) p.log.message(`    ${pc.dim('(none above threshold)')}`);

  p.log.message(`  ${pc.bold('Aggregate index:')} ${pc.cyan(aggregate.toFixed(3))}`);
  p.log.message('');

  const findingTag = finding.type === 'waist'
    ? pc.yellow('WAIST')
    : finding.type === 'hole'
      ? pc.yellow('HOLE')
      : pc.green('healthy');
  p.log.message(`Finding: ${findingTag}`);
  if (finding.type !== 'healthy') {
    p.log.warn('Advisory only — CAPCOM retains enforcement authority.');
  }

  return 0;
}

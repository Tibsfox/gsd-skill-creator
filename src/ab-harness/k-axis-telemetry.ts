/**
 * A/B harness K-axis telemetry — JP-010a (Wave 2 / phase 835).
 *
 * Instruments the A/B harness to observe K-axes (domain × expertise-level ×
 * session-type) from real usage events.  Emits structured JSONL observations
 * to a rotating log file and can aggregate those observations into a
 * K-distribution report at:
 *
 *   .planning/missions/julia-parameter-implementation/k-axis-evidence/REPORT.md
 *
 * Default K-axes (per FINDINGS §6 Q5):
 *   - user-domain       (e.g. 'typescript', 'python', 'unknown')
 *   - expertise-level   (e.g. 'beginner', 'intermediate', 'expert', 'unknown')
 *   - session-type      (e.g. 'interactive', 'batch', 'ci', 'unknown')
 *
 * JP-010b (Wave 3 / phase 844) reads the accumulated report to calibrate
 * the Θ(K/ε³) sample budget.  Default K=3 is a fallback only; evidence path
 * is preferred per user decision 5.
 *
 * Reference: arXiv:2604.21923 — multicalibration sample complexity.
 *
 * @module ab-harness/k-axis-telemetry
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A K-axis observation from a single A/B harness activation event.
 *
 * Axes default to 'unknown' when the caller cannot supply a value; the
 * aggregator counts 'unknown' separately so the evidence is not lost.
 */
export interface KAxisObservation {
  /** ISO-8601 timestamp of the observation. */
  timestamp: string;

  /** Experiment identifier from the A/B harness coordinator. */
  experimentId: string;

  /** Domain the skill operates in (e.g. 'typescript', 'data-analysis'). */
  userDomain: string;

  /** Caller-estimated expertise level of the user/agent invoking the skill. */
  expertiseLevel: 'beginner' | 'intermediate' | 'expert' | 'unknown';

  /** High-level session context (interactive REPL, batch job, CI pipeline). */
  sessionType: 'interactive' | 'batch' | 'ci' | 'unknown';

  /**
   * Any extra axes the caller wants to record beyond the 3-axis default.
   * These are preserved verbatim and forwarded to the REPORT aggregation.
   */
  extraAxes?: Record<string, string>;
}

/**
 * Options accepted by `observeKAxes`.
 */
export interface KAxisObserveOptions {
  /** Absolute path to the JSONL log file to append to. */
  logPath: string;

  /** Observation to record. */
  observation: KAxisObservation;

  /**
   * Maximum number of bytes before the log is rotated (old file renamed to
   * `<logPath>.1`).  Defaults to 1 MiB.
   */
  maxLogBytes?: number;
}

/**
 * Options accepted by `generateKAxisReport`.
 */
export interface KAxisReportOptions {
  /** Absolute path to the JSONL log file to read. */
  logPath: string;

  /** Absolute path to write the REPORT.md to. */
  reportPath: string;
}

// ─── Default paths ────────────────────────────────────────────────────────────

/**
 * Default REPORT.md path (relative to cwd at call time).
 * Tests should override via `reportPath` to use a tmp directory.
 */
export const DEFAULT_REPORT_PATH =
  '.planning/missions/julia-parameter-implementation/k-axis-evidence/REPORT.md';

/**
 * Default JSONL log path (relative to cwd at call time).
 */
export const DEFAULT_LOG_PATH =
  '.planning/missions/julia-parameter-implementation/k-axis-evidence/observations.jsonl';

/** Default maximum log size before rotation (1 MiB). */
const DEFAULT_MAX_LOG_BYTES = 1024 * 1024;

// ─── observeKAxes ─────────────────────────────────────────────────────────────

/**
 * Record a single K-axis observation from an A/B harness activation event.
 *
 * Appends a JSONL line to `opts.logPath`.  If the log file exceeds
 * `opts.maxLogBytes`, the existing file is renamed to `<logPath>.1` (last
 * rotation only; older rotations are overwritten) and a fresh file is started.
 *
 * Creates parent directories if they do not exist.
 *
 * @param opts - Observation options.
 */
export async function observeKAxes(opts: KAxisObserveOptions): Promise<void> {
  const { logPath, observation, maxLogBytes = DEFAULT_MAX_LOG_BYTES } = opts;

  // Ensure parent directory exists.
  await fs.mkdir(dirname(logPath), { recursive: true });

  // Rotate if needed.
  try {
    const stat = await fs.stat(logPath);
    if (stat.size >= maxLogBytes) {
      await fs.rename(logPath, `${logPath}.1`);
    }
  } catch {
    // File doesn't exist yet — no rotation needed.
  }

  const line = JSON.stringify(observation) + '\n';
  await fs.appendFile(logPath, line, 'utf8');
}

// ─── generateKAxisReport ──────────────────────────────────────────────────────

/**
 * Aggregate all recorded K-axis observations and write a REPORT.md.
 *
 * Reads `opts.logPath` line-by-line, tallies observed values per axis, and
 * writes a human-readable + machine-parseable Markdown report to
 * `opts.reportPath`.
 *
 * If no observations have been recorded yet, writes a seed report noting that
 * evidence collection is in progress.  JP-010b reads this file; an absent or
 * seed-only report triggers the K=3 default with audit-trail entry.
 *
 * Creates parent directories if they do not exist.
 *
 * @param opts - Report generation options.
 */
export async function generateKAxisReport(opts: KAxisReportOptions): Promise<void> {
  const { logPath, reportPath } = opts;

  await fs.mkdir(dirname(reportPath), { recursive: true });

  let lines: string[] = [];
  try {
    const raw = await fs.readFile(logPath, 'utf8');
    lines = raw.split('\n').filter(l => l.trim().length > 0);
  } catch {
    // No log file yet — write seed report.
  }

  const observations: KAxisObservation[] = [];
  for (const line of lines) {
    try {
      observations.push(JSON.parse(line) as KAxisObservation);
    } catch {
      // Malformed line — skip.
    }
  }

  const report = buildReport(observations);
  await fs.writeFile(reportPath, report, 'utf8');
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Tally occurrence counts for each distinct value of an axis. */
function tally(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

/** Format a tally Map as a Markdown table body. */
function tallyToTable(counts: Map<string, number>, total: number): string {
  if (counts.size === 0) return '| — | — | — |\n';
  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([val, n]) => `| ${val} | ${n} | ${((n / total) * 100).toFixed(1)}% |`)
    .join('\n');
  return rows + '\n';
}

/**
 * Build the full REPORT.md content from accumulated observations.
 *
 * The report is intentionally machine-parseable: JP-010b looks for the
 * `observed-K:` frontmatter field to determine the measured K value.
 */
function buildReport(observations: KAxisObservation[]): string {
  const n = observations.length;
  const now = new Date().toISOString();

  if (n === 0) {
    return [
      '---',
      '# K-Axis Evidence Report',
      `generated: ${now}`,
      'observed-K: pending',
      'evidence-status: seed — no observations recorded yet',
      '---',
      '',
      '# K-Axis Evidence Report',
      '',
      '> JP-010a instrumentation is active. No observations have been recorded yet.',
      '> Real usage between Phase 835 (Wave 2) and Phase 844 (Wave 3) will populate',
      '> this report. JP-010b defaults to K=3 until ≥ 7 days of evidence are present.',
      '',
      '## Status',
      '',
      '- **Observations recorded:** 0',
      '- **Evidence status:** seed',
      '- **Default K fallback:** K=3 (JP-010b gated on ≥ 7 days of evidence)',
      '',
    ].join('\n');
  }

  const domains = tally(observations.map(o => o.userDomain));
  const expertiseLevels = tally(observations.map(o => o.expertiseLevel));
  const sessionTypes = tally(observations.map(o => o.sessionType));

  // Observed K = number of axes with more than 1 distinct non-unknown value.
  const activeAxes = [domains, expertiseLevels, sessionTypes].filter(
    t => [...t.keys()].filter(k => k !== 'unknown').length > 1,
  );
  const observedK = Math.max(activeAxes.length, 1); // floor at 1

  const firstTs = observations[0]?.timestamp ?? now;
  const lastTs = observations[n - 1]?.timestamp ?? now;
  const daysDelta =
    (new Date(lastTs).getTime() - new Date(firstTs).getTime()) /
    (1000 * 60 * 60 * 24);

  return [
    '---',
    '# K-Axis Evidence Report',
    `generated: ${now}`,
    `observed-K: ${observedK}`,
    `observations: ${n}`,
    `evidence-window-days: ${daysDelta.toFixed(2)}`,
    'evidence-status: active',
    '---',
    '',
    '# K-Axis Evidence Report',
    '',
    `> Generated: ${now}`,
    `> Observations: ${n} | Window: ${daysDelta.toFixed(2)} days | Observed K: **${observedK}**`,
    '',
    '## Axis: user-domain',
    '',
    '| Value | Count | Share |',
    '|---|---|---|',
    tallyToTable(domains, n),
    '## Axis: expertise-level',
    '',
    '| Value | Count | Share |',
    '|---|---|---|',
    tallyToTable(expertiseLevels, n),
    '## Axis: session-type',
    '',
    '| Value | Count | Share |',
    '|---|---|---|',
    tallyToTable(sessionTypes, n),
    '## JP-010b decision',
    '',
    `- **Observed K:** ${observedK}`,
    `- **Evidence window:** ${daysDelta.toFixed(2)} days`,
    daysDelta >= 7
      ? `- **Status:** sufficient evidence (≥ 7 days) — JP-010b should use K=${observedK}`
      : `- **Status:** insufficient window (< 7 days) — JP-010b defaults to K=3`,
    '',
  ].join('\n');
}

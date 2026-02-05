/**
 * CLI commands for calibration and benchmarking workflows.
 *
 * Provides commands to:
 * - Optimize activation threshold from calibration data
 * - View and rollback threshold history
 * - Benchmark simulator accuracy vs real activation
 *
 * Per CONTEXT.md:
 * - Preview before applying threshold changes
 * - Always write JSON alongside benchmark output
 * - Exit code 1 if correlation below 85% target
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import {
  CalibrationStore,
  ThresholdOptimizer,
  ThresholdHistory,
  BenchmarkReporter,
} from '../../calibration/index.js';

/** Minimum events required for calibration per CONTEXT.md and RESEARCH.md */
const MIN_SAMPLES = 75;

/** Default threshold before calibration */
const DEFAULT_THRESHOLD = 0.75;

/** Target correlation percentage for exit code */
const CORRELATION_TARGET = 85;

// ============================================================================
// Flag Parsing Helpers
// ============================================================================

/**
 * Check if a boolean flag is present.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(
    (flag) => args.includes(`--${flag}`) || args.includes(`-${flag.charAt(0)}`)
  );
}

/**
 * Get non-flag arguments from args array.
 */
function getNonFlagArgs(args: string[]): string[] {
  return args.filter((a) => !a.startsWith('-'));
}

// ============================================================================
// Subcommand Handlers
// ============================================================================

/**
 * Handle main calibrate command - optimize threshold.
 */
async function handleCalibrate(args: string[]): Promise<number> {
  const preview = hasFlag(args, 'preview');
  const force = hasFlag(args, 'force', 'f');

  const store = new CalibrationStore();
  const history = new ThresholdHistory();
  const optimizer = new ThresholdOptimizer();

  // Load calibration data
  const events = await store.getKnownOutcomes();

  // Check minimum sample size
  if (events.length < MIN_SAMPLES) {
    p.log.warn(`Insufficient calibration data: ${events.length} events`);
    p.log.message(`Minimum required: ${MIN_SAMPLES} events with known outcomes`);
    p.log.message('Continue using skills to collect more calibration data.');
    return 0;
  }

  // Get current threshold
  const currentSnapshot = await history.getCurrent();
  const currentThreshold = currentSnapshot?.globalThreshold ?? DEFAULT_THRESHOLD;

  // Run optimization
  const result = optimizer.findOptimalThreshold(events, currentThreshold);

  // Display preview
  p.log.message('');
  p.log.message(pc.bold('Calibration Analysis'));
  p.log.message('');

  const currentF1Pct = (result.currentF1 * 100).toFixed(1);
  const optimalF1Pct = (result.optimalF1 * 100).toFixed(1);
  const improvementPct = (result.improvement * 100).toFixed(1);

  p.log.message(`Current threshold: ${currentThreshold.toFixed(2)} (F1: ${currentF1Pct}%)`);
  p.log.message(`Optimal threshold: ${result.optimalThreshold.toFixed(2)} (F1: ${optimalF1Pct}%)`);

  // Color-code improvement
  if (result.improvement > 0) {
    p.log.message(pc.green(`Improvement: +${improvementPct}%`));
  } else if (result.improvement < 0) {
    p.log.message(pc.yellow(`Improvement: ${improvementPct}%`));
  } else {
    p.log.message(`Improvement: ${improvementPct}%`);
  }

  p.log.message('');
  p.log.message(pc.dim(`Based on ${result.dataPoints} calibration events`));

  // If preview only, stop here
  if (preview) {
    p.log.message('');
    p.log.message(pc.dim('(Preview mode - no changes applied)'));
    return 0;
  }

  // Check if threshold would change
  if (result.optimalThreshold === currentThreshold) {
    p.log.message('');
    p.log.success('Threshold is already optimal. No changes needed.');
    return 0;
  }

  // Ask for confirmation unless --force
  if (!force) {
    p.log.message('');
    const confirm = await p.confirm({
      message: `Apply new threshold ${result.optimalThreshold.toFixed(2)}?`,
      initialValue: true,
    });

    if (p.isCancel(confirm) || !confirm) {
      p.log.info('Calibration cancelled.');
      return 0;
    }
  }

  // Save new threshold
  await history.save({
    globalThreshold: result.optimalThreshold,
    skillOverrides: {},
    f1Score: result.optimalF1,
    dataPointsUsed: result.dataPoints,
    reason: 'calibration',
  });

  p.log.message('');
  p.log.success(`Threshold updated to ${result.optimalThreshold.toFixed(2)}`);
  p.log.message(pc.dim(`F1 score improved from ${currentF1Pct}% to ${optimalF1Pct}%`));

  return 0;
}

/**
 * Handle calibrate rollback command.
 */
async function handleRollback(): Promise<number> {
  const history = new ThresholdHistory();

  const rolledBack = await history.rollback(1);

  if (!rolledBack) {
    p.log.warn('Already at earliest threshold. Cannot rollback further.');
    return 0;
  }

  p.log.success(`Rolled back to threshold ${rolledBack.globalThreshold.toFixed(2)}`);
  p.log.message(pc.dim(`From: ${new Date(rolledBack.timestamp).toLocaleString()}`));
  p.log.message(pc.dim(`F1 score: ${(rolledBack.f1Score * 100).toFixed(1)}%`));
  p.log.message(pc.dim(`Reason: ${rolledBack.reason}`));

  return 0;
}

/**
 * Handle calibrate history command.
 */
async function handleHistory(): Promise<number> {
  const history = new ThresholdHistory();

  const snapshots = await history.listHistory();
  const current = await history.getCurrent();

  if (snapshots.length === 0) {
    p.log.info('No threshold history found.');
    p.log.message(pc.dim(`Default threshold: ${DEFAULT_THRESHOLD}`));
    p.log.message('Run gsd-skill calibrate to optimize threshold.');
    return 0;
  }

  p.log.message('');
  p.log.message(pc.bold('Threshold History'));
  p.log.message('');

  // Table header
  const header = `  ${'Timestamp'.padEnd(20)} ${'Threshold'.padEnd(12)} ${'F1'.padEnd(8)} Reason`;
  p.log.message(pc.dim(header));
  p.log.message(pc.dim('  ' + '-'.repeat(60)));

  for (const snapshot of snapshots) {
    const date = new Date(snapshot.timestamp).toLocaleString();
    const threshold = snapshot.globalThreshold.toFixed(2);
    const f1 = (snapshot.f1Score * 100).toFixed(1) + '%';
    const isCurrent = current?.id === snapshot.id;
    const marker = isCurrent ? pc.green('>') : ' ';

    const line = `${marker} ${date.padEnd(20)} ${threshold.padEnd(12)} ${f1.padEnd(8)} ${snapshot.reason}`;

    if (isCurrent) {
      p.log.message(pc.green(line));
    } else {
      p.log.message(line);
    }
  }

  p.log.message('');
  p.log.message(pc.dim(`Total: ${snapshots.length} snapshot(s)`));

  return 0;
}

/**
 * Handle benchmark command.
 */
async function handleBenchmark(args: string[]): Promise<number> {
  const verbose = hasFlag(args, 'verbose', 'v');
  const jsonOnly = hasFlag(args, 'json');

  const store = new CalibrationStore();
  const history = new ThresholdHistory();
  const reporter = new BenchmarkReporter();

  // Load calibration data
  const events = await store.getKnownOutcomes();

  // Get current threshold
  const currentSnapshot = await history.getCurrent();
  const threshold = currentSnapshot?.globalThreshold ?? DEFAULT_THRESHOLD;

  // Check for empty data
  if (events.length === 0) {
    if (jsonOnly) {
      const emptyReport = reporter.computeReport(events, threshold, false);
      console.log(reporter.formatJSON(emptyReport));
    } else {
      p.log.warn('No calibration data available.');
      p.log.message('Continue using skills to collect calibration data.');
    }
    return 0;
  }

  // Compute report
  const report = reporter.computeReport(events, threshold, verbose);

  // Always write JSON file (per CONTEXT.md)
  const jsonPath = reporter.getJSONPath();
  try {
    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, reporter.formatJSON(report), 'utf-8');
  } catch {
    // Best effort - don't fail the command if we can't write JSON
  }

  // Display report
  if (jsonOnly) {
    console.log(reporter.formatJSON(report));
  } else {
    console.log(reporter.formatTerminal(report, verbose));
    p.log.message(pc.dim(`JSON written to: ${jsonPath}`));
  }

  // Exit code 1 if correlation below target (per CAL-04)
  if (report.correlation < CORRELATION_TARGET) {
    return 1;
  }

  return 0;
}

// ============================================================================
// Help Text
// ============================================================================

/**
 * Generate help text for calibrate and benchmark commands.
 */
export function calibrateHelp(): string {
  return `
gsd-skill calibrate - Optimize activation threshold

Usage:
  gsd-skill calibrate [options]
  gsd-skill calibrate rollback
  gsd-skill calibrate history

Options:
  --preview        Show proposed changes without applying
  --force, -f      Skip confirmation prompt

Subcommands:
  rollback         Revert to previous threshold
  history          Show threshold history

Examples:
  gsd-skill calibrate                # Optimize and confirm
  gsd-skill calibrate --preview      # Preview only
  gsd-skill calibrate rollback       # Undo last calibration
  gsd-skill calibrate history        # View all thresholds

gsd-skill benchmark - Measure simulator accuracy

Usage:
  gsd-skill benchmark [options]

Options:
  --verbose, -v    Show per-skill breakdown
  --json           Output JSON only

Examples:
  gsd-skill benchmark               # Summary view
  gsd-skill benchmark --verbose     # Detailed breakdown
  gsd-skill benchmark --json        # JSON output

Calibration Workflow:
  1. Use skills normally - activation events are recorded automatically
  2. Wait until you have at least ${MIN_SAMPLES} events with known outcomes
  3. Run 'gsd-skill calibrate' to find optimal threshold
  4. Review the preview and confirm to apply
  5. Run 'gsd-skill benchmark' to verify improvement

Target correlation: ${CORRELATION_TARGET}%
Exit code 1 if benchmark correlation is below target.
`;
}

// ============================================================================
// Main Command Handler
// ============================================================================

/**
 * Main entry point for the calibrate command.
 *
 * @param args - Command-line arguments after 'calibrate'
 * @returns Exit code (0 for success, 1 for failure)
 */
export async function calibrateCommand(args: string[]): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const subcommand = nonFlagArgs[0];

  switch (subcommand) {
    case 'rollback':
      return handleRollback();

    case 'history':
      return handleHistory();

    case 'benchmark':
      return handleBenchmark(args.slice(1));

    case 'help':
    case '--help':
    case '-h':
      console.log(calibrateHelp());
      return 0;

    case undefined:
    default:
      // Main calibrate command or unknown subcommand
      // If it's a flag or undefined, run calibrate
      if (!subcommand || subcommand.startsWith('-')) {
        return handleCalibrate(args);
      }

      // Unknown subcommand
      p.log.error(`Unknown subcommand: ${subcommand}`);
      console.log(calibrateHelp());
      return 1;
  }
}

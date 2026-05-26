/**
 * CLI command for the semantic-channel advisory drift check over DACP bundles.
 *
 * Reads a DACP bundle directory via `src/semantic-channel/`'s read-only
 * adapter, derives the three-part-bundle triad, computes a size-based
 * channel-capacity upper bound, and (when a baseline bundle is supplied)
 * emits an advisory `DriftFinding` per `checkSemanticDriftIfEnabled`.
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * ADVISORY-ONLY. Exit code is always 0 regardless of drift severity — the
 * CAPCOM handoff retains full authority over enforcement decisions and is
 * not perturbed by this command.
 *
 * @module cli/commands/dacp-drift-check
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { access } from 'node:fs/promises';

import {
  capacityFitsBudget,
  checkSemanticDriftIfEnabled,
  computeCapacityBound,
  computeChannelState,
  isSemanticChannelEnabled,
} from '../../semantic-channel/index.js';

// ============================================================================
// Help
// ============================================================================

function showDacpDriftCheckHelp(): void {
  console.log(`
skill-creator dacp drift-check - Advisory semantic-channel drift check

Usage:
  skill-creator dacp drift-check --bundle <path> [--baseline <path>] [options]
  skill-creator dp dc --bundle <path> [--baseline <path>] [options]

Reads a DACP bundle directory via the semantic-channel read-only adapter,
computes a channel-capacity upper bound, and (when a baseline is supplied)
emits an advisory drift finding per the Xu rate-distortion inequality.

ADVISORY-ONLY: exit code is always 0; CAPCOM retains enforcement authority.
Drift check requires the 'mathematical-foundations.semantic-channel.enabled'
flag in .claude/gsd-skill-creator.json — without it the report includes the
capacity bound but skips the drift comparison.

Options:
  --bundle <path>     DACP bundle directory to inspect (required)
  --baseline <path>   Prior bundle to compare against (optional)
  --threshold <N>     Override drift threshold (0..1, default 0.25)
  --max-bits <N>      Report whether the capacity bound fits in N bits
  --quiet, -q         Machine-readable CSV output
  --json              JSON output
  --help, -h          Show this help
`);
}

// ============================================================================
// Helpers
// ============================================================================

function getFlagValue(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx < 0 || idx === args.length - 1) return null;
  return args[idx + 1] ?? null;
}

function parseFiniteNumber(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Advisory semantic-channel drift check over DACP bundles.
 *
 * @param args - Command-line arguments (after 'dacp drift-check')
 * @returns Exit code (always 0 on advisory paths; 1 only on argument /
 *          filesystem errors that prevent the command from running).
 */
export async function dacpDriftCheckCommand(
  args: string[],
): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showDacpDriftCheckHelp();
    return 0;
  }

  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  const bundlePath = getFlagValue(args, '--bundle');
  const baselinePath = getFlagValue(args, '--baseline');
  const threshold = parseFiniteNumber(getFlagValue(args, '--threshold'));
  const maxBits = parseFiniteNumber(getFlagValue(args, '--max-bits'));

  if (!bundlePath) {
    if (json) {
      console.log(
        JSON.stringify({ error: 'missing-required-flag', flag: '--bundle' }),
      );
    } else if (!quiet) {
      p.log.error(
        'dacp drift-check requires --bundle <path>. See --help.',
      );
    }
    return 1;
  }

  if (!(await pathExists(bundlePath))) {
    if (json) {
      console.log(
        JSON.stringify({ error: 'bundle-not-found', path: bundlePath }),
      );
    } else if (!quiet) {
      p.log.error(`Bundle directory not found: ${bundlePath}`);
    }
    return 1;
  }

  let currentState;
  try {
    currentState = await computeChannelState(bundlePath);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'unknown read error';
    if (json) {
      console.log(
        JSON.stringify({ error: 'bundle-read-failed', message }),
      );
    } else if (!quiet) {
      p.log.error(`Failed to read bundle at ${bundlePath}: ${message}`);
    }
    return 1;
  }

  const capacity = computeCapacityBound(currentState.triad);
  const fitsBudget =
    maxBits !== null ? capacityFitsBudget(capacity, maxBits) : null;

  let drift = null;
  let driftSkippedReason: string | null = null;
  if (baselinePath) {
    if (!(await pathExists(baselinePath))) {
      if (json) {
        console.log(
          JSON.stringify({
            error: 'baseline-not-found',
            path: baselinePath,
          }),
        );
      } else if (!quiet) {
        p.log.error(`Baseline bundle directory not found: ${baselinePath}`);
      }
      return 1;
    }
    let baselineState;
    try {
      baselineState = await computeChannelState(baselinePath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'unknown read error';
      if (json) {
        console.log(
          JSON.stringify({ error: 'baseline-read-failed', message }),
        );
      } else if (!quiet) {
        p.log.error(
          `Failed to read baseline bundle at ${baselinePath}: ${message}`,
        );
      }
      return 1;
    }
    const driftOptions =
      threshold !== null ? { threshold } : {};
    drift = checkSemanticDriftIfEnabled(
      baselineState,
      currentState,
      driftOptions,
    );
    if (drift === null) {
      driftSkippedReason = isSemanticChannelEnabled()
        ? 'semantic-channel returned null (config edge)'
        : 'mathematical-foundations.semantic-channel.enabled is off';
    }
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          bundle: bundlePath,
          baseline: baselinePath ?? null,
          fidelity: currentState.fidelity,
          dacpFidelityLevel: currentState.manifest.fidelity_level,
          capacity,
          fitsBudget,
          drift,
          driftSkippedReason,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  if (quiet) {
    const driftSeverity = drift?.severity ?? 'n/a';
    const weakened = drift?.weakened ? '1' : '0';
    const totalBytes = Math.ceil(capacity.totalBits / 8);
    console.log(
      `${bundlePath},${baselinePath ?? ''},L${currentState.manifest.fidelity_level},${totalBytes},${driftSeverity},${weakened}`,
    );
    return 0;
  }

  // Text (styled) output
  p.log.message(pc.bold('Semantic-Channel Drift Check (advisory)'));
  p.log.message(pc.dim('─'.repeat(40)));
  p.log.message(`Bundle: ${pc.cyan(bundlePath)}`);
  p.log.message(
    `DACP fidelity level: ${pc.cyan(`L${currentState.manifest.fidelity_level}`)} ` +
      `(intent=${currentState.fidelity.intent} data=${currentState.fidelity.data} code=${currentState.fidelity.code})`,
  );

  const totalKb = (capacity.totalBits / 8 / 1024).toFixed(2);
  p.log.message(
    `Capacity bound: ${pc.cyan(String(capacity.totalBits))} bits ` +
      `(intent=${capacity.intentBits} data=${capacity.dataBits} code=${capacity.codeBits}) ~${totalKb} KiB`,
  );
  if (fitsBudget !== null && maxBits !== null) {
    const verdict = fitsBudget
      ? pc.green(`fits ${maxBits}-bit budget`)
      : pc.yellow(`exceeds ${maxBits}-bit budget`);
    p.log.message(`Budget check: ${verdict}`);
  }

  if (!baselinePath) {
    p.log.message('');
    p.log.info(
      'No --baseline supplied; skipping drift comparison. Pass --baseline <path> to compare.',
    );
    return 0;
  }

  if (drift === null) {
    p.log.message('');
    p.log.warn(
      `Drift comparison skipped: ${driftSkippedReason ?? 'unknown reason'}.`,
    );
    p.log.info(
      'Enable in .claude/gsd-skill-creator.json under mathematical-foundations.semantic-channel.enabled.',
    );
    return 0;
  }

  p.log.message('');
  const driftTag =
    drift.severity === 'warn'
      ? pc.yellow('WARN')
      : pc.green('info');
  p.log.message(`Drift finding (${driftTag}): ${drift.summary}`);
  p.log.message(
    `  intent=${drift.perComponent.intent.toFixed(3)} ` +
      `data=${drift.perComponent.data.toFixed(3)} ` +
      `code=${drift.perComponent.code.toFixed(3)} ` +
      `(threshold=${drift.threshold.toFixed(3)})`,
  );
  if (drift.weakened) {
    p.log.warn(
      'Per-component fidelity WEAKENED relative to baseline. Advisory only — CAPCOM retains enforcement authority.',
    );
  }

  return 0;
}

/**
 * CLI command for the bounded-learning calibration loop.
 *
 * Reads operator acceptance decisions from
 * `.planning/patterns/suggestions.json`, maps them to [-1, 1] observations,
 * runs them through the anytime-valid e-process in
 * `src/anytime-valid/`, and reports the resulting threshold
 * recommendation. With `--apply`, atomically writes the recommended new
 * value back to `.planning/skill-creator.json` (refusing on concurrent
 * edits).
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * Exit codes:
 *   0 — success (hold, dry-run, or applied)
 *   1 — invalid flag or argument
 *   2 — config file not found / unreadable
 *
 * Wired thresholds:
 *   - `suggestions.min_occurrences`         (v1.49.795)
 *   - `suggestions.cooldown_days`           (v1.49.796)
 *   - `suggestions.auto_dismiss_after_days` (v1.49.797)
 *   - `token_budget.warn_at_percent`        (v1.49.798)
 *
 * Every invocation appends a single JSON line to
 * `.planning/patterns/bounded-learning-log.jsonl` (configurable via
 * `--audit-log <path>`; disable with `--no-audit-log`). Appends are
 * best-effort — failures never block the CLI (v1.49.799).
 *
 * Observation sources are now per-threshold-class (introduced v1.49.798):
 * `suggestions.*` thresholds read operator accept/dismiss decisions from
 * `.planning/patterns/suggestions.json`; `token_budget.*` thresholds have
 * no observation source captured yet, so the calibration loop returns
 * `direction: hold` with `observations: 0` — honest "wire exists, source
 * not yet captured" baseline. See `bounded-learning/observation-sources.ts`.
 *
 * Direction interpretation for wired sources: accept-skew ⇒ DECREASE,
 * dismiss-skew ⇒ INCREASE.
 *   - For `cooldown_days`, DECREASE means re-surface sooner.
 *   - For `auto_dismiss_after_days`, DECREASE means auto-dismiss sooner.
 *   - For `token_budget.warn_at_percent`, the direction is per-event
 *     response semantics (not yet defined — source unwired).
 *
 * @module cli/commands/bounded-learning
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  DEFAULT_AUDIT_LOG_PATH,
  appendAuditLogEntry,
  applyRecommendation,
  buildAuditLogEntry,
  loadObservationsForThreshold,
  observationSourceFor,
  runCalibrationLoop,
  readThresholdValue,
  type CalibratableThreshold,
  type CalibrationRecommendation,
} from '../../bounded-learning/index.js';

const DEFAULT_THRESHOLD: CalibratableThreshold = 'suggestions.min_occurrences';
const SUPPORTED_THRESHOLDS: CalibratableThreshold[] = [
  'suggestions.min_occurrences',
  'suggestions.cooldown_days',
  'suggestions.auto_dismiss_after_days',
  'token_budget.warn_at_percent',
];

const DEFAULT_SUGGESTIONS_PATH = join(process.cwd(), '.planning', 'patterns', 'suggestions.json');
const DEFAULT_CONFIG_PATH = join(process.cwd(), '.planning', 'skill-creator.json');

// ============================================================================
// Help
// ============================================================================

function showBoundedLearningHelp(): void {
  console.log(`
skill-creator bounded-learning - Calibration loop for skill-creator thresholds

Usage:
  skill-creator bounded-learning [options]
  skill-creator bl [options]

Reads operator accept/dismiss decisions from
.planning/patterns/suggestions.json, feeds them through an anytime-valid
e-process (Ville's inequality, alpha = 0.05 by default), and reports a
recommended adjustment to a configuration threshold when there is
statistically sound evidence.

ANYTIME-VALID: the e-process result is safe to consult at any sample size
without inflating Type-I error (sequential testing under optional
stopping). Single-step adjustment only — recommended new value is
\`currentValue ± 1\` clamped at 1.

Options:
  --threshold <key>    Calibration target (default ${DEFAULT_THRESHOLD}).
                       Supported: ${SUPPORTED_THRESHOLDS.join(', ')}
  --alpha <N>          Type-I error level (default 0.05)
  --lambda <N>         Martingale rate (default 0.5)
  --suggestions <path> Path to suggestions.json (default .planning/patterns/suggestions.json)
  --config <path>      Path to skill-creator.json (default .planning/skill-creator.json)
  --apply              Apply the recommendation to skill-creator.json (default: dry-run)
  --audit-log <path>   Override audit-log JSONL path (default .planning/patterns/bounded-learning-log.jsonl)
  --no-audit-log       Disable audit-log writes for this invocation
  --quiet, -q          Machine-readable CSV output
  --json               JSON output
  --help, -h           Show this help

Exit codes: 0 success | 1 invalid flag | 2 config not found.
`);
}

// ============================================================================
// Argument parsing
// ============================================================================

type FlagLookup =
  | { present: false }
  | { present: true; value: string | null };

function getFlagValue(args: string[], flag: string): FlagLookup {
  const idx = args.indexOf(flag);
  if (idx < 0) return { present: false };
  if (idx === args.length - 1) return { present: true, value: null };
  return { present: true, value: args[idx + 1] ?? null };
}

function parsePositiveFloat(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseThresholdKey(raw: string | null): CalibratableThreshold | null {
  if (raw === null) return null;
  return (SUPPORTED_THRESHOLDS as string[]).includes(raw)
    ? (raw as CalibratableThreshold)
    : null;
}

// ============================================================================
// Config loading
// ============================================================================

async function loadConfig(path: string): Promise<unknown | null> {
  if (!existsSync(path)) return null;
  const raw = await readFile(path, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ============================================================================
// Output renderers
// ============================================================================

function renderText(
  rec: CalibrationRecommendation,
  applied: 'dry-run' | 'applied' | 'noop',
  applyReason: string | null,
): void {
  const source = observationSourceFor(rec.threshold);
  p.log.info(`bounded-learning calibration — ${rec.threshold}`);
  console.log('');
  console.log(`  ${pc.dim('current value:')}     ${rec.currentValue}`);
  console.log(`  ${pc.dim('observation source:')} ${source.sourceId}${source.wired ? '' : pc.yellow(' (NOT YET CAPTURED)')}`);
  console.log(`  ${pc.dim('observations:')}      ${rec.observations}`);
  console.log(`  ${pc.dim('mean observation:')}  ${rec.meanObservation.toFixed(4)}`);
  console.log(`  ${pc.dim('evidence (E_t):')}    ${rec.evidence.toFixed(4)}`);
  console.log(`  ${pc.dim('rejection threshold:')} ${rec.rejectionThreshold.toFixed(4)} (= 1/α at α=${rec.alpha})`);
  console.log(`  ${pc.dim('rejected H_0:')}      ${rec.rejected ? pc.green('YES') : pc.yellow('NO')}`);
  console.log(`  ${pc.dim('direction:')}         ${rec.direction.toUpperCase()}`);
  if (rec.proposedValue !== null) {
    console.log(`  ${pc.dim('proposed value:')}    ${pc.bold(String(rec.proposedValue))} (${rec.currentValue} → ${rec.proposedValue})`);
  } else {
    console.log(`  ${pc.dim('proposed value:')}    ${pc.dim('(no change)')}`);
  }
  console.log('');
  console.log(`  ${pc.dim('reason:')} ${rec.reason}`);
  console.log('');
  if (applied === 'applied') {
    p.log.success(`Applied: ${rec.threshold} = ${rec.proposedValue}`);
  } else if (applied === 'dry-run') {
    p.log.info(`Dry-run: pass --apply to write skill-creator.json`);
  } else if (applyReason) {
    p.log.info(applyReason);
  }
}

function renderQuiet(
  rec: CalibrationRecommendation,
  applied: 'dry-run' | 'applied' | 'noop',
): void {
  console.log(
    [
      rec.threshold,
      rec.currentValue,
      rec.proposedValue ?? '',
      rec.direction,
      rec.rejected ? 'rejected' : 'held',
      rec.observations,
      rec.evidence.toFixed(4),
      rec.alpha,
      applied,
    ].join(','),
  );
}

function renderJson(
  rec: CalibrationRecommendation,
  applied: 'dry-run' | 'applied' | 'noop',
  applyReason: string | null,
): void {
  const source = observationSourceFor(rec.threshold);
  console.log(
    JSON.stringify(
      {
        threshold: rec.threshold,
        currentValue: rec.currentValue,
        proposedValue: rec.proposedValue,
        direction: rec.direction,
        rejected: rec.rejected,
        evidence: rec.evidence,
        rejectionThreshold: rec.rejectionThreshold,
        observations: rec.observations,
        meanObservation: rec.meanObservation,
        alpha: rec.alpha,
        reason: rec.reason,
        applied,
        applyReason,
        observationSource: {
          sourceId: source.sourceId,
          wired: source.wired,
          description: source.description,
        },
      },
      null,
      2,
    ),
  );
}

// ============================================================================
// Command Entry Point
// ============================================================================

export async function boundedLearningCommand(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showBoundedLearningHelp();
    return 0;
  }

  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');
  const apply = args.includes('--apply');

  // ── Parse --threshold ──────────────────────────────────────────────────
  const thresholdLookup = getFlagValue(args, '--threshold');
  let threshold: CalibratableThreshold;
  if (!thresholdLookup.present) {
    threshold = DEFAULT_THRESHOLD;
  } else {
    const parsed = parseThresholdKey(thresholdLookup.value);
    if (parsed === null) {
      if (json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--threshold', value: thresholdLookup.value, supported: SUPPORTED_THRESHOLDS }));
      } else if (!quiet) {
        p.log.error(`--threshold must be one of: ${SUPPORTED_THRESHOLDS.join(', ')}; got '${thresholdLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    threshold = parsed;
  }

  // ── Parse --alpha ──────────────────────────────────────────────────────
  const alphaLookup = getFlagValue(args, '--alpha');
  let alpha: number | undefined;
  if (alphaLookup.present) {
    const parsed = parsePositiveFloat(alphaLookup.value);
    if (parsed === null || parsed >= 1) {
      if (json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--alpha', value: alphaLookup.value }));
      } else if (!quiet) {
        p.log.error(`--alpha must be in (0, 1); got '${alphaLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    alpha = parsed;
  }

  // ── Parse --lambda ─────────────────────────────────────────────────────
  const lambdaLookup = getFlagValue(args, '--lambda');
  let lambda: number | undefined;
  if (lambdaLookup.present) {
    const parsed = parsePositiveFloat(lambdaLookup.value);
    if (parsed === null) {
      if (json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--lambda', value: lambdaLookup.value }));
      } else if (!quiet) {
        p.log.error(`--lambda must be positive; got '${lambdaLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    lambda = parsed;
  }

  // ── Resolve paths ──────────────────────────────────────────────────────
  const suggestionsLookup = getFlagValue(args, '--suggestions');
  const suggestionsPath = suggestionsLookup.present && suggestionsLookup.value !== null
    ? suggestionsLookup.value
    : DEFAULT_SUGGESTIONS_PATH;

  const configLookup = getFlagValue(args, '--config');
  const configPath = configLookup.present && configLookup.value !== null
    ? configLookup.value
    : DEFAULT_CONFIG_PATH;

  // ── Read current threshold value from config ───────────────────────────
  const config = await loadConfig(configPath);
  if (config === null) {
    if (json) {
      console.log(JSON.stringify({ error: 'config-not-found', path: configPath }));
    } else if (!quiet) {
      p.log.error(`Could not read config at ${configPath}.`);
    }
    return 2;
  }
  const currentValue = readThresholdValue(config, threshold);
  if (currentValue === undefined) {
    if (json) {
      console.log(JSON.stringify({ error: 'threshold-not-in-config', threshold, path: configPath }));
    } else if (!quiet) {
      p.log.error(`Threshold ${threshold} not found in config at ${configPath}.`);
    }
    return 2;
  }

  // ── Load observations from per-class source (v1.49.798) ────────────────
  const observations = await loadObservationsForThreshold(threshold, { suggestionsPath });

  // ── Run calibration loop ───────────────────────────────────────────────
  const loopConfig: { alpha?: number; lambda?: number } = {};
  if (alpha !== undefined) loopConfig.alpha = alpha;
  if (lambda !== undefined) loopConfig.lambda = lambda;
  const recommendation = runCalibrationLoop(threshold, currentValue, observations, loopConfig);

  // ── Apply (or dry-run) ─────────────────────────────────────────────────
  const outcome = await applyRecommendation(recommendation, { apply, configPath });
  const appliedKind: 'dry-run' | 'applied' | 'noop' =
    outcome.kind === 'applied' ? 'applied'
      : outcome.kind === 'dry-run' ? 'dry-run'
      : 'noop';
  const applyReason = outcome.kind === 'noop' ? outcome.reason : null;

  // ── Append to audit log (v1.49.799) ────────────────────────────────────
  const noAuditLog = args.includes('--no-audit-log');
  if (!noAuditLog) {
    const auditLogLookup = getFlagValue(args, '--audit-log');
    const auditLogPath = auditLogLookup.present && auditLogLookup.value !== null
      ? auditLogLookup.value
      : DEFAULT_AUDIT_LOG_PATH;
    const entry = buildAuditLogEntry(recommendation, appliedKind);
    try {
      await appendAuditLogEntry(entry, { path: auditLogPath });
    } catch {
      // Audit log is best-effort — failures here MUST NOT block the
      // operator's CLI invocation. Surface in JSON output via a warning
      // field; silent in text/quiet renderers.
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (json) {
    renderJson(recommendation, appliedKind, applyReason);
  } else if (quiet) {
    renderQuiet(recommendation, appliedKind);
  } else {
    renderText(recommendation, appliedKind, applyReason);
  }
  return 0;
}

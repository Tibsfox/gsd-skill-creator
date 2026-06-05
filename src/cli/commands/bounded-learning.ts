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
 * `--query` mode (v1.49.804): read an append-only JSONL log
 * (`--log audit|events`) and emit filtered entries in text / quiet / JSON.
 * Filters: `--last N`, `--since <ISO>`, `--threshold <key>` (audit only),
 * `--kind responsive|ignored` (events only). Read-only consumer surface
 * for the three append-only logs shipped v799–v803.
 *
 * `--watch` mode (v1.49.800): re-runs the calibration loop whenever
 * `--suggestions` or `--config` is rewritten on disk. Debounce window
 * defaults to 200ms; override via `--watch-debounce <ms>`. Stops on
 * SIGINT (Ctrl+C) for interactive use; tests inject an AbortSignal via
 * the `watchSignal` option to the command function.
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
  DEFAULT_TOKEN_BUDGET_EVENTS_PATH,
  DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH,
  appendAuditLogEntry,
  appendTokenBudgetEvent,
  appendTokenBudgetMaxEvent,
  applyRecommendation,
  buildAuditLogEntry,
  loadObservationsForThreshold,
  observationSourceFor,
  readAuditLog,
  readTokenBudgetEvents,
  runCalibrationLoop,
  runWatchLoop,
  readThresholdValue,
  type AuditLogEntry,
  type CalibratableThreshold,
  type CalibrationRecommendation,
  type TokenBudgetEvent,
  type TokenBudgetEventKind,
  type TokenBudgetMaxEvent,
  type TokenBudgetMaxEventKind,
} from '../../bounded-learning/index.js';
import {
  DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH,
  appendPredictiveLowConfidenceEvent,
  type PredictiveLowConfidenceEvent,
  type PredictiveLowConfidenceEventKind,
} from '../../bounded-learning/predictive-low-confidence-events.js';
import {
  DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH,
  appendObservationRetentionEvent,
  type ObservationRetentionEvent,
  type ObservationRetentionEventKind,
} from '../../bounded-learning/observation-retention-events.js';
import { getFlagValue } from '../lib/flag-lookup.js';

const DEFAULT_THRESHOLD: CalibratableThreshold = 'suggestions.min_occurrences';
const SUPPORTED_THRESHOLDS: CalibratableThreshold[] = [
  'suggestions.min_occurrences',
  'suggestions.cooldown_days',
  'suggestions.auto_dismiss_after_days',
  'token_budget.warn_at_percent',
  'token_budget.max_percent',
  'predictive.low_confidence_threshold',
  'observation.retention_days',
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
  --token-budget-events <path>
                       Path to token-budget-events.jsonl (default .planning/patterns/token-budget-events.jsonl)
  --token-budget-max-events <path>
                       Path to token-budget-max-events.jsonl
                       (default .planning/patterns/token-budget-max-events.jsonl; v1.49.888)
  --predictive-low-confidence-events <path>
                       Path to predictive-low-confidence-events.jsonl
                       (default .planning/patterns/predictive-low-confidence-events.jsonl; v1.49.837)
  --config <path>      Path to skill-creator.json (default .planning/skill-creator.json)
  --apply              Apply the recommendation to skill-creator.json (default: dry-run)
  --audit-log <path>   Override audit-log JSONL path (default .planning/patterns/bounded-learning-log.jsonl)
  --no-audit-log       Disable audit-log writes for this invocation
  --watch              Re-run loop on suggestions.json or skill-creator.json changes (cross-session calibration)
  --watch-debounce <ms> Watch-mode debounce window (default 200ms; only with --watch)
  --summary            Emit JSON summary of all wired thresholds + audit-log state (v1.49.801)
  --record-event       Record an operator-outcome event (v1.49.803 / v1.49.837).
                       Default branch: token-budget. --kind responsive|ignored.
                       With --threshold predictive.low_confidence_threshold:
                       predictive branch. --kind useful|not_useful (v837).
  --kind <responsive|ignored | useful|not_useful>
                       Operator outcome after a warn / fallback event (with --record-event)
                       or events-log filter (with --query --log events).
  --usage-percent <N>  usagePercent reading at warn time (with --record-event, token-budget branch).
  --warn-at-percent <N>  warn_at_percent threshold at warn time (with --record-event, token-budget branch).
  --current-skill <S>  skill that triggered the fallback (with --record-event, predictive branch; v837).
  --max-score <N>      max prediction score at fallback time (with --record-event, predictive branch; v837).
  --threshold-value <N>  lowConfidenceThreshold value in effect (with --record-event, predictive branch; v837).
  --reason <string>    Free-form operator note (optional, with --record-event).
  --query              Query an append-only JSONL log (v1.49.804).
  --log <audit|events> With --query: pick log (default audit).
                       audit = bounded-learning-log.jsonl (loop history),
                       events = token-budget-events.jsonl (operator outcomes).
  --last <N>           With --query: return the last N entries (default unlimited).
  --since <ISO>        With --query: filter entries whose timestamp >= ISO 8601.
  --quiet, -q          Machine-readable CSV output
  --json               JSON output
  --help, -h           Show this help

Exit codes: 0 success | 1 invalid flag | 2 config not found.
`);
}

// ============================================================================
// Argument parsing
// ============================================================================

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
  applied: 'dry-run' | 'applied' | 'noop' | 'refused',
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
  } else if (applied === 'refused') {
    p.log.warn(applyReason ?? `Refused: ${rec.threshold} apply blocked by safety guard.`);
  } else if (applyReason) {
    p.log.info(applyReason);
  }
}

function renderQuiet(
  rec: CalibrationRecommendation,
  applied: 'dry-run' | 'applied' | 'noop' | 'refused',
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
  applied: 'dry-run' | 'applied' | 'noop' | 'refused',
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
// Per-tick helper (v1.49.800)
// ============================================================================

interface TickContext {
  threshold: CalibratableThreshold;
  alpha: number | undefined;
  lambda: number | undefined;
  suggestionsPath: string;
  tokenBudgetEventsPath: string;
  tokenBudgetMaxEventsPath: string;
  configPath: string;
  auditLogPath: string;
  apply: boolean;
  json: boolean;
  quiet: boolean;
  noAuditLog: boolean;
  /**
   * Override the observation-retention events path (used for BOTH loading
   * retention observations and the v982 bidirectional apply-guard). Defaults
   * to the module default; injected by tests. (v1.49.982)
   */
  retentionEventsPath?: string;
}

/**
 * Run a single calibration tick: load config, load observations, run the
 * loop, apply, append audit log, render output. Returns the exit code
 * for this tick. Called once for one-shot mode and on every debounced
 * change in --watch mode.
 */
async function runCalibrationTick(ctx: TickContext): Promise<number> {
  const config = await loadConfig(ctx.configPath);
  if (config === null) {
    if (ctx.json) {
      console.log(JSON.stringify({ error: 'config-not-found', path: ctx.configPath }));
    } else if (!ctx.quiet) {
      p.log.error(`Could not read config at ${ctx.configPath}.`);
    }
    return 2;
  }
  const currentValue = readThresholdValue(config, ctx.threshold);
  if (currentValue === undefined) {
    if (ctx.json) {
      console.log(JSON.stringify({ error: 'threshold-not-in-config', threshold: ctx.threshold, path: ctx.configPath }));
    } else if (!ctx.quiet) {
      p.log.error(`Threshold ${ctx.threshold} not found in config at ${ctx.configPath}.`);
    }
    return 2;
  }

  const loadOptions: {
    suggestionsPath: string;
    tokenBudgetEventsPath: string;
    tokenBudgetMaxEventsPath: string;
    observationRetentionEventsPath?: string;
  } = {
    suggestionsPath: ctx.suggestionsPath,
    tokenBudgetEventsPath: ctx.tokenBudgetEventsPath,
    tokenBudgetMaxEventsPath: ctx.tokenBudgetMaxEventsPath,
  };
  if (ctx.retentionEventsPath !== undefined) {
    loadOptions.observationRetentionEventsPath = ctx.retentionEventsPath;
  }
  const observations = await loadObservationsForThreshold(ctx.threshold, loadOptions);

  const loopConfig: { alpha?: number; lambda?: number } = {};
  if (ctx.alpha !== undefined) loopConfig.alpha = ctx.alpha;
  if (ctx.lambda !== undefined) loopConfig.lambda = ctx.lambda;
  const recommendation = runCalibrationLoop(ctx.threshold, currentValue, observations, loopConfig);

  const applyOptions: { apply: boolean; configPath: string; retentionEventsPath?: string } = {
    apply: ctx.apply,
    configPath: ctx.configPath,
  };
  if (ctx.retentionEventsPath !== undefined) {
    applyOptions.retentionEventsPath = ctx.retentionEventsPath;
  }
  const outcome = await applyRecommendation(recommendation, applyOptions);
  // `refused` (v982): a change was recommended but a safety guard blocked the
  // write. Recorded as a first-class audit/render state (forensically distinct
  // from a plain noop), with the reason surfaced and a non-zero exit so
  // scripts/CI catch it.
  const refused = outcome.kind === 'refused';
  const appliedKind: 'dry-run' | 'applied' | 'noop' | 'refused' =
    outcome.kind === 'applied' ? 'applied'
      : outcome.kind === 'dry-run' ? 'dry-run'
      : outcome.kind === 'refused' ? 'refused'
      : 'noop';
  const applyReason =
    outcome.kind === 'noop' || outcome.kind === 'refused' ? outcome.reason : null;

  if (!ctx.noAuditLog) {
    const entry = buildAuditLogEntry(recommendation, appliedKind);
    try {
      await appendAuditLogEntry(entry, { path: ctx.auditLogPath });
    } catch {
      // Audit log is best-effort.
    }
  }

  if (ctx.json) {
    renderJson(recommendation, appliedKind, applyReason);
  } else if (ctx.quiet) {
    renderQuiet(recommendation, appliedKind);
  } else {
    renderText(recommendation, appliedKind, applyReason);
  }
  return refused ? 1 : 0;
}

// ============================================================================
// Command Entry Point
// ============================================================================

export interface BoundedLearningCommandOptions {
  /** Abort signal for --watch mode cooperative shutdown (test-only hook). */
  watchSignal?: AbortSignal;
  /**
   * Override the observation-retention events path for both the load side and
   * the v982 bidirectional apply-guard (test-only hook; production reads the
   * module default at `.planning/patterns/observation-retention-events.jsonl`).
   */
  retentionEventsPath?: string;
}

export async function boundedLearningCommand(args: string[], options: BoundedLearningCommandOptions = {}): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showBoundedLearningHelp();
    return 0;
  }

  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');
  const apply = args.includes('--apply');

  // ── --summary mode (v1.49.801) ─────────────────────────────────────────
  if (args.includes('--summary')) {
    return runSummary(args);
  }

  // ── --record-event mode (v1.49.803) ────────────────────────────────────
  if (args.includes('--record-event')) {
    return runRecordEvent(args, { json, quiet });
  }

  // ── --query mode (v1.49.804) ───────────────────────────────────────────
  if (args.includes('--query')) {
    return runQuery(args, { json, quiet });
  }

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

  const tokenBudgetEventsLookup = getFlagValue(args, '--token-budget-events');
  const tokenBudgetEventsPath = tokenBudgetEventsLookup.present && tokenBudgetEventsLookup.value !== null
    ? tokenBudgetEventsLookup.value
    : DEFAULT_TOKEN_BUDGET_EVENTS_PATH;

  const tokenBudgetMaxEventsLookup = getFlagValue(args, '--token-budget-max-events');
  const tokenBudgetMaxEventsPath = tokenBudgetMaxEventsLookup.present && tokenBudgetMaxEventsLookup.value !== null
    ? tokenBudgetMaxEventsLookup.value
    : DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH;

  const configLookup = getFlagValue(args, '--config');
  const configPath = configLookup.present && configLookup.value !== null
    ? configLookup.value
    : DEFAULT_CONFIG_PATH;

  const noAuditLog = args.includes('--no-audit-log');
  const auditLogLookup = getFlagValue(args, '--audit-log');
  const auditLogPath = auditLogLookup.present && auditLogLookup.value !== null
    ? auditLogLookup.value
    : DEFAULT_AUDIT_LOG_PATH;

  const ctx: TickContext = {
    threshold,
    alpha,
    lambda,
    suggestionsPath,
    tokenBudgetEventsPath,
    tokenBudgetMaxEventsPath,
    configPath,
    auditLogPath,
    apply,
    json,
    quiet,
    noAuditLog,
    ...(options.retentionEventsPath !== undefined ? { retentionEventsPath: options.retentionEventsPath } : {}),
  };

  // ── Watch mode (v1.49.800) ─────────────────────────────────────────────
  const watch = args.includes('--watch');
  if (watch) {
    const debounceLookup = getFlagValue(args, '--watch-debounce');
    const debounceMs = debounceLookup.present
      ? parsePositiveFloat(debounceLookup.value) ?? 200
      : 200;
    return runInWatchMode(ctx, debounceMs, options.watchSignal);
  }

  // ── One-shot mode ──────────────────────────────────────────────────────
  return runCalibrationTick(ctx);
}

/**
 * --summary mode (v1.49.801): emit a JSON summary of all wired thresholds
 * + audit-log state. Consumed by `/sc:status` to surface bounded-learning
 * calibration health alongside the existing skill-budget dashboard.
 */
async function runSummary(args: string[]): Promise<number> {
  const configLookup = getFlagValue(args, '--config');
  const configPath = configLookup.present && configLookup.value !== null
    ? configLookup.value
    : DEFAULT_CONFIG_PATH;

  const auditLogLookup = getFlagValue(args, '--audit-log');
  const auditLogPath = auditLogLookup.present && auditLogLookup.value !== null
    ? auditLogLookup.value
    : DEFAULT_AUDIT_LOG_PATH;

  const config = await loadConfig(configPath);
  const entries = await readAuditLog(auditLogPath);

  // Build per-threshold summary: current value + last audit entry for it.
  const thresholdSummaries = SUPPORTED_THRESHOLDS.map((threshold) => {
    const currentValue = config !== null ? readThresholdValue(config, threshold) : undefined;
    const source = observationSourceFor(threshold);
    const matchingEntries = entries.filter((e) => e.threshold === threshold);
    const lastEntry: AuditLogEntry | undefined = matchingEntries[matchingEntries.length - 1];
    return {
      threshold,
      currentValue: currentValue ?? null,
      observationSource: {
        sourceId: source.sourceId,
        wired: source.wired,
      },
      lastTick: lastEntry === undefined ? null : {
        timestamp: lastEntry.timestamp,
        direction: lastEntry.direction,
        proposedValue: lastEntry.proposedValue,
        applied: lastEntry.applied,
      },
    };
  });

  // Pending recommendations: most recent entry per threshold where
  // direction != 'hold' AND applied == 'dry-run'.
  const pendingRecommendations = thresholdSummaries
    .filter((s) => s.lastTick !== null && s.lastTick.direction !== 'hold' && s.lastTick.applied === 'dry-run')
    .map((s) => ({
      threshold: s.threshold,
      currentValue: s.currentValue,
      proposedValue: s.lastTick?.proposedValue ?? null,
      direction: s.lastTick?.direction ?? 'hold',
    }));

  const summary = {
    thresholds: thresholdSummaries,
    auditLog: {
      path: auditLogPath,
      totalEntries: entries.length,
      lastEntryAt: entries.length > 0 ? entries[entries.length - 1]!.timestamp : null,
    },
    pendingRecommendations,
    wiredThresholdCount: SUPPORTED_THRESHOLDS.length,
  };

  console.log(JSON.stringify(summary, null, 2));
  return 0;
}

/**
 * --record-event mode: append one operator-outcome event to a JSONL log.
 *
 * Default behavior (v1.49.803, no --threshold or --threshold token_budget.*):
 *   Records to `token-budget-events.jsonl`. --kind responsive|ignored.
 *   Invoked by /sc:status and /sc:start when they emit (or follow up on) a
 *   token-budget warn line.
 *
 * v1.49.837 extension (--threshold predictive.low_confidence_threshold):
 *   Records to `predictive-low-confidence-events.jsonl`. --kind useful|not_useful.
 *   May be invoked by substrate consumers' fallback dispatch (auto-emit) or
 *   manually by the operator after reviewing a fallback's suggestions.
 *
 * Best-effort silent write per Lesson #10427 (failure-mode contracts,
 * ESTABLISHED v802). The CLI exit code reflects argument-validation
 * failures, not filesystem failures during the append.
 */
async function runRecordEvent(
  args: string[],
  flags: { json: boolean; quiet: boolean },
): Promise<number> {
  // Dispatch by threshold (default token-budget for backward-compat).
  const thresholdLookup = getFlagValue(args, '--threshold');
  const thresholdValue = thresholdLookup.present && thresholdLookup.value !== null
    ? thresholdLookup.value
    : 'token_budget.warn_at_percent';

  if (thresholdValue === 'predictive.low_confidence_threshold') {
    return runRecordPredictiveEvent(args, flags);
  }

  if (thresholdValue === 'observation.retention_days') {
    return runRecordObservationRetentionEvent(args, flags);
  }

  if (thresholdValue === 'token_budget.max_percent') {
    return runRecordTokenBudgetMaxEvent(args, flags);
  }

  // Default branch: token-budget warn event recording (v803 behavior unchanged).
  const kindLookup = getFlagValue(args, '--kind');
  if (!kindLookup.present || kindLookup.value === null) {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'missing-flag', flag: '--kind', supported: ['responsive', 'ignored'] }));
    } else if (!flags.quiet) {
      p.log.error(`--record-event requires --kind <responsive|ignored>.`);
    }
    return 1;
  }
  if (kindLookup.value !== 'responsive' && kindLookup.value !== 'ignored') {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'invalid-flag', flag: '--kind', value: kindLookup.value, supported: ['responsive', 'ignored'] }));
    } else if (!flags.quiet) {
      p.log.error(`--kind must be 'responsive' or 'ignored'; got '${kindLookup.value}'.`);
    }
    return 1;
  }
  const kind: TokenBudgetEventKind = kindLookup.value;

  const pathLookup = getFlagValue(args, '--token-budget-events');
  const path = pathLookup.present && pathLookup.value !== null
    ? pathLookup.value
    : DEFAULT_TOKEN_BUDGET_EVENTS_PATH;

  const event: TokenBudgetEvent = {
    timestamp: new Date().toISOString(),
    kind,
  };
  const usageLookup = getFlagValue(args, '--usage-percent');
  if (usageLookup.present) {
    const parsed = parsePositiveFloat(usageLookup.value);
    if (parsed !== null) event.usagePercent = parsed;
  }
  const warnAtLookup = getFlagValue(args, '--warn-at-percent');
  if (warnAtLookup.present) {
    const parsed = parsePositiveFloat(warnAtLookup.value);
    if (parsed !== null) event.warnAtPercent = parsed;
  }
  const reasonLookup = getFlagValue(args, '--reason');
  if (reasonLookup.present && reasonLookup.value !== null) {
    event.reason = reasonLookup.value;
  }

  try {
    await appendTokenBudgetEvent(event, { path });
  } catch {
    // Best-effort silent per Lesson #10427.
  }

  if (flags.json) {
    console.log(JSON.stringify({ recorded: true, event }));
  } else if (!flags.quiet) {
    p.log.success(`Recorded token-budget ${kind} event at ${event.timestamp}.`);
  }
  return 0;
}

/**
 * v1.49.837 — predictive-low-confidence event recording branch of
 * --record-event. Polarity-inverted from token-budget: --kind useful|not_useful.
 *
 * Polarity: useful → -1 (favor raising threshold; fallback fires more often);
 * not_useful → +1 (favor lowering threshold; fallback fires less often).
 *
 * Best-effort silent write per Lesson #10427.
 */
async function runRecordPredictiveEvent(
  args: string[],
  flags: { json: boolean; quiet: boolean },
): Promise<number> {
  const kindLookup = getFlagValue(args, '--kind');
  const supported = ['useful', 'not_useful'];
  if (!kindLookup.present || kindLookup.value === null) {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'missing-flag', flag: '--kind', supported }));
    } else if (!flags.quiet) {
      p.log.error(`--record-event (predictive) requires --kind <useful|not_useful>.`);
    }
    return 1;
  }
  if (kindLookup.value !== 'useful' && kindLookup.value !== 'not_useful') {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'invalid-flag', flag: '--kind', value: kindLookup.value, supported }));
    } else if (!flags.quiet) {
      p.log.error(`--kind must be 'useful' or 'not_useful'; got '${kindLookup.value}'.`);
    }
    return 1;
  }
  const kind: PredictiveLowConfidenceEventKind = kindLookup.value;

  const pathLookup = getFlagValue(args, '--predictive-low-confidence-events');
  const path = pathLookup.present && pathLookup.value !== null
    ? pathLookup.value
    : DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH;

  const event: PredictiveLowConfidenceEvent = {
    timestamp: new Date().toISOString(),
    kind,
  };
  const currentSkillLookup = getFlagValue(args, '--current-skill');
  if (currentSkillLookup.present && currentSkillLookup.value !== null) {
    event.currentSkill = currentSkillLookup.value;
  }
  const maxScoreLookup = getFlagValue(args, '--max-score');
  if (maxScoreLookup.present) {
    const parsed = parsePositiveFloat(maxScoreLookup.value);
    if (parsed !== null) event.maxScore = parsed;
  }
  const thresholdValueLookup = getFlagValue(args, '--threshold-value');
  if (thresholdValueLookup.present) {
    const parsed = parsePositiveFloat(thresholdValueLookup.value);
    if (parsed !== null) event.thresholdValue = parsed;
  }
  const reasonLookup = getFlagValue(args, '--reason');
  if (reasonLookup.present && reasonLookup.value !== null) {
    event.reason = reasonLookup.value;
  }

  try {
    await appendPredictiveLowConfidenceEvent(event, { path });
  } catch {
    // Best-effort silent per Lesson #10427.
  }

  if (flags.json) {
    console.log(JSON.stringify({ recorded: true, event }));
  } else if (!flags.quiet) {
    p.log.success(`Recorded predictive-low-confidence ${kind} event at ${event.timestamp}.`);
  }
  return 0;
}

/**
 * v1.49.884 — observation-retention event recording branch of
 * --record-event. Polarity matches token-budget (NOT predictive):
 * --kind too_aggressive|too_lax.
 *
 * Polarity: too_aggressive → -1 (favor RAISING the threshold; keep entries
 * longer); too_lax → +1 (favor LOWERING the threshold; drop entries sooner).
 *
 * Best-effort silent write per Lesson #10427.
 */
async function runRecordObservationRetentionEvent(
  args: string[],
  flags: { json: boolean; quiet: boolean },
): Promise<number> {
  const kindLookup = getFlagValue(args, '--kind');
  const supported = ['too_aggressive', 'too_lax'];
  if (!kindLookup.present || kindLookup.value === null) {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'missing-flag', flag: '--kind', supported }));
    } else if (!flags.quiet) {
      p.log.error(`--record-event (observation-retention) requires --kind <too_aggressive|too_lax>.`);
    }
    return 1;
  }
  if (kindLookup.value !== 'too_aggressive' && kindLookup.value !== 'too_lax') {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'invalid-flag', flag: '--kind', value: kindLookup.value, supported }));
    } else if (!flags.quiet) {
      p.log.error(`--kind must be 'too_aggressive' or 'too_lax'; got '${kindLookup.value}'.`);
    }
    return 1;
  }
  const kind: ObservationRetentionEventKind = kindLookup.value;

  const pathLookup = getFlagValue(args, '--observation-retention-events');
  const path = pathLookup.present && pathLookup.value !== null
    ? pathLookup.value
    : DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH;

  const event: ObservationRetentionEvent = {
    timestamp: new Date().toISOString(),
    kind,
  };
  const droppedLookup = getFlagValue(args, '--dropped-count');
  if (droppedLookup.present) {
    const parsed = parsePositiveFloat(droppedLookup.value);
    if (parsed !== null) event.droppedCount = parsed;
  }
  const retainedLookup = getFlagValue(args, '--retained-count');
  if (retainedLookup.present) {
    const parsed = parsePositiveFloat(retainedLookup.value);
    if (parsed !== null) event.retainedCount = parsed;
  }
  const retentionDaysLookup = getFlagValue(args, '--retention-days');
  if (retentionDaysLookup.present) {
    const parsed = parsePositiveFloat(retentionDaysLookup.value);
    if (parsed !== null) event.retentionDays = parsed;
  }
  const reasonLookup = getFlagValue(args, '--reason');
  if (reasonLookup.present && reasonLookup.value !== null) {
    event.reason = reasonLookup.value;
  }

  try {
    await appendObservationRetentionEvent(event, { path });
  } catch {
    // Best-effort silent per Lesson #10427.
  }

  if (flags.json) {
    console.log(JSON.stringify({ recorded: true, event }));
  } else if (!flags.quiet) {
    p.log.success(`Recorded observation-retention ${kind} event at ${event.timestamp}.`);
  }
  return 0;
}

/**
 * v1.49.888 — token-budget MAX event recording branch of --record-event.
 * Polarity matches warn-events and observation-retention (NOT predictive):
 * --kind under_budget|blocked.
 *
 * Polarity: under_budget → +1 (favor LOWERING the ceiling; operator had
 * headroom); blocked → -1 (favor RAISING the ceiling; operator was
 * blocked at the hard limit).
 *
 * Best-effort silent write per Lesson #10427.
 */
async function runRecordTokenBudgetMaxEvent(
  args: string[],
  flags: { json: boolean; quiet: boolean },
): Promise<number> {
  const kindLookup = getFlagValue(args, '--kind');
  const supported = ['under_budget', 'blocked'];
  if (!kindLookup.present || kindLookup.value === null) {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'missing-flag', flag: '--kind', supported }));
    } else if (!flags.quiet) {
      p.log.error(`--record-event (token-budget-max) requires --kind <under_budget|blocked>.`);
    }
    return 1;
  }
  if (kindLookup.value !== 'under_budget' && kindLookup.value !== 'blocked') {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'invalid-flag', flag: '--kind', value: kindLookup.value, supported }));
    } else if (!flags.quiet) {
      p.log.error(`--kind must be 'under_budget' or 'blocked'; got '${kindLookup.value}'.`);
    }
    return 1;
  }
  const kind: TokenBudgetMaxEventKind = kindLookup.value;

  const pathLookup = getFlagValue(args, '--token-budget-max-events');
  const path = pathLookup.present && pathLookup.value !== null
    ? pathLookup.value
    : DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH;

  const event: TokenBudgetMaxEvent = {
    timestamp: new Date().toISOString(),
    kind,
  };
  const usageLookup = getFlagValue(args, '--usage-percent');
  if (usageLookup.present) {
    const parsed = parsePositiveFloat(usageLookup.value);
    if (parsed !== null) event.usagePercent = parsed;
  }
  const maxPctLookup = getFlagValue(args, '--max-percent');
  if (maxPctLookup.present) {
    const parsed = parsePositiveFloat(maxPctLookup.value);
    if (parsed !== null) event.maxPercent = parsed;
  }
  const reasonLookup = getFlagValue(args, '--reason');
  if (reasonLookup.present && reasonLookup.value !== null) {
    event.reason = reasonLookup.value;
  }

  try {
    await appendTokenBudgetMaxEvent(event, { path });
  } catch {
    // Best-effort silent per Lesson #10427.
  }

  if (flags.json) {
    console.log(JSON.stringify({ recorded: true, event }));
  } else if (!flags.quiet) {
    p.log.success(`Recorded token-budget-max ${kind} event at ${event.timestamp}.`);
  }
  return 0;
}

/**
 * --query mode (v1.49.804): read an append-only JSONL log and emit the
 * filtered entries in text / quiet / JSON format. Closes the no-readback
 * gap left by the three append-only logs shipped v799–v803.
 *
 * Filters:
 *   --log audit|events   pick log (default audit)
 *   --last <N>           last N entries (default unlimited)
 *   --since <ISO>        keep entries with timestamp >= ISO 8601
 *   --threshold <key>    audit-log only: filter on entry.threshold
 *   --kind <kind>        events log only: filter on event.kind
 *
 * Read-only surface. Tolerant of malformed lines (skipped silently per
 * existing read primitives). Missing log returns empty result.
 */
async function runQuery(
  args: string[],
  flags: { json: boolean; quiet: boolean },
): Promise<number> {
  // ── Pick log ──────────────────────────────────────────────────────────
  const logLookup = getFlagValue(args, '--log');
  let log: 'audit' | 'events';
  if (!logLookup.present) {
    log = 'audit';
  } else if (logLookup.value === 'audit' || logLookup.value === 'events') {
    log = logLookup.value;
  } else {
    if (flags.json) {
      console.log(JSON.stringify({ error: 'invalid-flag', flag: '--log', value: logLookup.value, supported: ['audit', 'events'] }));
    } else if (!flags.quiet) {
      p.log.error(`--log must be 'audit' or 'events'; got '${logLookup.value ?? '<missing>'}'.`);
    }
    return 1;
  }

  // ── Parse --last ──────────────────────────────────────────────────────
  const lastLookup = getFlagValue(args, '--last');
  let last: number | null = null;
  if (lastLookup.present) {
    const parsed = parsePositiveFloat(lastLookup.value);
    if (parsed === null || !Number.isInteger(parsed)) {
      if (flags.json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--last', value: lastLookup.value }));
      } else if (!flags.quiet) {
        p.log.error(`--last must be a positive integer; got '${lastLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    last = parsed;
  }

  // ── Parse --since ─────────────────────────────────────────────────────
  const sinceLookup = getFlagValue(args, '--since');
  let sinceMs: number | null = null;
  if (sinceLookup.present) {
    if (sinceLookup.value === null) {
      if (flags.json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--since', value: null }));
      } else if (!flags.quiet) {
        p.log.error(`--since requires an ISO 8601 timestamp.`);
      }
      return 1;
    }
    const parsedMs = Date.parse(sinceLookup.value);
    if (Number.isNaN(parsedMs)) {
      if (flags.json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--since', value: sinceLookup.value }));
      } else if (!flags.quiet) {
        p.log.error(`--since must be a parseable ISO 8601 timestamp; got '${sinceLookup.value}'.`);
      }
      return 1;
    }
    sinceMs = parsedMs;
  }

  // ── Dispatch + filter ─────────────────────────────────────────────────
  if (log === 'audit') {
    const pathLookup = getFlagValue(args, '--audit-log');
    const path = pathLookup.present && pathLookup.value !== null
      ? pathLookup.value
      : DEFAULT_AUDIT_LOG_PATH;

    const thresholdLookup = getFlagValue(args, '--threshold');
    let thresholdFilter: CalibratableThreshold | null = null;
    if (thresholdLookup.present) {
      const parsed = parseThresholdKey(thresholdLookup.value);
      if (parsed === null) {
        if (flags.json) {
          console.log(JSON.stringify({ error: 'invalid-flag', flag: '--threshold', value: thresholdLookup.value, supported: SUPPORTED_THRESHOLDS }));
        } else if (!flags.quiet) {
          p.log.error(`--threshold must be one of: ${SUPPORTED_THRESHOLDS.join(', ')}; got '${thresholdLookup.value ?? '<missing>'}'.`);
        }
        return 1;
      }
      thresholdFilter = parsed;
    }

    const all = await readAuditLog(path);
    let filtered = all;
    if (thresholdFilter !== null) {
      filtered = filtered.filter((e) => e.threshold === thresholdFilter);
    }
    if (sinceMs !== null) {
      filtered = filtered.filter((e) => Date.parse(e.timestamp) >= sinceMs!);
    }
    if (last !== null && filtered.length > last) {
      filtered = filtered.slice(filtered.length - last);
    }
    renderAuditQueryResult(filtered, { json: flags.json, quiet: flags.quiet, path });
    return 0;
  }

  // log === 'events'
  const pathLookup = getFlagValue(args, '--token-budget-events');
  const path = pathLookup.present && pathLookup.value !== null
    ? pathLookup.value
    : DEFAULT_TOKEN_BUDGET_EVENTS_PATH;

  const kindLookup = getFlagValue(args, '--kind');
  let kindFilter: TokenBudgetEventKind | null = null;
  if (kindLookup.present) {
    if (kindLookup.value !== 'responsive' && kindLookup.value !== 'ignored') {
      if (flags.json) {
        console.log(JSON.stringify({ error: 'invalid-flag', flag: '--kind', value: kindLookup.value, supported: ['responsive', 'ignored'] }));
      } else if (!flags.quiet) {
        p.log.error(`--kind must be 'responsive' or 'ignored'; got '${kindLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    kindFilter = kindLookup.value;
  }

  const all = await readTokenBudgetEvents(path);
  let filtered = all;
  if (kindFilter !== null) {
    filtered = filtered.filter((e) => e.kind === kindFilter);
  }
  if (sinceMs !== null) {
    filtered = filtered.filter((e) => Date.parse(e.timestamp) >= sinceMs!);
  }
  if (last !== null && filtered.length > last) {
    filtered = filtered.slice(filtered.length - last);
  }
  renderEventsQueryResult(filtered, { json: flags.json, quiet: flags.quiet, path });
  return 0;
}

function renderAuditQueryResult(
  entries: AuditLogEntry[],
  flags: { json: boolean; quiet: boolean; path: string },
): void {
  if (flags.json) {
    console.log(JSON.stringify({ log: 'audit', path: flags.path, count: entries.length, entries }));
    return;
  }
  if (flags.quiet) {
    for (const e of entries) {
      console.log([e.timestamp, e.threshold, e.currentValue, e.proposedValue ?? '', e.direction, e.observations, e.applied].join(','));
    }
    return;
  }
  p.log.info(`bounded-learning audit log — ${flags.path}`);
  console.log('');
  if (entries.length === 0) {
    p.log.info('  (no matching entries)');
    return;
  }
  for (const e of entries) {
    const proposed = e.proposedValue === null ? '—' : String(e.proposedValue);
    console.log(`  ${e.timestamp}  ${pc.dim(e.threshold)}  ${e.currentValue}→${proposed}  ${e.direction.toUpperCase()}  obs=${e.observations}  ${pc.dim(e.applied)}`);
  }
  console.log('');
  p.log.info(`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`);
}

function renderEventsQueryResult(
  events: TokenBudgetEvent[],
  flags: { json: boolean; quiet: boolean; path: string },
): void {
  if (flags.json) {
    console.log(JSON.stringify({ log: 'events', path: flags.path, count: events.length, entries: events }));
    return;
  }
  if (flags.quiet) {
    for (const e of events) {
      console.log([e.timestamp, e.kind, e.usagePercent ?? '', e.warnAtPercent ?? '', (e.reason ?? '').replace(/,/g, ';')].join(','));
    }
    return;
  }
  p.log.info(`token-budget events log — ${flags.path}`);
  console.log('');
  if (events.length === 0) {
    p.log.info('  (no matching events)');
    return;
  }
  for (const e of events) {
    const usage = e.usagePercent === undefined ? '' : ` usage=${e.usagePercent}`;
    const warnAt = e.warnAtPercent === undefined ? '' : ` warn_at=${e.warnAtPercent}`;
    const reason = e.reason === undefined ? '' : `  ${pc.dim(e.reason)}`;
    console.log(`  ${e.timestamp}  ${e.kind.toUpperCase()}${usage}${warnAt}${reason}`);
  }
  console.log('');
  p.log.info(`${events.length} event${events.length === 1 ? '' : 's'}`);
}

/**
 * --watch mode: fire one initial tick, then re-fire on every debounced
 * change to suggestionsPath or configPath. Stops on AbortSignal abort or
 * SIGINT. Always returns 0 from this entry (ticks may individually
 * return non-zero but are not propagated; failures surface via output).
 */
async function runInWatchMode(
  ctx: TickContext,
  debounceMs: number,
  externalSignal: AbortSignal | undefined,
): Promise<number> {
  // Compose the signal: prefer external (test injection); fall back to a
  // SIGINT-driven controller for interactive use.
  let signal: AbortSignal;
  let sigintHandler: (() => void) | null = null;
  if (externalSignal) {
    signal = externalSignal;
  } else {
    const controller = new AbortController();
    sigintHandler = () => controller.abort();
    process.once('SIGINT', sigintHandler);
    signal = controller.signal;
  }

  const handle = runWatchLoop(
    [ctx.suggestionsPath, ctx.configPath],
    async () => {
      await runCalibrationTick(ctx);
    },
    { debounceMs, signal, fireImmediately: true },
  );

  try {
    await handle.done;
  } finally {
    if (sigintHandler !== null) {
      process.removeListener('SIGINT', sigintHandler);
    }
  }
  return 0;
}

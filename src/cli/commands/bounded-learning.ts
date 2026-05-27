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
  appendAuditLogEntry,
  appendTokenBudgetEvent,
  applyRecommendation,
  buildAuditLogEntry,
  loadObservationsForThreshold,
  observationSourceFor,
  readAuditLog,
  runCalibrationLoop,
  runWatchLoop,
  readThresholdValue,
  type AuditLogEntry,
  type CalibratableThreshold,
  type CalibrationRecommendation,
  type TokenBudgetEvent,
  type TokenBudgetEventKind,
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
  --token-budget-events <path>
                       Path to token-budget-events.jsonl (default .planning/patterns/token-budget-events.jsonl)
  --config <path>      Path to skill-creator.json (default .planning/skill-creator.json)
  --apply              Apply the recommendation to skill-creator.json (default: dry-run)
  --audit-log <path>   Override audit-log JSONL path (default .planning/patterns/bounded-learning-log.jsonl)
  --no-audit-log       Disable audit-log writes for this invocation
  --watch              Re-run loop on suggestions.json or skill-creator.json changes (cross-session calibration)
  --watch-debounce <ms> Watch-mode debounce window (default 200ms; only with --watch)
  --summary            Emit JSON summary of all wired thresholds + audit-log state (v1.49.801)
  --record-event       Record a token-budget event (v1.49.803). Requires --kind.
  --kind <responsive|ignored>
                       Operator outcome after a warn event (with --record-event).
  --usage-percent <N>  usagePercent reading at warn time (optional, with --record-event).
  --warn-at-percent <N>  warn_at_percent threshold at warn time (optional, with --record-event).
  --reason <string>    Free-form operator note (optional, with --record-event).
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
// Per-tick helper (v1.49.800)
// ============================================================================

interface TickContext {
  threshold: CalibratableThreshold;
  alpha: number | undefined;
  lambda: number | undefined;
  suggestionsPath: string;
  tokenBudgetEventsPath: string;
  configPath: string;
  auditLogPath: string;
  apply: boolean;
  json: boolean;
  quiet: boolean;
  noAuditLog: boolean;
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

  const observations = await loadObservationsForThreshold(ctx.threshold, {
    suggestionsPath: ctx.suggestionsPath,
    tokenBudgetEventsPath: ctx.tokenBudgetEventsPath,
  });

  const loopConfig: { alpha?: number; lambda?: number } = {};
  if (ctx.alpha !== undefined) loopConfig.alpha = ctx.alpha;
  if (ctx.lambda !== undefined) loopConfig.lambda = ctx.lambda;
  const recommendation = runCalibrationLoop(ctx.threshold, currentValue, observations, loopConfig);

  const outcome = await applyRecommendation(recommendation, { apply: ctx.apply, configPath: ctx.configPath });
  const appliedKind: 'dry-run' | 'applied' | 'noop' =
    outcome.kind === 'applied' ? 'applied'
      : outcome.kind === 'dry-run' ? 'dry-run'
      : 'noop';
  const applyReason = outcome.kind === 'noop' ? outcome.reason : null;

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
  return 0;
}

// ============================================================================
// Command Entry Point
// ============================================================================

export interface BoundedLearningCommandOptions {
  /** Abort signal for --watch mode cooperative shutdown (test-only hook). */
  watchSignal?: AbortSignal;
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
    configPath,
    auditLogPath,
    apply,
    json,
    quiet,
    noAuditLog,
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
 * --record-event mode (v1.49.803): append one operator-outcome event to the
 * token-budget-events JSONL log. Invoked by /sc:status and /sc:start skill
 * prompts when they emit (or follow up on) a token-budget warn line.
 *
 * Best-effort silent write per Lesson #10427 (failure-mode contracts,
 * ESTABLISHED v802). The CLI exit code reflects argument-validation
 * failures, not filesystem failures during the append.
 */
async function runRecordEvent(
  args: string[],
  flags: { json: boolean; quiet: boolean },
): Promise<number> {
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

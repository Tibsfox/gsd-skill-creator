/**
 * MD-6 Representation Audit — CLI command.
 *
 * Provides:
 *   `skill-creator representation-audit`  — run with default settings
 *   `skill-creator rep-audit`             — alias
 *   `skill-creator representation-audit --json`   — machine-readable output
 *   `skill-creator representation-audit --enable`  — force-enable for this run
 *   `skill-creator representation-audit --threshold=<n>`  — override r_eff threshold
 *
 * Acceptance gates implemented here:
 *   SC-MD6-01 — default off; "audit disabled" message returned when not enabled.
 *   CF-MD6-01/02 — collapse detector called; status surfaced in output.
 *   LS-39 — CRITICAL status clearly surfaced with reasons.
 *
 * Pattern mirrors `src/tractability/cli.ts`.
 *
 * @module representation-audit/cli
 */

import { runAndCacheAudit, getLatestAuditResult } from './api.js';
import type { AuditResult } from './collapse-detector.js';
import type { AuditSettings } from './settings.js';

// ─── Options ─────────────────────────────────────────────────────────────────

export interface RepresentationAuditCliOptions {
  /** Emit JSON output instead of human-readable text. */
  json?: boolean;
  /** Force-enable the audit for this invocation (overrides feature flag). */
  enable?: boolean;
  /** Override effective-rank threshold for this invocation. */
  effectiveRankThreshold?: number;
  /** Override separability-ratio threshold for this invocation. */
  separabilityRatioThreshold?: number;
  /** Logger override for testing. */
  logger?: (line: string) => void;
  /**
   * Pre-built input for the detector (used in tests to inject fixtures).
   * When absent, the CLI uses the cached result from `getLatestAuditResult()`
   * if available, otherwise runs with an empty matrix (demonstrating the
   * disabled/enabled path).
   */
  detectorInput?: Parameters<typeof runAndCacheAudit>[0];
}

const DEFAULT_LOG: (line: string) => void = (line) => {
  process.stdout.write(line + '\n');
};

// ─── Help ─────────────────────────────────────────────────────────────────────

export function representationAuditHelp(): string {
  return [
    '',
    'Usage: skill-creator representation-audit [options]',
    '       skill-creator rep-audit [options]',
    '',
    'Run the MD-6 representation-audit pass on M1 embeddings.',
    'Computes effective-rank proxy and community separability;',
    'flags CRITICAL when kernel-machine collapse is detected.',
    '',
    'Options:',
    '  --enable                Force-enable audit for this run (overrides flag)',
    '  --threshold=<n>         Override effective-rank threshold (default 0.3)',
    '  --sep-threshold=<n>     Override separability-ratio threshold (default 0.8)',
    '  --json                  Emit JSON output',
    '  --help, -h              Show this help',
    '',
    'Feature flag:',
    '  Audit is OFF by default (SC-MD6-01).',
    '  Use --enable or set enabled:true in audit settings to activate.',
    '',
    'Status levels:',
    '  OK        All metrics within thresholds.',
    '  WARNING   One or more metrics approaching threshold (within 20%).',
    '  CRITICAL  Threshold breached; kernel-machine collapse likely.',
    '  DISABLED  Feature flag is off; no computation performed.',
    '',
    'References:',
    '  Huh et al. 2023 "The Low-Rank Simplicity Bias in Deep Networks" (TMLR)',
    '  Roy & Vetterli 2007 "The effective rank" (EUSIPCO)',
    '  Thread D §5 MD-6 — kernel-collapse framing',
    '',
  ].join('\n');
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatResult(result: AuditResult): string {
  const lines: string[] = [
    '',
    `MD-6 Representation Audit`,
    `  Status:    ${result.status}`,
    `  Timestamp: ${result.timestamp}`,
    `  Summary:   ${result.summary}`,
  ];

  if (result.effectiveRankResult !== null) {
    const er = result.effectiveRankResult;
    lines.push('');
    lines.push('  Effective Rank (SVD-free column-norm proxy):');
    lines.push(`    r_eff (proxy):   ${er.effectiveRank.toFixed(4)}`);
    lines.push(`    rank_nominal:    ${er.rankNominal}`);
    lines.push(`    ratio:           ${er.ratio.toFixed(4)}`);
    lines.push(`    threshold:       ${result.thresholds.effectiveRankThreshold}`);
    lines.push(`    matrix:          ${er.rows} rows × ${er.cols} cols`);
  }

  if (result.separabilityResult !== null) {
    const sep = result.separabilityResult;
    lines.push('');
    lines.push('  Community Separability:');
    lines.push(`    within:          ${sep.within.toFixed(4)}`);
    lines.push(`    between:         ${sep.between.toFixed(4)}`);
    lines.push(`    ratio:           ${sep.ratio.toFixed(4)}`);
    lines.push(`    threshold:       ${result.thresholds.separabilityRatioThreshold}`);
    lines.push(`    within pairs:    ${sep.withinPairs}`);
    lines.push(`    between pairs:   ${sep.betweenPairs}`);
    if (sep.missingEmbeddings > 0) {
      lines.push(`    missing embeds:  ${sep.missingEmbeddings}`);
    }
  }

  if (result.criticalReasons.length > 0) {
    lines.push('');
    lines.push('  Critical reasons:');
    for (const r of result.criticalReasons) {
      lines.push(`    [!] ${r}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Execute the `representation-audit` subcommand.
 *
 * @param args    Raw CLI arguments after the command word.
 * @param options Pre-parsed options (for testing).
 * @returns exit code (0 = success/disabled, 1 = CRITICAL or error).
 */
export async function representationAuditCommand(
  args: string[],
  options: RepresentationAuditCliOptions = {},
): Promise<number> {
  const log = options.logger ?? DEFAULT_LOG;

  if (args.includes('--help') || args.includes('-h')) {
    log(representationAuditHelp());
    return 0;
  }

  const json = options.json ?? args.includes('--json');
  const enable = options.enable ?? args.includes('--enable');

  const thresholdArg = args.find((a) => a.startsWith('--threshold='));
  const erThreshold =
    options.effectiveRankThreshold ??
    (thresholdArg ? Number(thresholdArg.slice('--threshold='.length)) : undefined);

  const sepThreshArg = args.find((a) => a.startsWith('--sep-threshold='));
  const sepThreshold =
    options.separabilityRatioThreshold ??
    (sepThreshArg ? Number(sepThreshArg.slice('--sep-threshold='.length)) : undefined);

  const settingsOverride: Partial<AuditSettings> = {};
  if (enable) settingsOverride.enabled = true;
  if (erThreshold !== undefined) settingsOverride.effectiveRankThreshold = erThreshold;
  if (sepThreshold !== undefined) settingsOverride.separabilityRatioThreshold = sepThreshold;

  // If caller supplied a pre-built detector input (for testing), run it fresh.
  // Otherwise run fresh with empty input (no matrix, no communities) so the
  // feature-flag check always returns the correct DISABLED/OK status for the
  // current settings — never reading a stale cache from a prior run.
  // M8 co-evolution uses getLatestAuditResult() directly; the CLI always runs fresh.
  let result: AuditResult;
  if (options.detectorInput !== undefined) {
    result = runAndCacheAudit(options.detectorInput, settingsOverride);
  } else {
    result = runAndCacheAudit({ matrix: null, communities: null }, settingsOverride);
  }

  if (json) {
    log(JSON.stringify(result, null, 2));
    return result.status === 'CRITICAL' ? 1 : 0;
  }

  log(formatResult(result));

  if (result.status === 'CRITICAL') {
    return 1;
  }
  return 0;
}

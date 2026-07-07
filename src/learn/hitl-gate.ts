// === sc:learn HITL Gate ===
//
// Human-In-The-Loop gate for content approval. Enforces the Three Laws:
// - STRANGER content NEVER auto-approved — requires explicit user approval
// - HOME content with clean hygiene report auto-approves silently
// - HOME content with findings requires user approval
//
// Uses dependency injection (PromptFn) for testability. Default prompt
// uses @clack/prompts for CLI interaction.

import type { SanitizationResult, HygieneReport, HygieneFinding, HygieneSeverity } from './sanitizer.js';

// === Types ===

export type ApprovalStatus = 'approved' | 'approved-with-warnings' | 'rejected';

export interface HitlDecision {
  status: ApprovalStatus;
  rationale: string;
  reviewedFindings: number;
  decidedAt: string;
  decidedBy: 'user' | 'auto';
}

export interface HitlGateResult {
  decision: HitlDecision;
  sanitizationResult: SanitizationResult;
  proceed: boolean;
}

// The optional `report` gives non-interactive prompt implementations the
// structured hygiene report (notably `report.passed`, which is false when any
// finding is `critical`) so they can refuse to auto-approve critical content.
// The interactive default prompt ignores it — the human sees findings inline.
export type PromptFn = (
  message: string,
  choices: string[],
  report?: HygieneReport,
) => Promise<string>;

export interface HitlGateOptions {
  /**
   * Override the hard-block on critical hygiene findings. Off by default, so a
   * source with critical findings (prompt-injection, script, path-traversal,
   * control chars) is rejected even under an auto-approving promptFn. Set only
   * after a human has reviewed the findings (CLI: `--force-critical`).
   */
  forceCritical?: boolean;
}

// === Main Entry Point ===

export async function hitlGate(
  sanitizationResult: SanitizationResult,
  promptFn?: PromptFn,
  options?: HitlGateOptions,
): Promise<HitlGateResult> {
  // Auto-approve clean local files
  if (sanitizationResult.autoApproved) {
    return {
      decision: {
        status: 'approved',
        rationale: 'Auto-approved: local source with clean hygiene report',
        reviewedFindings: 0,
        decidedAt: new Date().toISOString(),
        decidedBy: 'auto',
      },
      sanitizationResult,
      proceed: true,
    };
  }

  // Hard-block on critical hygiene findings BEFORE prompting. `report.passed`
  // is false whenever a critical is present (prompt-injection, script,
  // path-traversal, null bytes, directional overrides). Enforcing it centrally
  // means no caller — interactive, `--yes`, or autonomous arxiv ingest — can
  // wave a critical STRANGER finding through via an auto-approving promptFn.
  // This restores the Three Laws invariant ("critical → review required").
  const gateReport = sanitizationResult.report;
  const hasCritical = gateReport.findings.some((f) => f.severity === 'critical');
  if ((hasCritical || gateReport.passed === false) && !options?.forceCritical) {
    return {
      decision: {
        status: 'rejected',
        rationale:
          'Blocked: source contains critical hygiene findings ' +
          '(prompt-injection / script / path-traversal / control characters). ' +
          'Re-run with --force-critical after manual review to override.',
        reviewedFindings: gateReport.findings.length,
        decidedAt: new Date().toISOString(),
        decidedBy: 'auto',
      },
      sanitizationResult,
      proceed: false,
    };
  }

  // Build prompt message with formatted findings
  const formattedFindings = formatFindings(sanitizationResult.report);
  const source = sanitizationResult.source;
  const findingCount = sanitizationResult.report.findings.length;

  const message = [
    '=== sc:learn Hygiene Review ===',
    `Source: ${source.input} (${source.familiarity})`,
    '',
    formattedFindings,
    '',
    findingCount > 0
      ? 'Review the findings above.'
      : 'No issues found, but internet-sourced content requires manual approval.',
  ].join('\n');

  const choices: ApprovalStatus[] = ['approved', 'approved-with-warnings', 'rejected'];

  // Use injected promptFn or fall back to default. Pass the report so
  // non-interactive prompts can gate on severity (report.passed).
  const prompt = promptFn ?? defaultPromptFn;
  const response = await prompt(message, choices, sanitizationResult.report) as ApprovalStatus;

  const decision: HitlDecision = {
    status: response,
    rationale: response === 'approved'
      ? 'User approved content after review'
      : response === 'approved-with-warnings'
        ? 'User approved content with acknowledged warnings'
        : 'User rejected content',
    reviewedFindings: findingCount,
    decidedAt: new Date().toISOString(),
    decidedBy: 'user',
  };

  return {
    decision,
    sanitizationResult,
    proceed: response !== 'rejected',
  };
}

// === Format Findings ===

export function formatFindings(report: HygieneReport): string {
  const lines: string[] = [];

  lines.push(`Hygiene Report (${report.tier} tier) \u2014 ${report.summary}`);
  lines.push(`Checked: ${report.checkedAt}`);
  lines.push('');

  if (report.findings.length === 0) {
    lines.push('  No issues found.');
    return lines.join('\n');
  }

  // Group findings by severity (critical first, then warning, then info)
  const severityOrder: HygieneSeverity[] = ['critical', 'warning', 'info'];

  for (const severity of severityOrder) {
    const group = report.findings
      .filter(f => f.severity === severity)
      .sort((a, b) => a.category.localeCompare(b.category));

    if (group.length === 0) continue;

    lines.push(`${severity.toUpperCase()} (${group.length}):`);

    for (const finding of group) {
      lines.push(`  [${finding.category}] ${finding.description}`);
      lines.push(`    Evidence: ${finding.evidence}`);
      lines.push(`    Recommendation: ${finding.recommendation}`);
      lines.push(`    Location: ${finding.location}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// === Default Prompt Function ===

async function defaultPromptFn(message: string, choices: string[]): Promise<string> {
  // Dynamic import to avoid loading clack in test environments
  const p = await import('@clack/prompts');

  p.note(message, 'sc:learn Hygiene Review');

  const result = await p.select({
    message: 'Approve this content for knowledge extraction?',
    options: choices.map(c => ({ value: c, label: c })),
  });

  if (p.isCancel(result)) {
    return 'rejected';
  }

  return result as string;
}

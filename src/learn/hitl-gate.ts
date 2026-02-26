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

export type PromptFn = (message: string, choices: string[]) => Promise<string>;

// === Main Entry Point ===

export async function hitlGate(
  sanitizationResult: SanitizationResult,
  promptFn?: PromptFn,
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

  // Use injected promptFn or fall back to default
  const prompt = promptFn ?? defaultPromptFn;
  const response = await prompt(message, choices) as ApprovalStatus;

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

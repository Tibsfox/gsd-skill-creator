/**
 * Skilldex Auditor — finding emitter.
 *
 * Serialises AuditFinding / AuditReport values to a JSON shape consumable by
 * the session-observatory and similar passive observers. The emitter is pure:
 * it returns strings or writes to a caller-provided sink. It NEVER writes
 * into `.claude/skills/`, `.agents/skills/`, or `examples/`.
 *
 * @module skilldex-auditor/finding-emitter
 */

import type { AuditFinding, AuditReport, AuditSeverity } from './types.js';

/**
 * The disk-backed envelope for a finding: serialised JSON line plus version.
 */
export interface FindingEnvelope {
  readonly schema: 'skilldex-auditor.finding/v1';
  readonly emittedAt: string;
  readonly finding: AuditFinding;
}

/**
 * The disk-backed envelope for a report.
 */
export interface ReportEnvelope {
  readonly schema: 'skilldex-auditor.report/v1';
  readonly emittedAt: string;
  readonly report: AuditReport;
}

/**
 * Wrap a single finding in its envelope and return JSON text.
 */
export function emitFinding(
  finding: AuditFinding,
  now: () => Date = () => new Date(),
): string {
  const env: FindingEnvelope = {
    schema: 'skilldex-auditor.finding/v1',
    emittedAt: now().toISOString(),
    finding,
  };
  return JSON.stringify(env);
}

/**
 * Wrap an entire report and return JSON text.
 */
export function emitReport(
  report: AuditReport,
  now: () => Date = () => new Date(),
): string {
  const env: ReportEnvelope = {
    schema: 'skilldex-auditor.report/v1',
    emittedAt: now().toISOString(),
    report,
  };
  return JSON.stringify(env);
}

/**
 * Round-trip parse: emitFinding output → FindingEnvelope. Throws on schema
 * mismatch so callers can fail loudly.
 */
export function parseFinding(json: string): FindingEnvelope {
  const obj = JSON.parse(json) as unknown;
  if (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as Record<string, unknown>).schema === 'skilldex-auditor.finding/v1'
  ) {
    return obj as FindingEnvelope;
  }
  throw new Error('parseFinding: schema mismatch');
}

/**
 * Round-trip parse: emitReport output → ReportEnvelope. Throws on mismatch.
 */
export function parseReport(json: string): ReportEnvelope {
  const obj = JSON.parse(json) as unknown;
  if (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as Record<string, unknown>).schema === 'skilldex-auditor.report/v1'
  ) {
    return obj as ReportEnvelope;
  }
  throw new Error('parseReport: schema mismatch');
}

/**
 * Compute a summary {pass, warn, fail} count from a finding list.
 */
export function summarise(findings: ReadonlyArray<AuditFinding>): {
  pass: number;
  warn: number;
  fail: number;
} {
  const out: Record<AuditSeverity, number> = { pass: 0, warn: 0, fail: 0 };
  for (const f of findings) out[f.severity] += 1;
  return out;
}
